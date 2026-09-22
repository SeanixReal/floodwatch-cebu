import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  MessageSquare,
  Navigation,
  TriangleAlert,
} from 'lucide-react'
import { Screen } from '../components/Screen'
import { Button, SourceNote } from '../components/ui'
import { DepthIllustration } from '../components/DepthIllustration'
import { useApp, formatCountdown } from '../state/AppState'
import { roadName } from '../data/roads'
import { depths, floodAlert, savedPlaces } from '../data/sample'

export function FloodAlert() {
  const navigate = useNavigate()
  const { secondsLeft, markPrepared, prepared, alertPlace, places } = useApp()
  const [done, setDone] = useState<string[]>([])

  /* Deep-linked from the demo panel before the simulation has fired? Fall back
     to the first saved place so the screen is never empty. */
  const place = alertPlace ?? places[0] ?? savedPlaces[0]
  const road = roadName(place.roadId)
  const minutes = Math.max(1, Math.ceil(secondsLeft / 60))

  const toggle = (id: string) =>
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))

  const onPrepared = () => {
    markPrepared()
    navigate('/home')
  }

  return (
    <Screen
      className="bg-grad-alert"
      tone="dark"
      indicatorTone="dark"
      footer={
        <div className="space-y-2 px-4 pb-2 pt-2">
          <Button variant="dark" onClick={onPrepared}>
            <Check size={19} strokeWidth={3} />
            {prepared ? 'Marked as prepared' : "I'm prepared"}
          </Button>
          <Button
            variant="outline-light"
            onClick={() => navigate(`/street/${place.roadId}`)}
          >
            <Navigation size={18} strokeWidth={2.6} />
            View street
          </Button>
        </div>
      }
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pb-1 pt-1">
        <button
          type="button"
          onClick={() => navigate('/home')}
          aria-label="Back to home"
          className="tappable flex h-10 w-10 items-center justify-center rounded-full bg-on-alert/12 text-on-alert"
        >
          <ArrowLeft size={20} strokeWidth={2.4} />
        </button>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-on-alert/75">
          Flood warning
        </span>
      </div>

      <div className="px-4 pb-4">
        {/* Hero */}
        <div className="flex flex-col items-center pt-1 text-center">
          <span className="relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-on-alert/15 text-on-alert">
            <span className="absolute inset-0 animate-halo rounded-full bg-on-alert/25" />
            <TriangleAlert size={25} strokeWidth={2.4} className="relative" />
          </span>

          {/* The road name is held on one line so the headline never breaks
              mid-name and leave an orphaned "Street". */}
          <h1 className="mt-2.5 text-balance text-[24px] font-extrabold leading-[1.15] tracking-tight text-on-alert">
            Flooding expected on{' '}
            <span className="whitespace-nowrap">{road}</span>
          </h1>
          <p className="mt-1 text-[16px] font-bold text-on-alert/80">
            in about {minutes} minutes
          </p>
          <p className="text-[13px] font-semibold text-on-alert/70">
            {place.label}
          </p>
        </div>

        {/* Countdown */}
        <div className="mt-2.5 flex items-stretch gap-2.5">
          <div className="flex flex-1 flex-col items-center justify-center rounded-card bg-on-alert/12 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-on-alert/70">
              <Clock size={13} strokeWidth={2.8} />
              Time left
            </span>
            <span className="mt-1 text-[34px] font-extrabold leading-none tabular-nums tracking-tight text-on-alert">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
          <div className="flex w-[118px] flex-col items-center justify-center rounded-card bg-on-alert/12 py-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-on-alert/70">
              Expected
            </span>
            <DepthIllustration depth="knee" size={30} active />
            <span className="text-[13px] font-extrabold text-on-alert">
              {depths.knee.label}
            </span>
          </div>
        </div>

        {/* Where this comes from */}
        <SourceNote
          reportCount={floodAlert.reportCount}
          tone="onAlert"
          className="mt-2 !py-2.5"
        />

        {/* Checklist */}
        <div className="mt-2.5 rounded-card bg-card p-3.5 shadow-float">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-[17px] font-extrabold tracking-tight text-ink">
              What you can do now
            </h2>
            <span className="text-[12px] font-bold text-ink-faint">
              {done.length} of {floodAlert.actions.length}
            </span>
          </div>

          <ul className="space-y-1.5">
            {floodAlert.actions.map((a) => {
              const checked = done.includes(a.id)
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`tappable flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left ${
                      checked ? 'border-safe/30 bg-safe-soft' : 'border-line bg-surface'
                    }`}
                  >
                    <span
                      className={`mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors ${
                        checked ? 'border-safe bg-safe text-on-safe' : 'border-line bg-card'
                      }`}
                    >
                      {checked && <Check size={14} strokeWidth={3.4} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[15px] font-bold leading-snug ${
                          checked ? 'text-ink-muted line-through' : 'text-ink'
                        }`}
                      >
                        {a.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-medium leading-snug text-ink-muted">
                        {a.detail}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* SMS version */}
        <button
          type="button"
          onClick={() => navigate('/sms')}
          className="tappable mt-2.5 flex w-full items-center gap-3 rounded-card bg-on-alert/12 p-3 text-left"
        >
          <MessageSquare size={19} strokeWidth={2.4} className="shrink-0 text-on-alert" />
          <span className="flex-1 text-[14px] font-bold text-on-alert">
            See this warning as an SMS
          </span>
          <ChevronRight size={18} strokeWidth={2.6} className="text-on-alert/70" />
        </button>
      </div>
    </Screen>
  )
}
