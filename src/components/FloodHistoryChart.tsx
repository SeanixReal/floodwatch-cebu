/* --------------------------------------------------------------------------
   Flood events by month. Hand-drawn in SVG so there is no chart library and
   nothing to load.
   -------------------------------------------------------------------------- */

interface Props {
  data: { month: string; count: number }[]
  height?: number
  /* Highlight the tallest month in the primary colour. */
  highlightPeak?: boolean
  compact?: boolean
}

export function FloodHistoryChart({
  data,
  height = 132,
  highlightPeak = true,
  compact = false,
}: Props) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a), data[0])
  const barW = compact ? 10 : 26
  const gap = compact ? 6 : 14
  const chartW = data.length * barW + (data.length - 1) * gap
  const labelSpace = compact ? 0 : 20
  const plotH = height - labelSpace

  return (
    <svg
      viewBox={`0 0 ${chartW} ${height}`}
      className="block w-full"
      style={{ height }}
      role="img"
      aria-label={`Flood events by month. Highest in ${peak.month} with ${peak.count}.`}
    >
      {data.map((d, i) => {
        const x = i * (barW + gap)
        const h = Math.max(3, (d.count / max) * (plotH - (compact ? 0 : 16)))
        const y = plotH - h
        const isPeak = highlightPeak && d.count === peak.count
        return (
          <g key={d.month}>
            {/* Track */}
            <rect
              x={x}
              y={0}
              width={barW}
              height={plotH}
              rx={barW / 2}
              fill="var(--surface)"
            />
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={barW / 2}
              fill={isPeak ? 'var(--primary)' : 'var(--secondary)'}
              style={{
                transformOrigin: `${x + barW / 2}px ${plotH}px`,
                animation: `bar-grow 520ms cubic-bezier(0.22,1,0.36,1) ${i * 55}ms both`,
              }}
            />
            {!compact && (
              <>
                <text
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill={isPeak ? 'var(--primary)' : 'var(--ink-muted)'}
                >
                  {d.count}
                </text>
                <text
                  x={x + barW / 2}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="var(--ink-faint)"
                >
                  {d.month}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
