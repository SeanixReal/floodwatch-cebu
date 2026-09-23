import { useNavigate, useParams } from 'react-router-dom'
import { Clock, Minus, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Screen, SectionTitle, TopBar } from '../components/Screen'
import { CityMap } from '../components/CityMap'
import {
  Button,
  Card,
  Initial,
  SourceNote,
  StatusPill,
  VerifiedBadge,
} from '../components/ui'
import { DepthIllustration } from '../components/DepthIllustration'
import { FloodHistoryChart } from '../components/FloodHistoryChart'
import { useApp } from '../state/AppState'
import { getRoad, roadName, roads } from '../data/roads'
import {
  depthFromRisk,
  depths,
  historyFor,
  noteFor,
  reportCountFor,
  reportsFor,
  statusLabels,
  trendFor,
  updatedFor,
  type Trend,
} from '../data/sample'

const trendMeta: Record<Trend, { label: string; Icon: typeof TrendingUp }> = {
  rising: { label: 'Rising', Icon: TrendingUp },
  falling: { label: 'Falling', Icon: TrendingDown },
  steady: { label: 'Steady', Icon: Minus },
}

export function StreetDetail() {
  const { roadId } = useParams()
  const navigate = useNavigate()
  const { risk, rain, riskOf, statusOf, myReports } = useApp()

  /* Fall back to a real road rather than a blank screen if the id is unknown. */
  const road = getRoad(roadId) ?? roads[0]
  const id = road.properties.id
  const name = road.properties.name

  const status = statusOf(id)
  const value = riskOf(id)
  const depth = depthFromRisk(value)
  const trend = trendMeta[trendFor(status)]
  const reportCount = reportCountFor(id, status)
  const reports = reportsFor(id, status)
  const ownReports = myReports.filter((r) => r.roadId === id)

  const headerTone =
    status === 'flooding'
      ? 'bg-danger'
      : status === 'watch'
        ? 'bg-grad-alert'
        : 'bg-grad-header'
  const onDarkHeader = status !== 'watch'
  const panel = onDarkHeader ? 'bg-on-dark/12' : 'bg-on-alert/12'
  const strongInk = onDarkHeader ? 'text-on-dark' : 'text-on-alert'
  const softInk = onDarkHeader ? 'text-on-dark-muted' : 'text-on-alert/80'

  return (
    <Screen
      className="bg-surface"
      tone={onDarkHeader ? 'light' : 'dark'}
      statusClass={headerTone}
      footer={
        <div className="border-t border-line bg-card px-4 pb-3 pt-3">
          <Button onClick={() => navigate(`/report?road=${id}`)}>
            <Plus size={19} strokeWidth={3} />
            Report the water here
          </Button>
        </div>
      }
    >
      {/* ---------------- Status header ---------------- */}
      <header className={`${headerTone} px-1 pb-5`}>
        <TopBar
          title={name}
          subtitle={road.properties.kind === 'primary' ? 'Main road' : 'Cebu City'}
          tone={onDarkHeader ? 'light' : 'dark'}
        />

        <div className="px-4">
          <div className={`flex items-center gap-4 rounded-card p-3.5 ${panel}`}>
            {depth ? (
              <DepthIllustration depth={depth} size={46} active />
            ) : (
              <div className="flex h-[61px] w-[46px] items-center justify-center">
                <span
                  className={`h-[3px] w-[28px] rounded-full ${
                    onDarkHeader ? 'bg-on-dark/50' : 'bg-on-alert/50'
                  }`}
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <StatusPill status={status} />
              <p className={`mt-2 text-[17px] font-extrabold leading-tight ${strongInk}`}>
                {depth ? depths[depth].plain : 'No water on the road'}
              </p>
              <p className={`mt-0.5 text-[13px] font-semibold ${softInk}`}>
                {statusLabels[status].meaning}
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className={`rounded-md p-3 ${panel}`}>
              <p
                className={`text-[11px] font-extrabold uppercase tracking-wide ${softInk}`}
              >
                Trend
              </p>
              <p
                className={`mt-0.5 flex items-center gap-1.5 text-[15px] font-extrabold ${strongInk}`}
              >
                <trend.Icon size={16} strokeWidth={2.8} />
                {trend.label}
              </p>
            </div>
            <div className={`rounded-md p-3 ${panel}`}>
              <p
                className={`text-[11px] font-extrabold uppercase tracking-wide ${softInk}`}
              >
                Last updated
              </p>
              <p
                className={`mt-0.5 flex items-center gap-1.5 text-[15px] font-extrabold ${strongInk}`}
              >
                <Clock size={15} strokeWidth={2.8} />
                {updatedFor(id)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <Card>
          <p className="text-[15px] font-semibold leading-snug text-ink">
            {noteFor(id, status)}
          </p>
          <SourceNote reportCount={reportCount} className="mt-3" />
        </Card>

        {/* ---------------- Where it is ---------------- */}
        <section>
          <SectionTitle>Where it is</SectionTitle>
          <Card className="overflow-hidden !p-0">
            <CityMap
              risk={risk}
              rain={rain}
              focusRoadId={id}
              interactive={false}
              showLegend={false}
              className="h-[160px] w-full"
            />
          </Card>
        </section>

        {/* ---------------- Community reports ---------------- */}
        <section>
          <SectionTitle
            action={
              <span className="text-[12px] font-semibold text-ink-faint">
                Newest first
              </span>
            }
          >
            Recent community reports
          </SectionTitle>

          <ul className="space-y-2.5">
            {ownReports.map((r) => (
              <li key={r.id}>
                <Card className="flex gap-3 !p-3.5">
                  <Initial name="You" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-extrabold text-ink">You</span>
                      <VerifiedBadge verified={false} />
                      <span className="ml-auto text-[12px] font-medium text-ink-faint">
                        Just now
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] font-medium leading-snug text-ink-muted">
                      Reported {r.depth.toLowerCase()} water here.
                    </p>
                  </div>
                </Card>
              </li>
            ))}

            {reports.map((r) => (
              <li key={r.id}>
                <Card className="flex gap-3 !p-3.5">
                  <Initial name={r.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-extrabold text-ink">
                        {r.name}
                      </span>
                      <VerifiedBadge verified={r.verified} />
                      <span className="ml-auto shrink-0 text-[12px] font-medium text-ink-faint">
                        {r.ago}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] font-medium leading-snug text-ink-muted">
                      {r.message}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- History ---------------- */}
        <section>
          <SectionTitle>Flood history</SectionTitle>
          <Card>
            <p className="mb-3 text-[13px] font-semibold text-ink-muted">
              Flood events recorded on {roadName(id)}, by month
            </p>
            <FloodHistoryChart data={historyFor(id)} />
          </Card>
        </section>
      </div>
    </Screen>
  )
}
