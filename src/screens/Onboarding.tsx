import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bell, Check, MessageSquare, Zap } from 'lucide-react'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui'
import { Logo } from '../components/Logo'
import { PlacePicker } from '../components/PlacePicker'
import { useApp } from '../state/AppState'
import { getRoad, roadCentre } from '../data/roads'
import {
  alertChannels,
  cityView,
  savedPlaces,
  smsNote,
  type ChannelId,
} from '../data/sample'

const STEPS = 2

export function Onboarding() {
  const navigate = useNavigate()
  const { profile, updateProfile, addPlace } = useApp()
  const [step, setStep] = useState(0)

  const finish = () => navigate('/home')

  return (
    <Screen>
      <div className="flex items-center gap-3 px-5 pb-4 pt-1">
        <button
          type="button"
          onClick={() => (step > 0 ? setStep(step - 1) : navigate('/'))}
          aria-label="Go back"
          className="tappable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <ArrowLeft size={18} strokeWidth={2.3} />
        </button>
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-[5px] flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-primary' : 'bg-surface2'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={finish}
          className="tappable shrink-0 px-1 text-[14px] font-bold text-ink-muted"
        >
          Skip
        </button>
      </div>

      <div key={step} className="animate-screen-in px-5 pb-5">
        {step === 0 ? (
          <>
            <ChannelStep
              value={profile.channel}
              onChange={(c) => updateProfile({ channel: c })}
            />
            <Button className="mt-5" onClick={() => setStep(1)}>
              Continue
              <ArrowRight size={18} strokeWidth={2.6} />
            </Button>
          </>
        ) : (
          <PlaceStep
            onSave={(place) => {
              addPlace(place)
              finish()
            }}
          />
        )}
      </div>
    </Screen>
  )
}

/* --- 1. Alert channel ----------------------------------------------------- */

const channelIcon = { sms: MessageSquare, app: Bell, both: Zap }

function ChannelStep({
  value,
  onChange,
}: {
  value: ChannelId
  onChange: (c: ChannelId) => void
}) {
  return (
    <>
      <div className="mb-5">
        <Logo size={34} className="text-primary" />
        <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-ink">
          How should we reach you?
        </h1>
        <p className="mt-1.5 text-[15px] font-medium leading-snug text-ink-muted">
          Pick how the warning arrives when water is on the way.
        </p>
      </div>

      <ul className="space-y-2.5">
        {alertChannels.map((c) => {
          const active = c.id === value
          const Icon = channelIcon[c.id]
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                className={`tappable flex w-full items-start gap-3 rounded-lg border p-4 text-left ${
                  active ? 'border-primary bg-primary-soft' : 'border-line bg-card'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                    active ? 'bg-primary text-on-primary' : 'bg-surface text-ink-faint'
                  }`}
                >
                  <Icon size={19} strokeWidth={2.3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[17px] font-bold ${
                      active ? 'text-primary' : 'text-ink'
                    }`}
                  >
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] font-medium leading-snug text-ink-muted">
                    {c.detail}
                  </span>
                </span>
                <span
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? 'border-primary bg-primary text-on-primary' : 'border-line'
                  }`}
                >
                  {active && <Check size={14} strokeWidth={3.2} />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex items-start gap-2.5 rounded-md bg-secondary-soft p-3.5">
        <MessageSquare
          size={17}
          strokeWidth={2.3}
          className="mt-[2px] shrink-0 text-primary"
        />
        <p className="text-[13px] font-semibold leading-snug text-on-secondary">
          {smsNote}
        </p>
      </div>
    </>
  )
}

/* --- 2. Pin a place (optional - Skip is in the top bar) ------------------- */

function PlaceStep({ onSave }: { onSave: Parameters<typeof PlacePicker>[0]['onSave'] }) {
  /* Starts on the demo store, so the Tess story is still a single tap. */
  const storeRoad = getRoad(savedPlaces.find((p) => p.kind === 'store')?.roadId)
  const start = storeRoad ? roadCentre(storeRoad) : cityView.center

  return (
    <>
      <div className="mb-4">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">
          Pin your place
        </h1>
        <p className="mt-1.5 text-[15px] font-medium leading-snug text-ink-muted">
          Put the pin on your store or home. We will warn you when water is expected on
          that street.
        </p>
      </div>

      <PlacePicker start={start} startKind="store" saveText="Save and finish" onSave={onSave} />
    </>
  )
}
