import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { RainVisual } from '../components/RainVisual'
import { HomeIndicator, StatusBar } from '../components/StatusBar'
import { brand } from '../data/sample'

export function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const id = window.setTimeout(() => navigate('/onboarding'), 2200)
    return () => window.clearTimeout(id)
  }, [navigate])

  return (
    <div
      className="bg-grad-splash relative flex h-full flex-col overflow-hidden"
      onClick={() => navigate('/onboarding')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/onboarding')}
    >
      <RainVisual intensity={2} className="absolute inset-0 h-full w-full" />

      {/* Soft water glow behind the mark */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary opacity-20 blur-3xl" />

      <StatusBar tone="light" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-10 text-center">
        <div className="animate-rise-in">
          <Logo size={104} className="text-on-dark" water="var(--secondary)" />
        </div>

        <h1
          className="mt-7 text-[40px] font-extrabold leading-none tracking-tight text-on-dark animate-rise-in"
          style={{ animationDelay: '120ms' }}
        >
          FloodWatch
        </h1>
        <p
          className="mt-1.5 text-[19px] font-semibold tracking-[0.3em] text-secondary animate-rise-in"
          style={{ animationDelay: '200ms' }}
        >
          CEBU
        </p>

        <p
          className="mt-7 max-w-[260px] text-[17px] font-medium leading-snug text-on-dark-muted animate-rise-in"
          style={{ animationDelay: '300ms' }}
        >
          {brand.tagline}
        </p>
      </div>

      <div className="relative flex justify-center pb-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-[6px] w-[6px] rounded-full bg-on-dark"
              style={{
                opacity: 0.35,
                animation: `fade-in 700ms ease ${i * 200}ms infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      <HomeIndicator tone="light" />
    </div>
  )
}
