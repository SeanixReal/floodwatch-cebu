import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getRoad,
  roadCentre,
  roadLatLngs,
  roads,
  type LatLng,
} from '../data/roads'
import { cityView, statusFromRisk, statusLabels, type FloodStatus } from '../data/sample'
import { riskColor, themeColor } from '../theme'
import type { RiskMap } from '../state/floodSim'
import type { RainMode } from '../state/AppState'
import { RainOverlay } from './RainOverlay'

/* --------------------------------------------------------------------------
   The map of Cebu City.

   Real OpenStreetMap road geometry, loaded from the bundled roads.geojson and
   drawn as coloured lines over a light basemap. If the basemap tiles cannot be
   reached - no Wi-Fi in the room - the roads still draw on a plain background
   and the demo carries on.
   -------------------------------------------------------------------------- */

/* Line weight by road class, so the city still reads as a city. A flooding
   road sits a little heavier than its neighbours. */
const weightFor = (kind: string, emphasised: boolean, status: FloodStatus = 'clear') => {
  const base = kind === 'primary' ? 5 : kind === 'secondary' ? 4 : 3
  const emphasis = emphasised ? 2.5 : 0
  const flooding = status === 'flooding' ? 1.5 : 0
  return base + emphasis + flooding
}

export interface MapPin {
  id: string
  roadId: string
  label: string
  /* Exact pin position; without it the pin sits at the middle of the road. */
  at?: LatLng
}

interface CityMapProps {
  risk: RiskMap
  /* Draws where it is raining. Leave out for a map without the rain area. */
  rain?: RainMode
  /* Makes roads tappable. Without it, taps go to the map itself. */
  onSelectRoad?: (roadId: string) => void
  /* Saved places or business locations, drawn as pins. */
  pins?: MapPin[]
  /* Opening view. Defaults to the whole city. */
  center?: LatLng
  zoom?: number
  /* Draws one road in the brand blue, on top of the others. */
  highlightRoadId?: string
  /* Map movement, for the drag-the-map place picker. */
  onMove?: (center: LatLng) => void
  onMoveStart?: () => void
  onMoveEnd?: (center: LatLng) => void
  /* Tapping the map glides it to that spot. */
  panOnClick?: boolean
  /* Draw only this road, zoomed to it. Used by Street Detail. */
  focusRoadId?: string
  interactive?: boolean
  className?: string
  showLegend?: boolean
  zoomControl?: boolean
  /* Extra bottom padding for the legend, so it clears anything floating over
     the map on that screen. */
  legendClassName?: string
  /* Frames the map around the pins instead of the whole city. */
  fitPins?: boolean
  /* Lets a screen move the "Demo data" badge clear of its own overlays. */
  badgeClassName?: string
}

export function CityMap({
  risk,
  rain,
  onSelectRoad,
  pins = [],
  center,
  zoom,
  highlightRoadId,
  onMove,
  onMoveStart,
  onMoveEnd,
  panOnClick = false,
  focusRoadId,
  interactive = true,
  className = '',
  showLegend = true,
  zoomControl = false,
  fitPins = false,
  legendClassName = '',
  badgeClassName = 'right-2 top-2',
}: CityMapProps) {
  const [tilesFailed, setTilesFailed] = useState(false)

  const focus = getRoad(focusRoadId)
  const centre: LatLng = center ?? (focus ? roadCentre(focus) : cityView.center)

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={centre}
        zoom={zoom ?? (focus ? 15 : cityView.zoom)}
        minZoom={11}
        maxZoom={18}
        zoomControl={zoomControl}
        attributionControl
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        /* Canvas keeps a few hundred recolouring lines smooth. */
        preferCanvas
        style={{ height: '100%', width: '100%', background: themeColor('--surface') }}
      >
        <TileLayer
          /* OpenStreetMap standard tiles, no API key. They are busier than a
             purpose-built light style, so `.leaflet-tile-pane` in index.css
             desaturates and lightens them - the coloured roads have to own the
             screen. */
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          eventHandlers={{ tileerror: () => setTilesFailed(true) }}
        />

        {/* Between the tiles and the roads, so it never tints road status. */}
        {rain && <RainOverlay mode={rain} />}

        <RoadLayer
          risk={risk}
          onSelectRoad={onSelectRoad}
          focusRoadId={focusRoadId}
          highlightRoadId={highlightRoadId}
          selectable={interactive && !!onSelectRoad}
        />

        <PinLayer pins={pins} />

        {(onMove || onMoveStart || onMoveEnd || panOnClick) && (
          <MapEvents
            onMove={onMove}
            onMoveStart={onMoveStart}
            onMoveEnd={onMoveEnd}
            panOnClick={panOnClick}
          />
        )}

        {focus ? (
          <FitToRoad roadId={focus.properties.id} />
        ) : fitPins && pins.length ? (
          <FitToPins points={pins.map(pinPosition)} />
        ) : (
          <SettleSize />
        )}
      </MapContainer>

      {showLegend && <Legend className={legendClassName} />}

      {/* Badge and offline note share one stack so neither can be hidden
          behind whatever a screen floats over the map. */}
      <div
        className={`pointer-events-none absolute z-[500] flex flex-col items-end gap-1 ${badgeClassName}`}
      >
        {/* Always on: nobody should mistake this for live conditions. */}
        <span className="rounded-[7px] bg-ink/75 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-on-dark">
          Demo data
        </span>

        {tilesFailed && (
          <span className="max-w-[176px] rounded-[7px] bg-card/95 px-2 py-1.5 text-right text-[10px] font-semibold leading-snug text-ink-muted shadow-card">
            Offline: street map art unavailable. Road conditions still live.
          </span>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Roads.

   The lines are created once and then recoloured imperatively. Rebuilding a
   few hundred React elements every 60ms tick would not keep up with the
   spreading-water animation.
   -------------------------------------------------------------------------- */

function RoadLayer({
  risk,
  onSelectRoad,
  focusRoadId,
  highlightRoadId,
  selectable,
}: {
  risk: RiskMap
  onSelectRoad?: (roadId: string) => void
  focusRoadId?: string
  highlightRoadId?: string
  selectable: boolean
}) {
  const map = useMap()
  const linesRef = useRef<Map<string, L.Polyline>>(new Map())

  /* Held in refs so neither one is an effect dependency. The parent re-renders
     on every countdown tick with a fresh onSelectRoad closure; if that tore
     the lines down and rebuilt them, every road would snap back to green
     whenever the risk map happened not to change in the same render. */
  const riskRef = useRef(risk)
  riskRef.current = risk
  const selectRef = useRef(onSelectRoad)
  selectRef.current = onSelectRoad

  /* Build the lines once per map / focus / selectability change. */
  useEffect(() => {
    const group = L.layerGroup().addTo(map)
    const lines = new Map<string, L.Polyline>()

    const visible = focusRoadId
      ? roads.filter((r) => r.properties.id === focusRoadId)
      : roads

    for (const road of visible) {
      const { id, kind } = road.properties
      const value = riskRef.current[id] ?? 0
      const line = L.polyline(roadLatLngs(road), {
        color: riskColor(value),
        weight: weightFor(kind, id === focusRoadId, statusFromRisk(value)),
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        /* Not tappable means taps fall through to the map (the place picker
           uses that to move the pin). */
        interactive: selectable,
        bubblingMouseEvents: false,
      })

      if (selectable) {
        line.on('click', () => selectRef.current?.(id))
        line.bindTooltip(road.properties.name, { sticky: true, direction: 'top' })
      }

      line.addTo(group)
      lines.set(id, line)
    }

    linesRef.current = lines

    return () => {
      group.remove()
      linesRef.current = new Map()
    }
  }, [map, focusRoadId, selectable])

  /* Recolour whenever the water moves or the highlighted road changes. */
  useEffect(() => {
    for (const [id, line] of linesRef.current) {
      const road = getRoad(id)
      if (!road) continue
      const value = risk[id] ?? 0
      const highlighted = id === highlightRoadId
      line.setStyle({
        color: highlighted ? themeColor('--primary') : riskColor(value),
        weight:
          weightFor(road.properties.kind, id === focusRoadId, statusFromRisk(value)) +
          (highlighted ? 3 : 0),
      })
      if (highlighted) line.bringToFront()
    }
  }, [risk, focusRoadId, highlightRoadId])

  return null
}

/* --------------------------------------------------------------------------
   Map movement and taps, passed out to the screen.
   -------------------------------------------------------------------------- */

function MapEvents({
  onMove,
  onMoveStart,
  onMoveEnd,
  panOnClick,
}: {
  onMove?: (center: LatLng) => void
  onMoveStart?: () => void
  onMoveEnd?: (center: LatLng) => void
  panOnClick: boolean
}) {
  const centreOf = (map: L.Map): LatLng => {
    const c = map.getCenter()
    return [c.lat, c.lng]
  }
  const map = useMapEvents({
    movestart: () => onMoveStart?.(),
    move: () => onMove?.(centreOf(map)),
    moveend: () => onMoveEnd?.(centreOf(map)),
    click: (e) => {
      if (panOnClick) map.panTo(e.latlng, { animate: true, duration: 0.35 })
    },
  })
  return null
}

/* --------------------------------------------------------------------------
   Pins for saved places and business locations.
   -------------------------------------------------------------------------- */

/** Where a pin goes: exactly where it was dropped, else the middle of its road. */
function pinPosition(pin: MapPin): LatLng | null {
  if (pin.at) return pin.at
  const road = getRoad(pin.roadId)
  return road ? roadCentre(road) : null
}

function PinLayer({ pins }: { pins: MapPin[] }) {
  const map = useMap()

  /* Only rebuild when the pins themselves change, not when the parent
     re-renders with a freshly mapped array. */
  const key = useMemo(
    () => pins.map((p) => `${p.id}:${p.roadId}:${p.label}:${p.at?.join(',') ?? ''}`).join('|'),
    [pins],
  )
  const pinsRef = useRef(pins)
  pinsRef.current = pins

  useEffect(() => {
    const current = pinsRef.current
    if (!current.length) return
    const group = L.layerGroup().addTo(map)

    /* Two saved places can sit a few hundred metres apart - downtown Cebu is
       dense. Lift a label clear of any earlier one it would land on. */
    const placed: { at: LatLng; lift: number }[] = []

    for (const pin of current) {
      const at = pinPosition(pin)
      if (!at) continue
      let lift = 0
      for (const other of placed) {
        if (roughMetres(at, other.at) < 700 && other.lift === lift) lift += 22
      }
      placed.push({ at, lift })
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:var(--card);color:var(--primary);border:1.5px solid var(--primary);
              border-radius:var(--r-sm);padding:2px 6px;font:800 11px/1.2 var(--font-sans,sans-serif);
              white-space:nowrap;box-shadow:var(--sh-card);margin-bottom:${2 + lift}px;">
              ${escapeHtml(pin.label)}
            </div>
            <svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true">
              <path d="M10 23S1.6 14.3 1.6 9.1A8.4 8.4 0 0 1 18.4 9.1C18.4 14.3 10 23 10 23z"
                    fill="var(--primary)" stroke="var(--canvas)" stroke-width="1.8"/>
              <circle cx="10" cy="9" r="3.2" fill="var(--canvas)"/>
            </svg>
          </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      L.marker(at, { icon, interactive: false }).addTo(group)
    }

    return () => {
      group.remove()
    }
  }, [map, key])

  return null
}

/** Rough distance in metres - good enough for deciding if two pins collide. */
function roughMetres(a: LatLng, b: LatLng) {
  const rad = Math.PI / 180
  const x = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad)
  const y = (b[0] - a[0]) * rad
  return Math.sqrt(x * x + y * y) * 6371000
}

function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )
}

/* --------------------------------------------------------------------------
   Framing.
   -------------------------------------------------------------------------- */

/* Leaflet measures its container on mount. Inside the phone frame that
   measurement can land before the layout settles, leaving grey gaps. */
function SettleSize() {
  const map = useMap()
  useEffect(() => {
    const ids = [60, 200, 500].map((ms) =>
      window.setTimeout(() => map.invalidateSize(), ms),
    )
    return () => ids.forEach(window.clearTimeout)
  }, [map])
  return null
}

function FitToRoad({ roadId }: { roadId: string }) {
  const map = useMap()
  useEffect(() => {
    const road = getRoad(roadId)
    if (!road) return
    const bounds = L.latLngBounds(roadLatLngs(road).flat())
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 })
    const id = window.setTimeout(() => map.invalidateSize(), 150)
    return () => window.clearTimeout(id)
  }, [map, roadId])
  return null
}

function FitToPins({ points: raw }: { points: (LatLng | null)[] }) {
  const map = useMap()
  const points = raw.filter((p): p is LatLng => p !== null)
  const key = points.map((p) => p.join(',')).join('|')
  useEffect(() => {
    const points = key.split('|').map((p) => p.split(',').map(Number) as LatLng)
    if (!key) return
    /* Generous top padding: each pin carries a label above it. */
    map.fitBounds(L.latLngBounds(points), {
      paddingTopLeft: [40, 48],
      paddingBottomRight: [40, 40],
      maxZoom: 14,
    })
    const id = window.setTimeout(() => map.invalidateSize(), 150)
    return () => window.clearTimeout(id)
  }, [map, key])
  return null
}

/* --------------------------------------------------------------------------
   Legend.
   -------------------------------------------------------------------------- */

const legendItems: FloodStatus[] = ['clear', 'watch', 'flooding']
const legendRisk: Record<FloodStatus, number> = { clear: 0, watch: 0.5, flooding: 1 }

function Legend({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute bottom-1.5 left-1.5 z-[500] flex gap-2.5 rounded-md bg-card/95 px-2.5 py-1.5 shadow-card backdrop-blur ${className}`}
    >
      {legendItems.map((status) => (
        <span key={status} className="flex items-center gap-1.5">
          <span
            className="h-[4px] w-[14px] rounded-full"
            style={{ background: riskColor(legendRisk[status]) }}
          />
          <span className="text-[11px] font-bold text-ink-muted">
            {statusLabels[status].label}
          </span>
        </span>
      ))}
    </div>
  )
}
