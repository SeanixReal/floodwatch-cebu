import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  CircleCheckBig,
  CloudDrizzle,
  CloudRain,
  House,
  Route,
  Store,
  TriangleAlert,
} from 'lucide-react'
import { Screen } from '../components/Screen'
import { CityMap } from '../components/CityMap'
import { Logo } from '../components/Logo'
import { StatusChip } from '../components/ui'
import { useApp, formatCountdown } from '../state/AppState'
import { statusCounts } from '../state/floodSim'
import { roadName } from '../data/roads'
import { conditions, statusLabels, type SavedPlace } from '../data/sample'

const placeIcon = { home: House, store: Store, route: Route }

export function Home() {
  const navigate = useNavigate()
  const { rain, risk, places, statusOf, alertPlace, prepared, secondsLeft } = useApp()

  const c = conditions[rain]
  const heavy = rain === 'heavy'
  const counts = statusCounts(risk)
  const ConditionIcon = heavy ? CloudRain : CloudDrizzle

  return (
    <Screen nav scroll={false} tone="light" statusClass="bg-grad-header" className="bg-surface">
      {/* ---------------- Header + conditions ---------------- */}
      <header className="bg-grad-header shrink-0 px-4 pb-3.5 pt-0.5">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Logo size={26} className="text-on-dark" water="var(--secondary)" />
            <span className="text-[16px] font-extrabold tracking-tight text-on-dark">
              FloodWatch
              <span className="ml-1 font-semibold text-secondary">Cebu</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/alerts')}
            aria-label="Alerts"
            className="tappable relative flex h-9 w-9 items-center justify-center rounded-full bg-on-dark/15 text-on-dark"
          >
            <Bell size={18} strokeWidth={2.3} />
            {heavy && (
              <span className="absolute right-[8px] top-[8px] h-[8px] w-[8px] rounded-full bg-alert ring-2 ring-primary" />
            )}
          </button>
        </div>

        {/* Compact city-wide status card */}
        <div className="rounded-card bg-card p-3 shadow-card">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${
                heavy ? 'bg-primary text-on-primary' : 'bg-secondary-soft text-primary'
              }`}
            >
              <ConditionIcon size={22} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h1 className="text-[18px] font-extrabold leading-tight tracking-tight text-ink">
                  {c.headline}
                </h1>
                <span className="text-[12px] font-semibold text-ink-faint">
                  Cebu City
                </span>
              </div>
              <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink-muted">
                {c.detail}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5">
            <CountPill
              tone="watch"
              count={counts.watch}
              label={statusLabels.watch.label}
            />
            <CountPill
              tone="flooding"
              count={counts.flooding}
              label={statusLabels.flooding.label}
            />
            <span className="ml-auto text-[11px] font-semibold text-ink-faint">
              {c.updated}
            </span>
          </div>
        </div>
      </header>

      {/* ---------------- The map ---------------- */}
      <div className="relative min-h-0 flex-1">
        <CityMap
          risk={risk}
          onSelectRoad={(id) => navigate(`/street/${id}`)}
          pins={places.map((p) => ({ id: p.id, roadId: p.roadId, label: p.label }))}
          className="h-full w-full"
          badgeClassName={alertPlace ? 'right-2 top-[126px]' : 'right-2 top-2'}
        />

        {/* Live warning, floating over the map */}
        {alertPlace && !prepared && (
          <button
            type="button"
            onClick={() => navigate('/alert')}
            className="tappable bg-grad-alert absolute inset-x-3 top-3 z-[600] block rounded-card p-3 text-left shadow-float animate-rise-in"
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-on-alert/15 text-on-alert">
                <span className="absolute inset-0 animate-halo rounded-full bg-on-alert/25" />
                <TriangleAlert size={16} strokeWidth={2.6} className="relative" />
              </span>
              <span className="flex-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-alert/75">
                Flood warning
              </span>
              <span className="flex items-baseline gap-1">
                <span className="text-[16px] font-extrabold tabular-nums leading-none text-on-alert">
                  {formatCountdown(secondsLeft)}
                </span>
                <span className="text-[10px] font-bold text-on-alert/75">to act</span>
              </span>
              <ChevronRight
                size={17}
                strokeWidth={2.6}
                className="shrink-0 text-on-alert/70"
              />
            </div>
            <p className="mt-1.5 text-balance text-[16px] font-extrabold leading-tight text-on-alert">
              Flooding expected on {roadName(alertPlace.roadId)}
            </p>
          </button>
        )}

        {alertPlace && prepared && (
          <div className="absolute inset-x-3 top-3 z-[600] flex items-center gap-2.5 rounded-card border border-safe/30 bg-card p-3 shadow-float">
            <CircleCheckBig size={19} strokeWidth={2.5} className="shrink-0 text-safe" />
            <p className="min-w-0 flex-1 text-[13px] font-bold text-ink">
              You are marked as prepared for {roadName(alertPlace.roadId)}
            </p>
            <button
              type="button"
              onClick={() => navigate('/alert')}
              className="tappable shrink-0 text-[13px] font-bold text-primary"
            >
              View
            </button>
          </div>
        )}

        {/* Saved places, floating along the bottom of the map */}
        {places.length > 0 && (
          <div className="no-scrollbar absolute inset-x-0 bottom-[38px] z-[600] flex gap-2 overflow-x-auto px-3 pb-1">
            {places.map((p) => (
              <PlaceChip
                key={p.id}
                place={p}
                status={statusOf(p.roadId)}
                onClick={() => navigate(`/street/${p.roadId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}

function CountPill({
  tone,
  count,
  label,
}: {
  tone: 'watch' | 'flooding'
  count: number
  label: string
}) {
  const styles =
    tone === 'watch' ? 'bg-alert-soft text-alert-strong' : 'bg-danger-soft text-danger'
  const dot = tone === 'watch' ? 'bg-alert' : 'bg-danger'
  return (
    <span
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-bold ${styles}`}
    >
      <span className={`h-[7px] w-[7px] rounded-full ${dot}`} />
      <span className="tabular-nums">{count}</span>
      {label}
    </span>
  )
}

function PlaceChip({
  place,
  status,
  onClick,
}: {
  place: SavedPlace
  status: ReturnType<ReturnType<typeof useApp>['statusOf']>
  onClick: () => void
}) {
  const Icon = placeIcon[place.kind]
  return (
    <button
      type="button"
      onClick={onClick}
      className="tappable flex shrink-0 items-center gap-2 rounded-card border border-line bg-card/95 py-2 pl-2.5 pr-2 shadow-card backdrop-blur"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          status === 'clear'
            ? 'bg-safe-soft text-safe'
            : status === 'watch'
              ? 'bg-alert-soft text-alert-strong'
              : 'bg-danger-soft text-danger'
        }`}
      >
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <span className="text-left">
        <span className="block max-w-[128px] truncate text-[13px] font-extrabold leading-tight text-ink">
          {place.label}
        </span>
        <span className="block max-w-[128px] truncate text-[11px] font-medium text-ink-muted">
          {roadName(place.roadId)}
        </span>
      </span>
      <StatusChip status={status} size="sm" />
      <ChevronRight size={15} strokeWidth={2.6} className="shrink-0 text-ink-faint" />
    </button>
  )
}
