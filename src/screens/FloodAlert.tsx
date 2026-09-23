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

  /* Deep-linked from the demo panel before the simulation has fired? Fall back
     to the first saved place so the screen is never empty. */
  const place = alertPlace ?? places[0] ?? savedPlaces[0]
  const road = roadName(place.roadId)
  const minutes = Math.max(1, Math.ceil(secondsLeft / 60))

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
      <div className="flex min-h-full flex-col">
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

        {/* One message, centred in the space the buttons leave. */}
        <div className="flex flex-1 flex-col justify-center px-5 pb-6">
          <div className="flex flex-col items-center text-center">
            <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-on-alert/15 text-on-alert">
              <span className="absolute inset-0 animate-halo rounded-full bg-on-alert/25" />
              <TriangleAlert size={34} strokeWidth={2.4} className="relative" />
            </span>

            {/* The road name is held on one line so the headline never breaks
                mid-name and leaves an orphaned "Street". */}
            <h1 className="mt-5 text-balance text-[29px] font-extrabold leading-[1.12] tracking-tight text-on-alert">
              Flooding expected on{' '}
              <span className="whitespace-nowrap">{road}</span>
            </h1>
            <p className="mt-2 text-[17px] font-bold text-on-alert/80">
              in about {minutes} minutes
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-on-alert/70">
              {place.label}
            </p>
          </div>

          {/* Countdown */}
          <div className="mt-7 flex items-stretch gap-2.5">
            <div className="flex flex-1 flex-col items-center justify-center rounded-card bg-on-alert/12 py-4">
              <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-on-alert/70">
                <Clock size={14} strokeWidth={2.8} />
                Time left
              </span>
              <span className="mt-1.5 text-[46px] font-extrabold leading-none tabular-nums tracking-tight text-on-alert">
                {formatCountdown(secondsLeft)}
              </span>
            </div>
            <div className="flex w-[124px] flex-col items-center justify-center gap-0.5 rounded-card bg-on-alert/12 py-3">
              <span className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-on-alert/70">
                Expected
              </span>
              <DepthIllustration depth="knee" size={36} active />
              <span className="text-[14px] font-extrabold text-on-alert">
                {depths.knee.label}
              </span>
            </div>
          </div>

          {/* Where this comes from */}
          <SourceNote reportCount={floodAlert.reportCount} tone="onAlert" className="mt-3" />

          {/* SMS version */}
          <button
            type="button"
            onClick={() => navigate('/sms')}
            className="tappable mt-3 flex w-full items-center gap-3 rounded-card bg-on-alert/12 p-3.5 text-left"
          >
            <MessageSquare size={19} strokeWidth={2.4} className="shrink-0 text-on-alert" />
            <span className="flex-1 text-[14px] font-bold text-on-alert">
              See this warning as an SMS
            </span>
            <ChevronRight size={18} strokeWidth={2.6} className="text-on-alert/70" />
          </button>
        </div>
      </div>
    </Screen>
  )
}
