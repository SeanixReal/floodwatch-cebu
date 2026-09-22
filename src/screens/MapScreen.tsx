import { useNavigate } from 'react-router-dom'
import { ChevronRight, CircleCheckBig } from 'lucide-react'
import { Screen } from '../components/Screen'
import { CityMap } from '../components/CityMap'
import { StatusChip } from '../components/ui'
import { useApp } from '../state/AppState'
import { affectedRoads } from '../state/floodSim'
import { roadName } from '../data/roads'
import { statusFromRisk, statusLabels } from '../data/sample'

export function MapScreen() {
  const navigate = useNavigate()
  const { risk, places } = useApp()

  const affected = affectedRoads(risk)

  return (
    <Screen nav scroll={false} className="bg-surface">
      {/* Map takes the top two thirds */}
      <div className="relative min-h-0 flex-[3]">
        <CityMap
          risk={risk}
          onSelectRoad={(id) => navigate(`/street/${id}`)}
          pins={places.map((p) => ({ id: p.id, roadId: p.roadId, label: p.label }))}
          className="h-full w-full"
          zoomControl
          legendClassName="!bottom-7"
        />
      </div>

      {/* A sheet of everything that is not clear */}
      <div className="relative z-[700] -mt-4 flex min-h-0 flex-[2] flex-col rounded-t-[22px] border-t border-line bg-card shadow-float">
        <div className="shrink-0 px-4 pb-2 pt-2.5">
          <div className="mx-auto mb-2.5 h-[4px] w-[38px] rounded-full bg-surface2" />
          <div className="flex items-baseline justify-between">
            <h1 className="text-[17px] font-extrabold tracking-tight text-ink">
              Roads to avoid
            </h1>
            <span className="text-[12px] font-semibold text-ink-faint">
              {affected.length} of {Object.keys(risk).length}
            </span>
          </div>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          {affected.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CircleCheckBig size={28} strokeWidth={2} className="text-safe" />
              <p className="text-[15px] font-extrabold text-ink">Every road is clear</p>
              <p className="max-w-[240px] text-[13px] font-medium text-ink-muted">
                Nothing reported across the city right now.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {affected.map(({ id, risk: value }) => {
                const status = statusFromRisk(value)
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/street/${id}`)}
                      className="tappable flex w-full items-center gap-2.5 rounded-lg border border-line bg-card p-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-extrabold tracking-tight text-ink">
                          {roadName(id)}
                        </span>
                        <span className="block truncate text-[12px] font-medium text-ink-muted">
                          {statusLabels[status].meaning}
                        </span>
                      </span>
                      <StatusChip status={status} size="sm" />
                      <ChevronRight
                        size={17}
                        strokeWidth={2.5}
                        className="shrink-0 text-ink-faint"
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Screen>
  )
}
