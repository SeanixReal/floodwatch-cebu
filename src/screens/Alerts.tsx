import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellRing, ChevronRight, CircleCheckBig, TriangleAlert } from 'lucide-react'
import { Screen, TopBar } from '../components/Screen'
import { Card, SourceNote, StatusChip } from '../components/ui'
import { useApp, formatCountdown } from '../state/AppState'
import { affectedRoads } from '../state/floodSim'
import { roadName } from '../data/roads'
import {
  pastAlerts,
  reportCountFor,
  statusFromRisk,
  statusLabels,
} from '../data/sample'

type Tab = 'active' | 'past'

export function Alerts() {
  const navigate = useNavigate()
  const { risk, alertPlace, secondsLeft, prepared } = useApp()
  const [tab, setTab] = useState<Tab>('active')

  const active = affectedRoads(risk)

  return (
    <Screen nav className="bg-surface">
      <TopBar title="Alerts" subtitle="Warnings across Cebu City" fallback="/home" />

      {/* Segmented control */}
      <div className="px-4 pb-3">
        <div className="flex gap-1 rounded-lg bg-surface2 p-1">
          {(['active', 'past'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`tappable flex-1 rounded-md py-2 text-[14px] font-extrabold capitalize transition-colors ${
                tab === t ? 'bg-card text-primary shadow-card' : 'text-ink-muted'
              }`}
            >
              {t}
              <span className="ml-1.5 text-[12px] font-bold opacity-60">
                {t === 'active' ? active.length : pastAlerts.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 px-4 pb-4">
        {/* The live warning for a saved place sits at the top of Active */}
        {tab === 'active' && alertPlace && (
          <button
            type="button"
            onClick={() => navigate('/alert')}
            className="tappable bg-grad-alert block w-full rounded-card p-4 text-left shadow-float"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-on-alert/15 text-on-alert">
                <TriangleAlert size={20} strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-[7px] bg-on-alert/15 px-1.5 py-[2px] text-[10px] font-extrabold uppercase tracking-wide text-on-alert">
                    Your place
                  </span>
                  <span className="text-[12px] font-bold tabular-nums text-on-alert/80">
                    {formatCountdown(secondsLeft)} left
                  </span>
                </div>
                <p className="mt-1 text-[16px] font-extrabold leading-tight text-on-alert">
                  Flooding expected on {roadName(alertPlace.roadId)}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-on-alert/85">
                  {alertPlace.label}
                  {prepared ? ' - you marked yourself prepared' : ''}
                </p>
              </div>
              <ChevronRight
                size={18}
                strokeWidth={2.6}
                className="mt-2 shrink-0 text-on-alert/70"
              />
            </div>
          </button>
        )}

        {tab === 'active' &&
          active.map(({ id, risk: value }) => {
            const status = statusFromRisk(value)
            return (
              <Card
                key={id}
                as="button"
                onClick={() => navigate(`/street/${id}`)}
                className="!p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                      status === 'flooding'
                        ? 'bg-danger-soft text-danger'
                        : 'bg-alert-soft text-alert-strong'
                    }`}
                  >
                    <BellRing size={19} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[16px] font-extrabold tracking-tight text-ink">
                        {roadName(id)}
                      </span>
                      <StatusChip status={status} size="sm" />
                    </div>
                    <p className="mt-0.5 text-[13px] font-medium leading-snug text-ink-muted">
                      {statusLabels[status].meaning}
                    </p>
                  </div>
                </div>
                <SourceNote
                  reportCount={reportCountFor(id, status)}
                  className="mt-3 !py-2"
                />
              </Card>
            )
          })}

        {tab === 'past' &&
          pastAlerts.map((a) => (
            <Card
              key={a.id}
              as="button"
              onClick={() => navigate(`/street/${a.roadId}`)}
              className="!p-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-safe-soft text-safe">
                  <CircleCheckBig size={19} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-bold text-ink-muted">
                      {roadName(a.roadId)}
                    </span>
                    <span className="shrink-0 text-[12px] font-medium text-ink-faint">
                      {a.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[16px] font-extrabold leading-snug tracking-tight text-ink">
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium leading-snug text-ink-muted">
                    {a.body}
                  </p>
                </div>
              </div>
              <SourceNote reportCount={a.reportCount} className="mt-3 !py-2" />
            </Card>
          ))}

        {tab === 'active' && active.length === 0 && !alertPlace && (
          <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-card px-6 py-12 text-center">
            <CircleCheckBig size={30} strokeWidth={2} className="text-safe" />
            <p className="text-[16px] font-extrabold text-ink">Nothing right now</p>
            <p className="text-[14px] font-medium text-ink-muted">
              Every road is clear. We will warn you if that changes.
            </p>
          </div>
        )}
      </div>
    </Screen>
  )
}
