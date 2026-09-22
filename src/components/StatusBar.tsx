import { useEffect, useState } from 'react'

/* A convincing iOS-style status bar. `tone` matches it to whatever is behind. */
export function StatusBar({
  tone = 'dark',
  className = '',
}: {
  tone?: 'dark' | 'light'
  className?: string
}) {
  const [time, setTime] = useState(formatTime)

  useEffect(() => {
    const id = window.setInterval(() => setTime(formatTime()), 15000)
    return () => window.clearInterval(id)
  }, [])

  const color = tone === 'light' ? 'text-on-dark' : 'text-ink'

  return (
    <div
      className={`flex h-[44px] shrink-0 items-center justify-between px-[26px] ${color} ${className}`}
    >
      <span className="text-[15px] font-bold tabular-nums tracking-tight">{time}</span>
      <div className="flex items-center gap-[5px]">
        <Bars />
        <WifiGlyph />
        <Battery />
      </div>
    </div>
  )
}

function formatTime() {
  return new Date()
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .replace(/\s?[AP]M/i, '')
}

function Bars() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0.5" width="3" height="11.5" rx="1" />
    </svg>
  )
}

function WifiGlyph() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <path d="M8 11.2 5.9 8.8a3.2 3.2 0 0 1 4.2 0L8 11.2Z" />
      <path
        d="M3.6 6.4a6.6 6.6 0 0 1 8.8 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1.2 3.7a10.2 10.2 0 0 1 13.6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function Battery() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden>
      <rect
        x="0.6"
        y="0.6"
        width="21"
        height="10.8"
        rx="3.2"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.1"
      />
      <rect x="2.2" y="2.2" width="15" height="7.6" rx="2" fill="currentColor" />
      <path
        d="M23.2 4.2v3.6c.9-.3 1.4-.9 1.4-1.8s-.5-1.5-1.4-1.8Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </svg>
  )
}

/* The bar at the very bottom of an iPhone screen. */
export function HomeIndicator({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <div className="flex h-[22px] shrink-0 items-center justify-center">
      <div
        className={`h-[5px] w-[134px] rounded-full ${
          tone === 'light' ? 'bg-on-dark/45' : 'bg-ink/25'
        }`}
      />
    </div>
  )
}
