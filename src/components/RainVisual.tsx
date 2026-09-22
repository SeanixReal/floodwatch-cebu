/* --------------------------------------------------------------------------
   Decorative rain for the current-conditions card. Intensity 0-3.
   Pure CSS animation, no images.
   -------------------------------------------------------------------------- */

export function RainVisual({
  intensity,
  className = '',
}: {
  intensity: number
  className?: string
}) {
  const count = intensity >= 3 ? 16 : intensity === 2 ? 10 : intensity === 1 ? 6 : 0
  const drops = Array.from({ length: count }, (_, i) => ({
    left: (i * 97) % 100,
    delay: (i * 137) % 900,
    duration: 800 + ((i * 211) % 500),
    height: intensity >= 3 ? 16 : 11,
  }))

  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {drops.map((d, i) => (
        <span
          key={i}
          className="absolute block w-[2px] rounded-full bg-water"
          style={{
            left: `${d.left}%`,
            top: '-10%',
            height: d.height,
            opacity: 0.55,
            animation: `rain-fall ${d.duration}ms linear ${d.delay}ms infinite`,
          }}
        />
      ))}
    </div>
  )
}
