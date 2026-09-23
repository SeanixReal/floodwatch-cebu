import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  ChevronRight,
  Clock,
  Languages,
  MessageSquare,
  Plus,
  RotateCcw,
  Trash2,
  Zap,
} from 'lucide-react'
import { Screen, SectionTitle, TopBar } from '../components/Screen'
import { Card, StatusChip } from '../components/ui'
import { placeKindIcon } from '../components/PlacePicker'
import { useApp } from '../state/AppState'
import { roadName } from '../data/roads'
import {
  alertChannels,
  languages,
  leadTimes,
  smsNote,
  user,
} from '../data/sample'

const channelIcon = { sms: MessageSquare, app: Bell, both: Zap }

export function Profile() {
  const navigate = useNavigate()
  const { profile, updateProfile, places, removePlace, statusOf, resetDemo } = useApp()

  return (
    <Screen nav className="bg-surface" tone="light" statusClass="bg-grad-header">
      <header className="bg-grad-header px-4 pb-16 pt-1">
        <div className="flex items-center gap-3.5">
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-on-dark/15 text-[22px] font-extrabold text-on-dark">
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[23px] font-extrabold leading-tight tracking-tight text-on-dark">
              {user.fullName}
            </h1>
            <p className="text-[13px] font-semibold text-on-dark-muted">
              Cebu City &middot; {user.memberSince}
            </p>
          </div>
        </div>
      </header>

      <div className="relative -mt-12 space-y-5 px-4 pb-4">
        {/* ---------------- Saved places ---------------- */}
        <section>
          <Card className="!p-0">
            <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
              <div>
                <h2 className="text-[16px] font-extrabold tracking-tight text-ink">
                  Saved places
                </h2>
                <p className="text-[12px] font-medium text-ink-muted">
                  How you get a personal warning
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/places/new')}
                className="tappable flex items-center gap-1 text-[13px] font-bold text-primary"
              >
                <Plus size={15} strokeWidth={3} />
                Add
              </button>
            </div>

            {places.length === 0 && (
              <p className="border-t border-line px-4 py-5 text-center text-[13px] font-medium text-ink-muted">
                No saved places yet. Add one to get a warning before the water arrives.
              </p>
            )}

            <ul>
              {places.map((p) => {
                const Icon = placeKindIcon[p.kind]
                return (
                  <li key={p.id} className="border-t border-line">
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/street/${p.roadId}`)}
                        className="tappable flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface text-primary">
                          <Icon size={18} strokeWidth={2.3} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-extrabold text-ink">
                            {p.label}
                          </span>
                          <span className="block truncate text-[13px] font-medium text-ink-muted">
                            {roadName(p.roadId)}
                          </span>
                        </span>
                        <StatusChip status={statusOf(p.roadId)} size="sm" />
                        <ChevronRight
                          size={17}
                          strokeWidth={2.5}
                          className="shrink-0 text-ink-faint"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlace(p.id)}
                        aria-label={`Remove ${p.label}`}
                        className="tappable flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-faint"
                      >
                        <Trash2 size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>

        {/* ---------------- Alert channel ---------------- */}
        <section>
          <SectionTitle
            action={
              <button
                type="button"
                onClick={() => navigate('/sms')}
                className="tappable text-[13px] font-bold text-primary"
              >
                Preview SMS
              </button>
            }
          >
            How you get alerts
          </SectionTitle>

          <Card className="!p-3">
            <div className="flex gap-2">
              {alertChannels.map((c) => {
                const active = profile.channel === c.id
                const Icon = channelIcon[c.id]
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateProfile({ channel: c.id })}
                    className={`tappable flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 px-1 py-3 ${
                      active ? 'border-primary bg-primary-soft' : 'border-line bg-card'
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={2.3}
                      className={active ? 'text-primary' : 'text-ink-faint'}
                    />
                    <span
                      className={`text-center text-[12px] font-extrabold leading-tight ${
                        active ? 'text-primary' : 'text-ink-muted'
                      }`}
                    >
                      {c.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-md bg-secondary-soft p-3">
              <MessageSquare
                size={15}
                strokeWidth={2.4}
                className="mt-[2px] shrink-0 text-primary"
              />
              <p className="text-[12px] font-semibold leading-snug text-on-secondary">
                {smsNote}
              </p>
            </div>
          </Card>
        </section>

        {/* ---------------- Lead time ---------------- */}
        <section>
          <SectionTitle>How early to warn you</SectionTitle>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Clock size={16} strokeWidth={2.4} className="text-primary" />
              <p className="text-[13px] font-semibold text-ink-muted">
                We aim to warn you this far ahead of the water.
              </p>
            </div>
            <div className="flex gap-2">
              {leadTimes.map((t) => {
                const active = profile.leadMinutes === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateProfile({ leadMinutes: t })}
                    className={`tappable flex-1 rounded-md border-2 py-2.5 text-[14px] font-extrabold ${
                      active
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-line bg-card text-ink-muted'
                    }`}
                  >
                    {t} min
                  </button>
                )
              })}
            </div>
          </Card>
        </section>

        {/* ---------------- Language ---------------- */}
        <section>
          <SectionTitle>Language</SectionTitle>
          <Card className="!p-3">
            <div className="flex gap-2">
              {languages.map((l) => {
                const active = profile.language === l.id
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => updateProfile({ language: l.id })}
                    className={`tappable flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 ${
                      active ? 'border-primary bg-primary-soft' : 'border-line bg-card'
                    }`}
                  >
                    <Languages
                      size={17}
                      strokeWidth={2.3}
                      className={active ? 'text-primary' : 'text-ink-faint'}
                    />
                    <span
                      className={`text-[14px] font-extrabold ${
                        active ? 'text-primary' : 'text-ink-muted'
                      }`}
                    >
                      {l.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2.5 px-1 text-[12px] font-medium text-ink-faint">
              Cebuano wording is part of the design, not switched on in this prototype.
            </p>
          </Card>
        </section>

        {/* ---------------- Business ---------------- */}
        <Card
          as="button"
          onClick={() => navigate('/business')}
          className="flex items-center gap-3 border-primary/15 bg-primary-soft"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary">
            <Briefcase size={19} strokeWidth={2.3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold text-primary">
              FloodWatch Business
            </span>
            <span className="block text-[13px] font-medium text-ink-muted">
              Watch several stores at once.
            </span>
          </span>
          <ChevronRight size={18} strokeWidth={2.5} className="shrink-0 text-primary" />
        </Card>

        {/* ---------------- Restart the demo ---------------- */}
        <button
          type="button"
          onClick={() => {
            resetDemo()
            navigate('/')
          }}
          className="tappable flex w-full items-center justify-center gap-2 rounded-card border border-line bg-card py-3.5 text-[14px] font-bold text-ink-muted"
        >
          <RotateCcw size={16} strokeWidth={2.4} />
          Restart the demo
        </button>

        <p className="pb-1 text-center text-[12px] font-medium text-ink-faint">
          FloodWatch Cebu &middot; interface prototype
        </p>
      </div>
    </Screen>
  )
}
