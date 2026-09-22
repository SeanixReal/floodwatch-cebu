import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { HomeIndicator, StatusBar } from './StatusBar'

/* --------------------------------------------------------------------------
   Every screen is built from this scaffold so the 390 x 844 box is never
   guessed at: status bar + scrolling body + optional nav + home indicator.
   -------------------------------------------------------------------------- */

interface ScreenProps {
  children: ReactNode
  /* Status-bar ink. Use "light" whenever the top of the screen is dark. */
  tone?: 'dark' | 'light'
  /* Class applied behind the status bar so it blends with the header. */
  statusClass?: string
  /* Class applied to the whole screen. */
  className?: string
  nav?: boolean
  /* Pinned above the nav, e.g. a primary action bar. */
  footer?: ReactNode
  indicatorTone?: 'dark' | 'light'
  /* false turns the body into a fixed flex column instead of a scroller, for
     screens like Home where a map has to fill the remaining height. */
  scroll?: boolean
}

export function Screen({
  children,
  tone = 'dark',
  statusClass = '',
  className = 'bg-canvas',
  nav = false,
  footer,
  indicatorTone,
  scroll = true,
}: ScreenProps) {
  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      <StatusBar tone={tone} className={statusClass} />
      <div
        className={
          scroll
            ? 'no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain'
            : 'flex min-h-0 flex-1 flex-col overflow-hidden'
        }
      >
        {children}
      </div>
      {footer}
      {nav && <BottomNav />}
      <HomeIndicator tone={indicatorTone ?? (nav ? 'dark' : tone)} />
    </div>
  )
}

/* --------------------------------------------------------------------------
   Standard inner header with a back button. `tone` light = sits on blue.
   -------------------------------------------------------------------------- */

export function TopBar({
  title,
  subtitle,
  tone = 'dark',
  right,
  onBack,
  fallback = '/home',
}: {
  title: string
  subtitle?: string
  tone?: 'dark' | 'light'
  right?: ReactNode
  onBack?: () => void
  fallback?: string
}) {
  const navigate = useNavigate()
  const light = tone === 'light'

  const goBack = () => {
    if (onBack) return onBack()
    /* history.length is 1 when the demo was deep-linked or reset, so fall back
       to a real screen instead of leaving the user on a dead end. */
    if (window.history.length > 1) navigate(-1)
    else navigate(fallback)
  }

  return (
    <div className="flex items-center gap-3 px-4 pb-3 pt-1">
      <button
        type="button"
        onClick={goBack}
        aria-label="Go back"
        className={`tappable flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          light ? 'bg-on-dark/15 text-on-dark' : 'bg-surface text-ink'
        }`}
      >
        <ArrowLeft size={20} strokeWidth={2.3} />
      </button>
      <div className="min-w-0 flex-1">
        <h1
          className={`truncate text-[19px] font-extrabold leading-tight tracking-tight ${
            light ? 'text-on-dark' : 'text-ink'
          }`}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={`truncate text-[13px] font-medium ${
              light ? 'text-on-dark-muted' : 'text-ink-muted'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

/* Section heading used down the length of the longer screens. */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="text-[16px] font-extrabold tracking-tight text-ink">{children}</h2>
      {action}
    </div>
  )
}
