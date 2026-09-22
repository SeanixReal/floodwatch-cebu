import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Check, ChevronRight, History, MapPin, Sparkles } from 'lucide-react'
import { Screen, SectionTitle, TopBar } from '../components/Screen'
import { Button, Card, StatusChip } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { FloodHistoryChart } from '../components/FloodHistoryChart'
import { useApp } from '../state/AppState'
import { roadName } from '../data/roads'
import { businessLocations, businessPlan } from '../data/sample'

export function BusinessDashboard() {
  const navigate = useNavigate()
  const { statusOf, risk } = useApp()
  const [planNote, setPlanNote] = useState(false)

  return (
    <Screen nav className="bg-surface" tone="light" statusClass="bg-grad-header">
      <header className="bg-grad-header px-1 pb-4 pt-0">
        <TopBar
          title="Business"
          subtitle={`${businessLocations.length} locations`}
          tone="light"
          fallback="/profile"
          right={
            <span className="flex items-center gap-1.5 rounded-md bg-alert px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-on-alert">
              <Briefcase size={13} strokeWidth={2.8} />
              Business
            </span>
          }
        />
      </header>

      {/* All locations on one map */}
      <div className="px-4 pt-4">
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <CityMap
            risk={risk}
            onSelectRoad={(id) => navigate(`/street/${id}`)}
            pins={businessLocations.map((l) => ({
              id: l.id,
              roadId: l.roadId,
              label: l.name,
            }))}
            fitPins
            className="h-[230px] w-full"
            legendClassName="!bottom-6"
          />
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4 pt-4">
        {/* ---------------- Locations ---------------- */}
        <section>
          <SectionTitle>Your locations</SectionTitle>
          <ul className="space-y-2.5">
            {businessLocations.map((loc) => {
              const status = statusOf(loc.roadId)
              return (
                <li key={loc.id}>
                  <Card
                    as="button"
                    onClick={() => navigate(`/street/${loc.roadId}`)}
                    className="!p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                        <MapPin size={19} strokeWidth={2.4} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-[16px] font-extrabold tracking-tight text-ink">
                            {loc.name}
                          </h3>
                          <StatusChip status={status} size="sm" />
                        </div>
                        <p className="mt-0.5 truncate text-[13px] font-medium text-ink-muted">
                          {roadName(loc.roadId)}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        strokeWidth={2.5}
                        className="mt-2 shrink-0 text-ink-faint"
                      />
                    </div>

                    <div className="mt-3 flex items-end gap-3 border-t border-line pt-3">
                      <div className="w-[104px] shrink-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                          This season
                        </p>
                        <p className="text-[22px] font-extrabold leading-tight text-primary">
                          {loc.seasonEvents}
                        </p>
                        <p className="text-[11px] font-semibold text-ink-muted">
                          flood events
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium text-ink-faint">
                          Last: {loc.lastFlooded}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <FloodHistoryChart
                          data={loc.history}
                          height={54}
                          compact
                          highlightPeak={false}
                        />
                        <div className="mt-1 flex justify-between">
                          {loc.history.map((h) => (
                            <span
                              key={h.month}
                              className="text-[10px] font-semibold text-ink-faint"
                            >
                              {h.month}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------------- Season summary ---------------- */}
        <section>
          <SectionTitle>Season at a glance</SectionTitle>
          <Card>
            <div className="flex items-center gap-2 pb-3">
              <History size={17} strokeWidth={2.4} className="text-primary" />
              <p className="text-[13px] font-semibold text-ink-muted">
                Flood events across all your locations, by month
              </p>
            </div>
            <FloodHistoryChart data={combineHistory()} height={132} />
          </Card>
        </section>

        {/* ---------------- Plan ---------------- */}
        <section>
          <SectionTitle>Your plan</SectionTitle>
          <Card className="border-primary/15 bg-primary-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={17} strokeWidth={2.5} className="text-primary" />
                  <h3 className="text-[17px] font-extrabold tracking-tight text-primary">
                    {businessPlan.name}
                  </h3>
                </div>
                <p className="mt-1 text-[13px] font-medium text-ink-muted">
                  {businessPlan.blurb}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[26px] font-extrabold leading-none tracking-tight text-primary">
                  {businessPlan.price}
                </p>
                <p className="text-[12px] font-semibold text-ink-muted">
                  {businessPlan.period}
                </p>
              </div>
            </div>

            <ul className="mt-3.5 space-y-2 border-t border-primary/15 pt-3.5">
              {businessPlan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Check size={11} strokeWidth={3.6} />
                  </span>
                  <span className="text-[14px] font-semibold text-ink">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <Button variant="primary" size="md" onClick={() => setPlanNote((v) => !v)}>
                Manage plan
              </Button>
              {planNote && (
                <p className="mt-2.5 rounded-md bg-card p-3 text-[13px] font-medium leading-snug text-ink-muted animate-rise-in">
                  Billing is not part of this prototype. The price shown is a placeholder
                  until pricing is set.
                </p>
              )}
            </div>
          </Card>
        </section>
      </div>
    </Screen>
  )
}

/* Adds up every location's monthly history for the summary chart. */
function combineHistory() {
  const months = businessLocations[0].history.map((h) => h.month)
  return months.map((month, i) => ({
    month,
    count: businessLocations.reduce((sum, loc) => sum + loc.history[i].count, 0),
  }))
}
