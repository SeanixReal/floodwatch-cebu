import { useEffect, useId, useRef } from 'react'
import L from 'leaflet'
import { Pane, SVGOverlay, useMap } from 'react-leaflet'
import { rainAreas } from '../data/sample'
import type { RainMode } from '../state/AppState'

/* --------------------------------------------------------------------------
   Where it is raining, drawn over the map like a weather-radar patch.

   - Lives in its own pane between the basemap tiles (z 200) and the road
     canvas (z 400), so the status-coloured roads are never tinted by it.
   - The SVG has no viewBox. Cloud shapes are sized in % of the overlay, so
     they grow and shrink with the map; the falling-drop pattern is sized in
     screen pixels, so drops stay the same size at any zoom instead of turning
     into long bars when someone pinches in.
   - Both areas (light and heavy) stay mounted and cross-fade, so pressing
     Heavy rain reads as a storm rolling in rather than a picture swap.
   -------------------------------------------------------------------------- */

type Cell = { cx: number; cy: number; rx: number; ry: number }

/* Overlapping ellipses make an irregular cloud. Numbers are % of the area. */
const HEAVY_CELLS: Cell[] = [
  { cx: 50, cy: 52, rx: 36, ry: 31 },
  { cx: 34, cy: 36, rx: 25, ry: 21 },
  { cx: 67, cy: 44, rx: 23, ry: 21 },
  { cx: 51, cy: 70, rx: 26, ry: 18 },
]
const HEAVY_CORE: Cell = { cx: 53, cy: 60, rx: 17, ry: 14 }

const LIGHT_CELLS: Cell[] = [
  { cx: 50, cy: 50, rx: 34, ry: 28 },
  { cx: 36, cy: 60, rx: 22, ry: 18 },
  { cx: 64, cy: 40, rx: 20, ry: 17 },
]

const KM_PER_DEG_LAT = 110.6
const kmPerDegLon = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180)

/** A box that is square on the ground, so a round cloud stays round. */
function areaBounds(center: [number, number], radiusKm: number): L.LatLngBoundsExpression {
  const half = radiusKm * 1.3
  const dLat = half / KM_PER_DEG_LAT
  const dLon = half / kmPerDegLon(center[0])
  return [
    [center[0] - dLat, center[1] - dLon],
    [center[0] + dLat, center[1] + dLon],
  ]
}

/** Where the area's tag sits: up and to the left of centre, clear of pins. */
function labelPoint(center: [number, number], radiusKm: number): L.LatLngExpression {
  return [
    center[0] + (radiusKm * 0.62) / KM_PER_DEG_LAT,
    center[1] - (radiusKm * 0.62) / kmPerDegLon(center[0]),
  ]
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function RainOverlay({ mode }: { mode: RainMode }) {
  return (
    <Pane name="rain" style={{ zIndex: 350, pointerEvents: 'none' }}>
      <RainArea kind="normal" active={mode === 'normal'} />
      <RainArea kind="heavy" active={mode === 'heavy'} />
      <RainLabels mode={mode} />
    </Pane>
  )
}

/* -------------------------------------------------------------------------- */

function RainArea({ kind, active }: { kind: RainMode; active: boolean }) {
  /* useId returns ":r3:"-style ids; colons are not safe inside url(#...). */
  const id = `rain-${kind}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const area = rainAreas[kind]
  const heavy = kind === 'heavy'
  const cells = heavy ? HEAVY_CELLS : LIGHT_CELLS
  const reduced = prefersReducedMotion()

  /* Drop tile, in screen pixels. Heavy rain: denser, faster, longer drops. */
  const tile = heavy ? { w: 15, h: 22 } : { w: 24, h: 32 }
  const drops = heavy
    ? [
        { x: 3, y: 2, len: 8 },
        { x: 11, y: 13, len: 7 },
      ]
    : [{ x: 6, y: 4, len: 6 }]

  return (
    <SVGOverlay
      bounds={areaBounds(area.center, area.radiusKm)}
      interactive={false}
      attributes={{ 'aria-hidden': 'true' }}
    >
      <defs>
        {/* Blue wash, strongest in the middle of each cell. */}
        <radialGradient id={`${id}-wash`}>
          <stop offset="0%" style={{ stopColor: 'var(--rain)', stopOpacity: heavy ? 0.28 : 0.2 }} />
          <stop offset="60%" style={{ stopColor: 'var(--rain)', stopOpacity: heavy ? 0.16 : 0.11 }} />
          <stop offset="100%" style={{ stopColor: 'var(--rain)', stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={`${id}-core`}>
          <stop offset="0%" style={{ stopColor: 'var(--rain-core)', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: 'var(--rain-core)', stopOpacity: 0 }} />
        </radialGradient>

        {/* Alpha-only mask so drops fade out toward the edge of the cloud.
            Alpha masking means no literal colour is needed here. */}
        <radialGradient id={`${id}-fade`}>
          <stop offset="0%" style={{ stopColor: 'var(--rain)', stopOpacity: 1 }} />
          <stop offset="65%" style={{ stopColor: 'var(--rain)', stopOpacity: 0.55 }} />
          <stop offset="100%" style={{ stopColor: 'var(--rain)', stopOpacity: 0 }} />
        </radialGradient>
        <mask id={`${id}-mask`} style={{ maskType: 'alpha' }}>
          {cells.map((c, i) => (
            <Ellipse key={i} cell={c} fill={`url(#${id}-fade)`} />
          ))}
        </mask>

        {/* Falling drops. The pattern slides down exactly one tile per cycle,
            so the loop is seamless. */}
        <pattern
          id={`${id}-drops`}
          width={tile.w}
          height={tile.h}
          patternUnits="userSpaceOnUse"
        >
          {drops.map((d, i) => (
            <line
              key={i}
              x1={d.x + 1.5}
              y1={d.y}
              x2={d.x}
              y2={d.y + d.len}
              stroke="var(--rain-core)"
              strokeWidth={heavy ? 1.4 : 1.2}
              strokeLinecap="round"
              opacity={heavy ? 0.6 : 0.45}
            />
          ))}
          {!reduced && (
            <animateTransform
              attributeName="patternTransform"
              type="translate"
              from="0 0"
              to={`0 ${tile.h}`}
              dur={heavy ? '0.38s' : '0.7s'}
              repeatCount="indefinite"
            />
          )}
        </pattern>
      </defs>

      <g className={`rain-cloud${active ? ' is-on' : ''}`}>
        <g className="rain-drift">
          {cells.map((c, i) => (
            <Ellipse key={i} cell={c} fill={`url(#${id}-wash)`} />
          ))}
          {heavy && <Ellipse cell={HEAVY_CORE} fill={`url(#${id}-core)`} />}
          <rect
            width="100%"
            height="100%"
            fill={`url(#${id}-drops)`}
            mask={`url(#${id}-mask)`}
          />
        </g>
      </g>
    </SVGOverlay>
  )
}

function Ellipse({ cell, fill }: { cell: Cell; fill: string }) {
  return (
    <ellipse
      cx={`${cell.cx}%`}
      cy={`${cell.cy}%`}
      rx={`${cell.rx}%`}
      ry={`${cell.ry}%`}
      fill={fill}
    />
  )
}

/* --------------------------------------------------------------------------
   A small tag on each area, so nobody has to guess what the blue patch is.
   Markers sit above the roads; created once and faded with a class.
   -------------------------------------------------------------------------- */

const CLOUD_RAIN_ICON =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>'

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )

function RainLabels({ mode }: { mode: RainMode }) {
  const map = useMap()
  const labels = useRef<{ kind: RainMode; marker: L.Marker }[]>([])
  const modeRef = useRef(mode)
  modeRef.current = mode

  const sync = () => {
    for (const { kind, marker } of labels.current) {
      marker
        .getElement()
        ?.querySelector('.rain-label')
        ?.classList.toggle('is-on', kind === modeRef.current)
    }
  }

  useEffect(() => {
    const created = (Object.keys(rainAreas) as RainMode[]).map((kind) => {
      const area = rainAreas[kind]
      const icon = L.divIcon({
        className: '',
        html: `<div class="rain-label">${CLOUD_RAIN_ICON}<span>${escapeHtml(area.label)}</span></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      const marker = L.marker(labelPoint(area.center, area.radiusKm), {
        icon,
        interactive: false,
        keyboard: false,
      }).addTo(map)
      return { kind, marker }
    })
    labels.current = created
    /* Next frame, so the fade-in transition has a starting state to run from. */
    const raf = requestAnimationFrame(sync)

    return () => {
      cancelAnimationFrame(raf)
      created.forEach(({ marker }) => marker.remove())
      labels.current = []
    }
    /* sync only reads refs, so it is deliberately not a dependency. */
  }, [map])

  useEffect(sync, [mode])

  return null
}
