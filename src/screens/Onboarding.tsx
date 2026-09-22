import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  House,
  MapPin,
  MessageSquare,
  Route,
  Store,
  Zap,
} from 'lucide-react'
import { Screen } from '../components/Screen'
import { Button } from '../components/ui'
import { Logo } from '../components/Logo'
import { useApp } from '../state/AppState'
import { roadsByName } from '../data/roads'
import {
  alertChannels,
  placeKindLabel,
  placeSuggestions,
  smsNote,
  type ChannelId,
  type SavedPlace,
} from '../data/sample'

const STEPS = 2

export function Onboarding() {
  const navigate = useNavigate()
  const { profile, updateProfile, addPlace } = useApp()
  const [step, setStep] = useState(0)

  const finish = () => navigate('/home')

  return (
    <Screen>
      <div className="flex items-center gap-3 px-5 pb-5 pt-1">
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

      <div key={step} className="animate-screen-in px-5 pb-6">
        {step === 0 ? (
          <ChannelStep
            value={profile.channel}
            onChange={(c) => updateProfile({ channel: c })}
          />
        ) : (
          <PlaceStep onSave={addPlace} onDone={finish} />
        )}
      </div>

      {step === 0 && (
        <div className="px-5 pb-4">
          <Button onClick={() => setStep(1)}>
            Continue
            <ArrowRight size={18} strokeWidth={2.6} />
          </Button>
        </div>
      )}
    </Screen>
  )
}

/* --- Step header ---------------------------------------------------------- */

function StepHead({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-5">
      <Logo size={34} className="text-primary" />
      <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-1.5 text-[15px] font-medium leading-snug text-ink-muted">
        {blurb}
      </p>
    </div>
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
      <StepHead
        title="How should we reach you?"
        blurb="Pick how the warning arrives when water is on the way."
      />
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

/* --- 2. Save a place (optional) ------------------------------------------- */

const kindIcon = { home: House, store: Store, route: Route }

function PlaceStep({
  onSave,
  onDone,
}: {
  onSave: (place: Omit<SavedPlace, 'id'>) => void
  onDone: () => void
}) {
  const [label, setLabel] = useState(placeSuggestions[0].label)
  const [kind, setKind] = useState<SavedPlace['kind']>(placeSuggestions[0].kind)
  const [roadId, setRoadId] = useState(placeSuggestions[0].roadId)

  const save = () => {
    if (label.trim()) onSave({ label: label.trim(), kind, roadId })
    onDone()
  }

  return (
    <>
      <StepHead
        title="Save a place"
        blurb="Saved places are how you get a personal warning. You can add more later, or skip this for now."
      />

      {/* One-tap starting points */}
      <div className="mb-4 flex flex-wrap gap-2">
        {placeSuggestions.map((s) => {
          const active = s.roadId === roadId && s.label === label
          const Icon = kindIcon[s.kind]
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setLabel(s.label)
                setKind(s.kind)
                setRoadId(s.roadId)
              }}
              className={`tappable flex items-center gap-1.5 rounded-pill border px-3 py-2 text-[13px] font-bold ${
                active
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line bg-card text-ink-muted'
              }`}
            >
              <Icon size={14} strokeWidth={2.6} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="rounded-card border border-line bg-card p-4">
        <label className="mb-1 block text-[12px] font-bold text-ink-muted">
          What do you call it?
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="My sari-sari store"
          className="mb-3 h-12 w-full rounded-md border border-line bg-surface px-3 text-[16px] font-semibold text-ink outline-none focus:border-secondary"
        />

        <label className="mb-1 block text-[12px] font-bold text-ink-muted">Type</label>
        <div className="mb-3 flex gap-2">
          {(Object.keys(placeKindLabel) as SavedPlace['kind'][]).map((k) => {
            const active = kind === k
            const Icon = kindIcon[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
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

        <label className="mb-1 block text-[12px] font-bold text-ink-muted">
          Which road?
        </label>
        <div className="relative">
          <MapPin
            size={17}
            strokeWidth={2.4}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <select
            value={roadId}
            onChange={(e) => setRoadId(e.target.value)}
            className="h-12 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-[16px] font-semibold text-ink outline-none focus:border-secondary"
          >
            {roadsByName.map((r) => (
              <option key={r.properties.id} value={r.properties.id}>
                {r.properties.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-[12px] font-medium text-ink-faint">
          Road names come from OpenStreetMap.
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        <Button onClick={save}>
          Save place and finish
          <ArrowRight size={18} strokeWidth={2.6} />
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Not now
        </Button>
      </div>
    </>
  )
}
