import { useNavigate } from 'react-router-dom'
import {
  CloudRain,
  CloudSun,
  Pause,
  Play,
  RotateCcw,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useApp } from '../state/AppState'

/* --------------------------------------------------------------------------
   Presenter controls. Lives OUTSIDE the phone frame so the app itself stays
   clean, and is hidden entirely in screenshot mode. Toggle with D.
   -------------------------------------------------------------------------- */

export function DemoPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const {
    rain,
    simRunning,
    startHeavyRain,
    pauseRain,
    resumeRain,
    clearRain,
    resetDemo,
  } = useApp()

  const heavy = rain === 'heavy'

  return (
    <aside className="animate-sheet-up fixed bottom-5 right-5 z-[2000] w-[276px] rounded-card bg-panel p-4 text-on-dark shadow-float">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-extrabold tracking-tight text-on-dark">
            Presenter controls
          </p>
          <p className="text-[11px] font-medium text-on-dark-muted">Not part of the app</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close presenter controls"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-on-dark/10 text-on-dark"
        >
          <X size={15} strokeWidth={2.6} />
        </button>
      </div>

      {/* Weather state */}
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-on-dark-muted">
        City conditions
      </p>
      <div className="mb-2 flex gap-1.5">
        <PanelToggle
          active={!heavy}
          onClick={() => {
            clearRain()
            navigate('/home')
          }}
          Icon={CloudSun}
          label="Normal day"
        />
        <PanelToggle
          active={heavy}
          onClick={() => {
            startHeavyRain()
            navigate('/home')
          }}
          Icon={CloudRain}
          label="Heavy rain"
        />
      </div>

      <p className="mb-3 text-[11px] font-medium leading-snug text-on-dark-muted">
        Heavy rain spreads through connected low-lying roads over about 27 seconds, then
        fires the warning for a saved place.
      </p>

      {/* Playback */}
      {heavy && (
        <div className="mb-3">
          <PanelButton
            Icon={simRunning ? Pause : Play}
            label={simRunning ? 'Pause the rain' : 'Resume the rain'}
            onClick={simRunning ? pauseRain : resumeRain}
          />
        </div>
      )}

      {/* Jumps */}
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-on-dark-muted">
        Jump to
      </p>
      <div className="space-y-1.5">
        <PanelButton
          Icon={TriangleAlert}
          label="Flood alert"
          accent
          onClick={() => navigate('/alert')}
        />
        <PanelButton
          Icon={RotateCcw}
          label="Reset everything"
          onClick={() => {
            resetDemo()
            navigate('/')
          }}
        />
      </div>

      <p className="mt-3 border-t border-on-dark/10 pt-2.5 text-[11px] font-medium leading-snug text-on-dark-muted">
        <span className="font-bold text-on-dark">D</span> controls &middot;{' '}
        <span className="font-bold text-on-dark">S</span> screenshot mode
      </p>
    </aside>
  )
}

function PanelToggle({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  Icon: typeof CloudSun
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-md px-1 py-2.5 text-[11px] font-bold transition-colors ${
        active
          ? 'bg-secondary text-on-secondary'
          : 'bg-on-dark/10 text-on-dark-muted hover:bg-on-dark/15'
      }`}
    >
      <Icon size={17} strokeWidth={2.4} />
      {label}
    </button>
  )
}

function PanelButton({
  Icon,
  label,
  onClick,
  accent = false,
}: {
  Icon: typeof CloudSun
  label: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-bold transition-colors ${
        accent ? 'bg-alert text-on-alert' : 'bg-on-dark/10 text-on-dark hover:bg-on-dark/15'
      }`}
    >
      <Icon size={16} strokeWidth={2.5} />
      {label}
    </button>
  )
}

/* The small hint that sits beside the phone during a live demo. */
export function DemoHint() {
  return (
    <div className="fixed bottom-5 right-5 z-[1900] flex items-center gap-2 rounded-md bg-panel/85 px-3 py-2 text-[12px] font-semibold text-on-dark-muted backdrop-blur">
      Press <Key>D</Key> for demo controls <span className="opacity-40">|</span>
      <Key>S</Key> for screenshot mode
    </div>
  )
}

function Key({ children }: { children: string }) {
  return (
    <span className="rounded-[5px] bg-on-dark/15 px-1.5 py-[1px] font-extrabold text-on-dark">
      {children}
    </span>
  )
}
