import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { BadgeCheck, Droplets, Users } from 'lucide-react'
import { sourceLine, statusLabels, type FloodStatus } from '../data/sample'

/* --------------------------------------------------------------------------
   Small shared pieces: cards, buttons, status chips, the source note.
   -------------------------------------------------------------------------- */

export function Card({
  children,
  className = '',
  as = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'button'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'rounded-card border border-line bg-card p-4 shadow-card text-left w-full'
  if (as === 'button') {
    return (
      <button type="button" className={`tappable ${base} ${className}`} {...rest}>
        {children}
      </button>
    )
  }
  return <div className={`${base} ${className}`}>{children}</div>
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'outline-light'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary active:bg-primary-hover shadow-card',
  secondary: 'bg-primary-soft text-primary',
  ghost: 'bg-surface text-ink',
  dark: 'bg-primary-deep text-on-dark shadow-card',
  'outline-light': 'bg-transparent text-on-alert ring-2 ring-inset ring-on-alert/35',
}

export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  className = '',
  ...rest
}: {
  children: ReactNode
  variant?: ButtonVariant
  size?: 'lg' | 'md'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizing =
    size === 'lg'
      ? 'h-[52px] text-[16px] rounded-lg px-5'
      : 'h-[42px] text-[14px] rounded-md px-4'
  return (
    <button
      type="button"
      className={`tappable inline-flex w-full items-center justify-center gap-2 font-bold tracking-tight ${sizing} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* --- Status chip ---------------------------------------------------------- */

const statusStyles: Record<FloodStatus, { chip: string; dot: string }> = {
  clear: { chip: 'bg-safe-soft text-safe', dot: 'bg-safe' },
  watch: { chip: 'bg-alert-soft text-alert-strong', dot: 'bg-alert' },
  flooding: { chip: 'bg-danger-soft text-danger', dot: 'bg-danger' },
}

export function StatusChip({
  status,
  size = 'md',
  label,
}: {
  status: FloodStatus
  size?: 'sm' | 'md'
  label?: string
}) {
  const s = statusStyles[status]
  const sizing =
    size === 'sm'
      ? 'text-[11px] px-2 py-[3px] gap-1.5'
      : 'text-[13px] px-2.5 py-[5px] gap-2'
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md font-bold ${sizing} ${s.chip}`}
    >
      <span className={`h-[7px] w-[7px] rounded-full ${s.dot}`} />
      {label ?? statusLabels[status].label}
    </span>
  )
}

/* Solid version, for use on a dark or amber surface. */
export function StatusPill({ status }: { status: FloodStatus }) {
  const bg =
    status === 'clear' ? 'bg-safe' : status === 'watch' ? 'bg-alert' : 'bg-danger'
  const ink = status === 'watch' ? 'text-on-alert' : 'text-on-primary'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide ${bg} ${ink}`}
    >
      {statusLabels[status].label}
    </span>
  )
}

/* --- Where a warning comes from ------------------------------------------- */

export function SourceNote({
  reportCount,
  tone = 'light',
  className = '',
}: {
  reportCount: number
  tone?: 'light' | 'onAlert' | 'onDark'
  className?: string
}) {
  const styles = {
    light: 'bg-surface text-ink-muted',
    onAlert: 'bg-on-alert/10 text-on-alert',
    onDark: 'bg-on-dark/12 text-on-dark-muted',
  }[tone]

  return (
    <div
      className={`flex items-start gap-2.5 rounded-md p-3 text-[13px] font-medium leading-snug ${styles} ${className}`}
    >
      <span className="mt-[1px] flex shrink-0 items-center gap-1">
        <Droplets size={15} strokeWidth={2.2} />
        <Users size={15} strokeWidth={2.2} />
      </span>
      <span>{sourceLine(reportCount)}</span>
    </div>
  )
}

/* --- Verified badge ------------------------------------------------------- */

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-[7px] bg-surface2 px-1.5 py-[2px] text-[11px] font-bold text-ink-muted">
        Pending
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[7px] bg-safe-soft px-1.5 py-[2px] text-[11px] font-bold text-safe">
      <BadgeCheck size={12} strokeWidth={2.6} />
      Verified
    </span>
  )
}

/* --- Simple avatar for community reports ---------------------------------- */

export function Initial({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-soft text-[14px] font-extrabold text-primary">
      {name.charAt(0)}
    </span>
  )
}
