import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { PhoneFrame } from './components/PhoneFrame'
import { DemoHint, DemoPanel } from './components/DemoPanel'
import { useApp } from './state/AppState'

import { Splash } from './screens/Splash'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { FloodAlert } from './screens/FloodAlert'
import { StreetDetail } from './screens/StreetDetail'
import { Report } from './screens/Report'
import { SmsPreview } from './screens/SmsPreview'
import { BusinessDashboard } from './screens/BusinessDashboard'
import { Alerts } from './screens/Alerts'
import { MapScreen } from './screens/MapScreen'
import { Profile } from './screens/Profile'

export default function App() {
  const [screenshot, setScreenshot] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const { demoKey } = useApp()

  useAutoAlert()

  /* S = screenshot mode, D = presenter controls. Ignored while typing so the
     onboarding and report inputs still work normally. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return
      }
      const key = e.key.toLowerCase()
      if (key === 's') setScreenshot((v) => !v)
      if (key === 'd') setDemoOpen((v) => !v)
      if (key === 'escape') {
        setDemoOpen(false)
        setScreenshot(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className={`flex min-h-full w-full items-center justify-center ${
        screenshot ? 'bg-canvas p-0' : 'bg-stage p-6'
      }`}
    >
      <PhoneFrame bare={screenshot}>
        <AppRoutes key={demoKey} />
      </PhoneFrame>

      {!screenshot && (demoOpen ? <DemoPanel onClose={() => setDemoOpen(false)} /> : <DemoHint />)}
    </div>
  )
}

/* --------------------------------------------------------------------------
   The moment the simulation puts a saved place's road on Watch, the warning
   takes over the screen - the way a real push notification would. The short
   delay lets the room see that road turn amber on the map first.
   -------------------------------------------------------------------------- */
function useAutoAlert() {
  const navigate = useNavigate()
  const location = useLocation()
  const { alertPlace } = useApp()
  const firedFor = useRef<string | null>(null)

  /* Read through a ref so a route change does not re-trigger the effect. */
  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname

  useEffect(() => {
    if (!alertPlace) {
      firedFor.current = null
      return
    }
    if (firedFor.current === alertPlace.id) return
    firedFor.current = alertPlace.id

    const id = window.setTimeout(() => {
      if (pathRef.current !== '/alert') navigate('/alert')
    }, 1400)
    return () => window.clearTimeout(id)
  }, [alertPlace, navigate])
}

function AppRoutes() {
  const location = useLocation()

  return (
    /* Keyed on the path so each screen animates in and starts at the top. */
    <div key={location.pathname} className="animate-screen-in h-full">
      <Routes location={location}>
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/alert" element={<FloodAlert />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/street/:roadId" element={<StreetDetail />} />
        <Route path="/report" element={<Report />} />
        <Route path="/sms" element={<SmsPreview />} />
        <Route path="/business" element={<BusinessDashboard />} />
        <Route path="/profile" element={<Profile />} />
        {/* Anything unknown goes home rather than showing a blank screen. */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}
