/* ==========================================================================
   One-time road fetch for FloodWatch Cebu.

     npm run fetch:roads

   Queries the OpenStreetMap Overpass API for the major roads inside the Cebu
   City boundary, groups them into named streets, simplifies the geometry,
   works out which streets touch which, and writes src/data/roads.geojson.

   THE APP NEVER RUNS THIS. It imports the committed .geojson file, so the
   demo works with the Wi-Fi switched off. Re-run it only when you want
   fresher road data.

   Data (c) OpenStreetMap contributors, ODbL 1.0.
   ========================================================================== */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'roads.geojson',
)

/* Overpass mirrors, tried in order. Regional mirrors (e.g. overpass.osm.ch)
   are deliberately left out - they only carry their own country's extract and
   answer a Cebu query with an empty, and very convincing, success. */
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/* Overpass rate-limits anonymous clients, so identify the script. */
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'application/json',
  'User-Agent':
    'FloodWatchCebu-prototype/0.1 (university project; one-time road export)',
}

/* Cebu City proper. `admin_level=6` is the city boundary in PH OSM data. */
const QUERY = `
[out:json][timeout:180];
area["boundary"="administrative"]["admin_level"="6"]["name"="Cebu City"]->.city;
(
  way["highway"~"^(primary|secondary|tertiary)$"](area.city);
);
out geom;
`

/* Tuning. */
const SIMPLIFY_TOLERANCE_M = 12
const MIN_WAY_LENGTH_M = 60
const MIN_STREET_LENGTH_M = 200
const TOUCHING_DISTANCE_M = 45

/* --- Geometry helpers ----------------------------------------------------- */

type Pt = [number, number] // [lon, lat]

/** Metres between two lon/lat points (equirectangular, fine at city scale). */
function metres(a: Pt, b: Pt) {
  const R = 6371000
  const rad = Math.PI / 180
  const x = (b[0] - a[0]) * rad * Math.cos(((a[1] + b[1]) / 2) * rad)
  const y = (b[1] - a[1]) * rad
  return Math.sqrt(x * x + y * y) * R
}

/** Perpendicular distance from p to segment a-b, in metres. */
function segDistance(p: Pt, a: Pt, b: Pt) {
  const rad = Math.PI / 180
  const scale = Math.cos(((a[1] + b[1]) / 2) * rad)
  const ax = a[0] * scale
  const ay = a[1]
  const bx = b[0] * scale
  const by = b[1]
  const px = p[0] * scale
  const py = p[1]
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return metres(p, a)
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return metres(p, [(ax + t * dx) / scale, ay + t * dy])
}

/** Douglas-Peucker simplification, tolerance in metres. */
function simplify(points: Pt[], tolerance: number): Pt[] {
  if (points.length <= 2) return points
  let maxDist = 0
  let index = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = segDistance(points[i], points[0], points[points.length - 1])
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]]
  const left = simplify(points.slice(0, index + 1), tolerance)
  const right = simplify(points.slice(index), tolerance)
  return [...left.slice(0, -1), ...right]
}

const round = (p: Pt): Pt => [Number(p[0].toFixed(5)), Number(p[1].toFixed(5))]

function pathLength(points: Pt[]) {
  let total = 0
  for (let i = 1; i < points.length; i++) total += metres(points[i - 1], points[i])
  return total
}

/** Stable, readable id from a street name. */
function slug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function rank(kind: string) {
  return kind === 'primary' ? 3 : kind === 'secondary' ? 2 : 1
}

/* --- Fetch ---------------------------------------------------------------- */

interface OverpassWay {
  type: 'way'
  id: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

async function fetchWays(): Promise<OverpassWay[]> {
  let lastError: unknown
  for (const endpoint of ENDPOINTS) {
    try {
      process.stdout.write(`Querying ${endpoint} ... `)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: HEADERS,
        body: 'data=' + encodeURIComponent(QUERY),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { elements: OverpassWay[] }
      const ways = json.elements.filter((e) => e.type === 'way' && e.geometry?.length)
      /* An empty answer is a failure, not a result: never overwrite good road
         data with nothing. */
      if (!ways.length) throw new Error('no ways returned')
      console.log(`${ways.length} ways`)
      return ways
    } catch (err) {
      console.log(`failed (${(err as Error).message})`)
      lastError = err
    }
  }
  throw lastError ?? new Error('All Overpass endpoints failed')
}

/* --- Build ---------------------------------------------------------------- */

interface Street {
  id: string
  name: string
  kind: string
  /* One entry per OSM way. Kept separate rather than stitched end to end: the
     two carriageways of a divided avenue share a name but are not one line,
     and joining them draws a hairpin back down the street. */
  parts: Pt[][]
  fullParts: Pt[][]
}

/** Streets touch when any of their points come within TOUCHING_DISTANCE_M. */
function buildAdjacency(streets: Street[]): Record<string, string[]> {
  const CELL = 0.0025 // ~250 m
  const grid = new Map<string, { id: string; pt: Pt }[]>()

  for (const s of streets) {
    for (const part of s.fullParts) {
      for (const pt of part) {
        const k = `${Math.floor(pt[0] / CELL)}:${Math.floor(pt[1] / CELL)}`
        const cell = grid.get(k)
        if (cell) cell.push({ id: s.id, pt })
        else grid.set(k, [{ id: s.id, pt }])
      }
    }
  }

  const adj = new Map<string, Set<string>>()
  for (const s of streets) adj.set(s.id, new Set())

  for (const s of streets) {
    for (const part of s.fullParts) {
      for (const pt of part) {
        const cx = Math.floor(pt[0] / CELL)
        const cy = Math.floor(pt[1] / CELL)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (const entry of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
              if (entry.id === s.id) continue
              if (metres(pt, entry.pt) < TOUCHING_DISTANCE_M) {
                adj.get(s.id)!.add(entry.id)
                adj.get(entry.id)!.add(s.id)
              }
            }
          }
        }
      }
    }
  }

  const out: Record<string, string[]> = {}
  for (const [id, set] of adj) out[id] = [...set].sort()
  return out
}

/** Midpoint of the longest part, used for pins and labels. */
function midpoint(parts: Pt[][]): Pt {
  const longest = parts.reduce(
    (a, b) => (pathLength(b) > pathLength(a) ? b : a),
    parts[0],
  )
  return longest[Math.floor(longest.length / 2)]
}

async function main() {
  const ways = await fetchWays()

  const named = ways.filter((w) => w.tags?.name)
  console.log(`Named ways: ${named.length}`)

  /* Group ways into streets by name. */
  const byId = new Map<string, Street>()
  for (const w of named) {
    const name = w.tags!.name!
    const coords = w.geometry!.map((g) => [g.lon, g.lat] as Pt)
    if (pathLength(coords) < MIN_WAY_LENGTH_M) continue

    const id = slug(name)
    const existing = byId.get(id)
    if (existing) {
      existing.fullParts.push(coords)
      if (rank(w.tags!.highway!) > rank(existing.kind)) existing.kind = w.tags!.highway!
    } else {
      byId.set(id, {
        id,
        name,
        kind: w.tags!.highway!,
        parts: [],
        fullParts: [coords],
      })
    }
  }

  let streets = [...byId.values()]
  console.log(`Named streets: ${streets.length}`)

  streets = streets.filter(
    (s) => s.fullParts.reduce((a, p) => a + pathLength(p), 0) >= MIN_STREET_LENGTH_M,
  )
  console.log(`After length filter: ${streets.length}`)

  /* Adjacency runs on the FULL geometry, before simplifying. Crossing OSM ways
     share a node exactly, but simplification throws those junction vertices
     away - computing it afterwards loses most connections, and the flood then
     has nowhere to spread. */
  const adjacency = buildAdjacency(streets)

  for (const s of streets) {
    s.parts = s.fullParts
      .map((p) => simplify(p, SIMPLIFY_TOLERANCE_M).map(round))
      .filter((p) => p.length >= 2)
  }
  streets = streets.filter((s) => s.parts.length > 0)

  const neighbourCount = Object.values(adjacency).reduce((a, b) => a + b.length, 0)
  const isolated = streets.filter((s) => (adjacency[s.id] ?? []).length === 0).length
  console.log(`Adjacency links: ${neighbourCount / 2}`)
  console.log(`Isolated streets: ${isolated}`)

  const collection = {
    type: 'FeatureCollection' as const,
    /* Recorded so it is obvious where this came from and when. */
    generated: new Date().toISOString().slice(0, 10),
    source: 'OpenStreetMap contributors, via the Overpass API',
    license: 'ODbL 1.0',
    area: 'Cebu City',
    features: streets.map((s) => ({
      type: 'Feature' as const,
      id: s.id,
      properties: {
        id: s.id,
        name: s.name,
        kind: s.kind,
        at: midpoint(s.parts),
        neighbours: (adjacency[s.id] ?? []).filter((id) => byId.has(id)),
      },
      geometry: { type: 'MultiLineString' as const, coordinates: s.parts },
    })),
  }

  mkdirSync(dirname(OUT), { recursive: true })
  const json = JSON.stringify(collection)
  writeFileSync(OUT, json)
  console.log(`\nWrote ${OUT}`)
  console.log(
    `${collection.features.length} streets, ${Math.round(
      Buffer.byteLength(json) / 1024,
    )} KB`,
  )
}

main().catch((err) => {
  console.error('\nFailed to build roads.geojson:', err)
  process.exit(1)
})
