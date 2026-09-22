/* --------------------------------------------------------------------------
   PLACEHOLDER LOGO
   A location pin with a wavy water line across its lower third. Swap this one
   file for the real mark when the design team delivers it - nothing else in
   the app draws the logo.
   -------------------------------------------------------------------------- */

interface LogoProps {
  size?: number
  /* Colour of the pin body. Defaults to the surrounding text colour. */
  className?: string
  /* Colour of the water band. Any CSS colour or var(). */
  water?: string
  title?: string
}

const PIN_PATH =
  'M24 3.5c-8.6 0-15.6 6.9-15.6 15.4 0 10.9 13.1 22.3 14.6 23.6a1.5 1.5 0 0 0 2 0c1.5-1.3 14.6-12.7 14.6-23.6C39.6 10.4 32.6 3.5 24 3.5z'

export function Logo({
  size = 48,
  className,
  water = 'var(--water)',
  title = 'FloodWatch Cebu',
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <clipPath id="fw-pin-clip">
          <path d={PIN_PATH} />
        </clipPath>
      </defs>

      {/* Pin body */}
      <path d={PIN_PATH} fill="currentColor" />

      {/* Water across the lower third of the pin */}
      <g clipPath="url(#fw-pin-clip)">
        <path
          d="M2 31.5c3.7 0 3.7-3.2 7.3-3.2 3.7 0 3.7 3.2 7.3 3.2 3.7 0 3.7-3.2 7.4-3.2s3.7 3.2 7.3 3.2c3.7 0 3.7-3.2 7.4-3.2 3.6 0 3.6 3.2 7.3 3.2V48H2z"
          fill={water}
        />
        <path
          d="M2 26.4c3.7 0 3.7-3.1 7.3-3.1 3.7 0 3.7 3.1 7.3 3.1 3.7 0 3.7-3.1 7.4-3.1s3.7 3.1 7.3 3.1c3.7 0 3.7-3.1 7.4-3.1 3.6 0 3.6 3.1 7.3 3.1"
          stroke={water}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
          fill="none"
        />
      </g>
    </svg>
  )
}

/* Wordmark: logo + name, used on the splash and the app headers. */
export function Wordmark({
  size = 40,
  tone = 'dark',
}: {
  size?: number
  tone?: 'dark' | 'light'
}) {
  const nameColor = tone === 'light' ? 'text-on-dark' : 'text-primary'
  const suffixColor = tone === 'light' ? 'text-on-dark-muted' : 'text-secondary'
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} className={tone === 'light' ? 'text-on-dark' : 'text-primary'} />
      <span className={`text-[22px] font-extrabold tracking-tight ${nameColor}`}>
        FloodWatch
        <span className={`ml-1.5 font-semibold ${suffixColor}`}>Cebu</span>
      </span>
    </div>
  )
}
