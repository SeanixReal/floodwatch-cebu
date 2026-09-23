import { useMemo, useState } from 'react'
import { ArrowRight, Briefcase, House, MapPin, Move, Store } from 'lucide-react'
import { CityMap } from './CityMap'
import { Button } from './ui'
import { useApp } from '../state/AppState'
import { nearestRoad, type LatLng } from '../data/roads'
import {
  PIN_FAR_FROM_ROAD_M,
  placeDefaultLabel,
  placeKindLabel,
  type SavedPlace,
} from '../data/sample'

/* --------------------------------------------------------------------------
   Pick a place by moving the map under a fixed pin - the pattern people
   already know from ride-hailing and delivery apps. Warnings are per road, so
   the pin watches the nearest main road, which is shown (and highlighted)
   live as the map moves.
   -------------------------------------------------------------------------- */

/* One icon per place type, shared with the screens that list places. */
export const placeKindIcon = { home: House, store: Store, work: Briefcase }

interface PlacePickerProps {
  /* Where the pin starts. */
  start: LatLng
  startKind?: SavedPlace['kind']
  saveText: string
  onSave: (place: Omit<SavedPlace, 'id'>) => void
  mapHeight?: number
}

export function PlacePicker({
  start,
  startKind = 'store',
  saveText,
  onSave,
  mapHeight = 290,
}: PlacePickerProps) {
  const { risk } = useApp()
  const [at, setAt] = useState<LatLng>(start)
  const [moving, setMoving] = useState(false)
  const [kind, setKind] = useState<SavedPlace['kind']>(startKind)
  const [label, setLabel] = useState(placeDefaultLabel[startKind])
  const [labelEdited, setLabelEdited] = useState(false)

  const nearest = useMemo(() => nearestRoad(at), [at])
  const roadId = nearest.road.properties.id
  const far = nearest.metres > PIN_FAR_FROM_ROAD_M

  const pickKind = (k: SavedPlace['kind']) => {
    setKind(k)
    /* Keep a name the person typed; otherwise follow the type. */
    if (!labelEdited) setLabel(placeDefaultLabel[k])
  }

  const save = () =>
    onSave({ label: label.trim() || placeDefaultLabel[kind], kind, roadId, at })

  return (
    <div>
      {/* ---------------- Map with the fixed centre pin ---------------- */}
      <div
        className="relative overflow-hidden rounded-card border border-line shadow-card"
        style={{ height: mapHeight }}
      >
        <CityMap
          risk={risk}
          center={start}
          zoom={16}
          highlightRoadId={roadId}
          onMoveStart={() => setMoving(true)}
          onMove={setAt}
          onMoveEnd={(c) => {
            setAt(c)
            setMoving(false)
          }}
          panOnClick
          showLegend={false}
          className="h-full w-full"
        />

        {/* The pin itself. Its tip marks the exact centre of the map; it lifts
            while the map is moving, like picking something up. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[650]">
          <span
            className={`absolute left-0 top-0 h-[6px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink transition-opacity duration-150 ${
              moving ? 'opacity-15' : 'opacity-30'
            }`}
          />
          <svg
            width="34"
            height="42"
            viewBox="0 0 20 24"
            aria-hidden="true"
            className="absolute left-0 top-0 transition-transform duration-150"
            style={{
              transform: `translate(-50%, calc(-100% + 1px)) translateY(${moving ? -8 : 0}px)`,
            }}
          >
            <path
              d="M10 23S1.6 14.3 1.6 9.1A8.4 8.4 0 0 1 18.4 9.1C18.4 14.3 10 23 10 23z"
              fill="var(--primary)"
              stroke="var(--canvas)"
              strokeWidth="1.6"
            />
            <circle cx="10" cy="9" r="3.2" fill="var(--canvas)" />
          </svg>
        </div>

        <div className="pointer-events-none absolute left-2 top-2 z-[650] flex items-center gap-1.5 rounded-md bg-card/95 px-2.5 py-1.5 text-[12px] font-bold text-ink-muted shadow-card">
          <Move size={13} strokeWidth={2.6} />
          Drag the map or tap a spot
        </div>
      </div>

      {/* ---------------- Which road this watches ---------------- */}
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-card p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <MapPin size={19} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
            We will watch
          </p>
          <p className="truncate text-[16px] font-extrabold tracking-tight text-ink">
            {nearest.road.properties.name}
          </p>
          <p className="text-[12px] font-medium text-ink-muted">
            {far
              ? `Nearest main road, ${formatDistance(nearest.metres)} from your pin`
              : nearest.metres < 25
                ? 'Your pin is on this road'
                : `${formatDistance(nearest.metres)} from your pin`}
          </p>
        </div>
      </div>

      {/* ---------------- Name and type ---------------- */}
      <div className="mt-3 flex gap-2">
        {(Object.keys(placeKindLabel) as SavedPlace['kind'][]).map((k) => {
          const active = kind === k
          const Icon = placeKindIcon[k]
          return (
            <button
              key={k}
              type="button"
              onClick={() => pickKind(k)}
              className={`tappable flex flex-1 items-center justify-center gap-1.5 rounded-md border-2 py-2.5 text-[13px] font-extrabold ${
                active
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-card text-ink-muted'
              }`}
            >
              <Icon size={15} strokeWidth={2.5} />
              {placeKindLabel[k]}
            </button>
          )
        })}
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[12px] font-bold text-ink-muted">Name</span>
        <input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value)
            setLabelEdited(true)
          }}
          placeholder={placeDefaultLabel[kind]}
          className="h-12 w-full rounded-md border border-line bg-surface px-3 text-[16px] font-semibold text-ink outline-none focus:border-secondary"
        />
      </label>

      <Button className="mt-4" onClick={save}>
        {saveText}
        <ArrowRight size={18} strokeWidth={2.6} />
      </Button>
    </div>
  )
}

function formatDistance(metres: number) {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`
  return `${Math.round(metres / 10) * 10} m`
}
