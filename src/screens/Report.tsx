import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, Check, CircleCheckBig, MapPin, Navigation, Send, Users } from 'lucide-react'
import { Screen, SectionTitle, TopBar } from '../components/Screen'
import { Button, Card } from '../components/ui'
import { DepthIllustration } from '../components/DepthIllustration'
import { useApp } from '../state/AppState'
import { getRoad, roadName, roadsByName } from '../data/roads'
import { depthOrder, depths, type DepthKey } from '../data/sample'

export function Report() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { addReport, places } = useApp()

  /* Prefilled with "where you are": the road passed in, or a saved place. */
  const preset =
    getRoad(params.get('road') ?? '')?.properties.id ??
    places[0]?.roadId ??
    roadsByName[0].properties.id

  const [roadId, setRoadId] = useState(preset)
  const [depth, setDepth] = useState<DepthKey | null>(null)
  const [photo, setPhoto] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = () => {
    if (!depth) return
    addReport({ roadId, depth: depths[depth].short })
    setSent(true)
  }

  if (sent) return <ReportSent roadId={roadId} />

  return (
    <Screen
      nav
      className="bg-surface"
      footer={
        <div className="border-t border-line bg-card px-4 pb-2 pt-3">
          <Button onClick={submit} className={depth ? '' : 'opacity-45'}>
            <Send size={18} strokeWidth={2.6} />
            Send report
          </Button>
          {!depth && (
            <p className="pt-2 text-center text-[12px] font-semibold text-ink-faint">
              Pick how deep the water is to send
            </p>
          )}
        </div>
      }
    >
      <TopBar title="Report a flood" subtitle="Takes about 20 seconds" fallback="/home" />

      <div className="space-y-4 px-4 pb-4">
        {/* ---------------- Location ---------------- */}
        <section>
          <SectionTitle>Where is the water?</SectionTitle>
          <Card>
            <div className="mb-3 flex items-center gap-2 rounded-md bg-secondary-soft px-3 py-2">
              <Navigation size={15} strokeWidth={2.6} className="text-primary" />
              <span className="text-[12px] font-bold text-on-secondary">
                Filled in from your current location
              </span>
            </div>

            <label className="mb-1 block text-[12px] font-bold text-ink-muted">
              Road
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
              Cebu City &middot; road names from OpenStreetMap
            </p>
          </Card>
        </section>

        {/* ---------------- Depth ---------------- */}
        <section>
          <SectionTitle>How deep is it?</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {depthOrder.map((d) => {
              const active = depth === d
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`tappable flex flex-col items-center gap-1.5 rounded-lg border-2 px-1 pb-2.5 pt-3 ${
                    active ? 'border-primary bg-primary-soft' : 'border-line bg-card'
                  }`}
                >
                  <DepthIllustration depth={d} size={40} active={active} />
                  <span
                    className={`text-[13px] font-extrabold ${
                      active ? 'text-primary' : 'text-ink-muted'
                    }`}
                  >
                    {depths[d].short}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ---------------- Photo ---------------- */}
        <section>
          <SectionTitle
            action={
              <span className="text-[12px] font-semibold text-ink-faint">Optional</span>
            }
          >
            Add a photo
          </SectionTitle>

          <button
            type="button"
            onClick={() => setPhoto((p) => !p)}
            className={`tappable flex h-[112px] w-full flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed ${
              photo ? 'border-safe bg-safe-soft' : 'border-line bg-card'
            }`}
          >
            {photo ? (
              <>
                <CircleCheckBig size={26} strokeWidth={2.2} className="text-safe" />
                <span className="text-[14px] font-bold text-ink">Photo attached</span>
                <span className="text-[12px] font-medium text-ink-muted">
                  Tap to remove
                </span>
              </>
            ) : (
              <>
                <Camera size={26} strokeWidth={2} className="text-ink-faint" />
                <span className="text-[14px] font-bold text-ink-muted">
                  Take or upload a photo
                </span>
                <span className="text-[12px] font-medium text-ink-faint">
                  Helps neighbours confirm it faster
                </span>
              </>
            )}
          </button>
        </section>

        {/* ---------------- What happens next ---------------- */}
        <div className="flex items-start gap-2.5 rounded-md border border-line bg-card p-3.5">
          <Users size={17} strokeWidth={2.3} className="mt-[2px] shrink-0 text-primary" />
          <p className="text-[13px] font-medium leading-snug text-ink-muted">
            Your report goes to neighbours on the same road. Once two of them confirm it,
            it counts as verified and helps warn everyone else.
          </p>
        </div>
      </div>
    </Screen>
  )
}

/* -------------------------------------------------------------------------- */

function ReportSent({ roadId }: { roadId: string }) {
  const navigate = useNavigate()
  const name = roadName(roadId)

  return (
    <Screen className="bg-canvas">
      <div className="flex h-full flex-col items-center px-6 pb-4 pt-16 text-center">
        <span className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full bg-safe-soft text-safe animate-rise-in">
          <span className="absolute inset-0 animate-halo rounded-full bg-safe/20" />
          <Check size={46} strokeWidth={3} className="relative" />
        </span>

        <h1
          className="mt-6 text-[27px] font-extrabold leading-tight tracking-tight text-ink animate-rise-in"
          style={{ animationDelay: '90ms' }}
        >
          Report sent
        </h1>
        <p
          className="mt-2 text-balance text-[16px] font-medium leading-snug text-ink-muted animate-rise-in"
          style={{ animationDelay: '150ms' }}
        >
          Thank you. Neighbours on {name} have been asked to confirm it.
        </p>

        <div
          className="mt-6 w-full rounded-card border border-line bg-surface p-4 text-left animate-rise-in"
          style={{ animationDelay: '210ms' }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-alert-soft text-alert-strong">
              <Users size={15} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-extrabold text-ink">
              Pending confirmation
            </span>
          </div>
          <p className="mt-2 text-[14px] font-medium leading-snug text-ink-muted">
            Your report is pending until 2 more people confirm it. We will let you know
            the moment it is verified.
          </p>

          <div className="mt-3 flex items-center gap-1.5">
            {[true, false, false].map((filled, i) => (
              <span
                key={i}
                className={`h-[6px] flex-1 rounded-full ${
                  filled ? 'bg-safe' : 'bg-surface2'
                }`}
              />
            ))}
            <span className="ml-1 text-[12px] font-bold text-ink-faint">1 of 3</span>
          </div>
        </div>

        <div className="mt-auto w-full space-y-2.5 pt-6">
          <Button variant="secondary" onClick={() => navigate(`/street/${roadId}`)}>
            View {name}
          </Button>
          <Button onClick={() => navigate('/home')}>Back to home</Button>
        </div>
      </div>
    </Screen>
  )
}
