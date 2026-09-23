/* ==========================================================================
   Road data for FloodWatch Cebu.

   Loads the committed src/data/roads.geojson - real Cebu City street geometry
   exported once from OpenStreetMap by scripts/fetch-roads.ts. The file is
   bundled, so the app never touches the network for road data and the demo
   survives bad Wi-Fi.

   Road geometry (c) OpenStreetMap contributors, ODbL 1.0.
   ========================================================================== */

/* Imported as text and parsed here: Vite serves unknown extensions as asset
   URLs, and we want the data itself, bundled. */
import raw from './roads.geojson?raw'

export type LonLat = [number, number]
export type LatLng = [number, number]

export interface RoadProperties {
  id: string
  name: string
  kind: 'primary' | 'secondary' | 'tertiary'
  /* Midpoint of the longest segment - used for pins and for centring. */
  at: LonLat
  /* Ids of the streets this one touches. Drives how flooding spreads. */
  neighbours: string[]
}

export interface RoadFeature {
  type: 'Feature'
  id: string
  properties: RoadProperties
  geometry: { type: 'MultiLineString'; coordinates: LonLat[][] }
}

interface RoadCollection {
  type: 'FeatureCollection'
  generated: string
  source: string
  license: string
  area: string
  features: RoadFeature[]
}

const collection = JSON.parse(raw) as RoadCollection

export const roadMeta = {
  generated: collection.generated,
  source: collection.source,
  license: collection.license,
  area: collection.area,
}

export const roads: RoadFeature[] = collection.features

export const roadIndex: Map<string, RoadFeature> = new Map(
  roads.map((r) => [r.properties.id, r]),
)

export function getRoad(id: string | undefined): RoadFeature | undefined {
  return id ? roadIndex.get(id) : undefined
}

export function roadName(id: string | undefined): string {
  return getRoad(id)?.properties.name ?? 'Unknown road'
}

/** Roads sorted by name, for pickers. */
export const roadsByName: RoadFeature[] = [...roads].sort((a, b) =>
  a.properties.name.localeCompare(b.properties.name),
)

/* --- Geometry helpers ----------------------------------------------------- */

/** GeoJSON is [lon, lat]; Leaflet wants [lat, lon]. */
export const toLatLng = ([lon, lat]: LonLat): LatLng => [lat, lon]

export function roadLatLngs(road: RoadFeature): LatLng[][] {
  return road.geometry.coordinates.map((part) => part.map(toLatLng))
}

export function roadCentre(road: RoadFeature): LatLng {
  return toLatLng(road.properties.at)
}

/**
 * The road closest to a point, and how far away it is in metres. Used when
 * someone drops a pin: warnings are per road, so a pin watches its nearest one.
 * Flat-earth maths is plenty accurate at city scale.
 */
export function nearestRoad([lat, lng]: LatLng): { road: RoadFeature; metres: number } {
  const mPerLat = 110_574
  const mPerLng = 111_320 * Math.cos((lat * Math.PI) / 180)

  let best = roads[0]
  let bestSq = Infinity

  for (const road of roads) {
    for (const part of road.geometry.coordinates) {
      for (let i = 1; i < part.length; i++) {
        /* Segment end points, in metres relative to the query point. */
        const ax = (part[i - 1][0] - lng) * mPerLng
        const ay = (part[i - 1][1] - lat) * mPerLat
        const bx = (part[i][0] - lng) * mPerLng
        const by = (part[i][1] - lat) * mPerLat
        const dx = bx - ax
        const dy = by - ay
        const lenSq = dx * dx + dy * dy
        const t = lenSq ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq)) : 0
        const px = ax + t * dx
        const py = ay + t * dy
        const dSq = px * px + py * py
        if (dSq < bestSq) {
          bestSq = dSq
          best = road
        }
      }
    }
  }

  return { road: best, metres: Math.sqrt(bestSq) }
}

/* --- Spreading ------------------------------------------------------------ */

/**
 * Breadth-first rings out from a set of seed roads, following the adjacency
 * graph built by the fetch script. Ring 0 is the seeds themselves.
 *
 * This is what makes the simulated flood look like water finding its way
 * through connected low-lying streets rather than random roads flashing.
 */
export function floodRings(seedIds: string[], depth: number): string[][] {
  const seeds = seedIds.filter((id) => roadIndex.has(id))
  const seen = new Set(seeds)
  const rings: string[][] = [seeds]

  let frontier = seeds
  for (let i = 0; i < depth; i++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const nb of roadIndex.get(id)?.properties.neighbours ?? []) {
        if (!seen.has(nb) && roadIndex.has(nb)) {
          seen.add(nb)
          next.push(nb)
        }
      }
    }
    if (!next.length) break
    rings.push(next)
    frontier = next
  }

  return rings
}
