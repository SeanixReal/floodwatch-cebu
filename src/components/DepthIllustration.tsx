import type { DepthKey } from '../data/sample'

/* --------------------------------------------------------------------------
   A person standing in water, with the waterline at ankle / knee / waist /
   higher. Used by the depth picker and the street detail.
   -------------------------------------------------------------------------- */

/* Waterline y in the 64-tall viewBox. Lower number = deeper water. */
const waterline: Record<DepthKey, number> = {
  ankle: 55,
  knee: 43,
  waist: 32,
  higher: 21,
}

export function DepthIllustration({
  depth,
  size = 56,
  active = false,
}: {
  depth: DepthKey
  size?: number
  active?: boolean
}) {
  const y = waterline[depth]
  const clipId = `depth-clip-${depth}`
  const figure = active ? 'var(--primary)' : 'var(--ink-faint)'

  return (
    <svg
      width={size}
      height={(size / 48) * 64}
      viewBox="0 0 48 64"
      fill="none"
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={y} width="48" height={64 - y} />
        </clipPath>
      </defs>

      {/* Figure */}
      <g fill={figure}>
        <circle cx="24" cy="12" r="6" />
        <rect x="20.5" y="19" width="7" height="21" rx="3.5" />
        <rect x="11" y="21" width="9.5" height="5.5" rx="2.75" />
        <rect x="27.5" y="21" width="9.5" height="5.5" rx="2.75" />
        <rect x="19" y="38" width="4.6" height="22" rx="2.3" />
        <rect x="24.4" y="38" width="4.6" height="22" rx="2.3" />
      </g>

      {/* Water in front of the figure */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y={y} width="48" height={64 - y} fill="var(--water)" opacity="0.92" />
      </g>

      {/* Waterline ripple */}
      <path
        d={`M0 ${y} q6 -3 12 0 t12 0 t12 0 t12 0`}
        stroke="var(--water-deep)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
