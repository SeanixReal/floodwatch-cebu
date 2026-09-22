import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Info, Phone, Plus, Signal, Video } from 'lucide-react'
import { Screen } from '../components/Screen'
import { Logo } from '../components/Logo'
import { useApp } from '../state/AppState'
import { roadName } from '../data/roads'
import { savedPlaces, smsPreview } from '../data/sample'

/* --------------------------------------------------------------------------
   What the alert looks like inside the phone's own Messages app. This screen
   deliberately does NOT use the FloodWatch chrome - it is a different app.
   -------------------------------------------------------------------------- */

export function SmsPreview() {
  const navigate = useNavigate()
  const { alertPlace, places } = useApp()

  const place = alertPlace ?? places[0] ?? savedPlaces[0]
  const road = roadName(place.roadId)

  return (
    <Screen
      className="bg-canvas"
      footer={
        /* Disabled composer, for the look of it. */
        <div className="border-t border-line px-3 pb-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-ink-faint">
              <Plus size={19} strokeWidth={2.4} />
            </span>
            <div className="flex h-9 flex-1 items-center rounded-pill border border-line px-3.5">
              <span className="text-[15px] font-medium text-ink-faint">Text Message</span>
            </div>
          </div>
        </div>
      }
    >
      {/* Messages-app header */}
      <div className="border-b border-line bg-surface/90 px-3 pb-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="tappable flex h-9 w-9 items-center justify-center rounded-full text-secondary"
          >
            <ChevronLeft size={26} strokeWidth={2.6} />
          </button>

          <div className="flex flex-1 flex-col items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
              <Logo size={22} className="text-on-primary" water="var(--secondary)" />
            </span>
            <span className="mt-0.5 text-[13px] font-bold text-ink">
              {smsPreview.sender}
            </span>
          </div>

          <div className="flex w-[72px] justify-end gap-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint">
              <Phone size={17} strokeWidth={2.2} />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint">
              <Video size={17} strokeWidth={2.2} />
            </span>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="px-4 py-4">
        <p className="pb-2 text-center text-[11px] font-semibold text-ink-faint">
          Text Message &middot; Today
        </p>

        {smsPreview.messages.map((m, i) => (
          <div key={m.id} className="pb-3">
            <p className="mb-1 pl-1 text-[11px] font-semibold text-ink-faint">{m.time}</p>
            <div
              className="max-w-[86%] rounded-[20px] rounded-bl-[6px] bg-surface2 px-3.5 py-2.5 animate-rise-in"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="text-[16px] font-medium leading-snug text-ink">
                {m.text.replace('{road}', road)}
              </p>
            </div>
          </div>
        ))}

        {/* Why SMS */}
        <div className="mt-2 flex items-start gap-2.5 rounded-card border border-line bg-secondary-soft p-3.5">
          <Signal size={17} strokeWidth={2.4} className="mt-[2px] shrink-0 text-primary" />
          <p className="text-[13px] font-semibold leading-snug text-on-secondary">
            {smsPreview.footnote}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="tappable mt-3 flex w-full items-center gap-2.5 rounded-card border border-line bg-card p-3.5 text-left"
        >
          <Info size={17} strokeWidth={2.4} className="shrink-0 text-ink-faint" />
          <span className="flex-1 text-[13px] font-bold text-ink">
            Change how you get alerts
          </span>
        </button>
      </div>
    </Screen>
  )
}
