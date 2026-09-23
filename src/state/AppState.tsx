import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  floodAlert,
  floodScenario,
  savedPlaces as defaultPlaces,
  statusFromRisk,
  type ChannelId,
  type FloodStatus,
  type LanguageId,
  type SavedPlace,
} from '../data/sample'
import { emptyRisk, ease, targetsAt, type RiskMap } from './floodSim'

/* --------------------------------------------------------------------------
   One small store for the whole prototype. No backend, no persistence - the
   presenter can reset it at any time from the demo panel (D).
   -------------------------------------------------------------------------- */

interface Profile {
  channel: ChannelId
  leadMinutes: number
  language: LanguageId
}

export type RainMode = 'normal' | 'heavy'

interface AppStateValue {
  /* Weather ------------------------------------------------------------- */
  rain: RainMode
  simRunning: boolean
  startHeavyRain: () => void
  pauseRain: () => void
  resumeRain: () => void
  clearRain: () => void

  /* Road conditions ----------------------------------------------------- */
  risk: RiskMap
  riskOf: (roadId: string) => number
  statusOf: (roadId: string) => FloodStatus

  /* Profile and places -------------------------------------------------- */
  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  places: SavedPlace[]
  addPlace: (place: Omit<SavedPlace, 'id'>) => void
  removePlace: (id: string) => void

  /* The warning --------------------------------------------------------- */
  /* The saved place the live warning is about, if any. */
  alertPlace: SavedPlace | null
  secondsLeft: number
  prepared: boolean
  markPrepared: () => void

  /* Reports filed during the demo, newest first. */
  myReports: { id: string; roadId: string; depth: string }[]
  addReport: (report: { roadId: string; depth: string }) => void

  resetDemo: () => void
  /* Bumped on reset so the router can remount cleanly. */
  demoKey: number
}

const defaultProfile: Profile = {
  channel: 'both',
  leadMinutes: 30,
  language: 'en',
}

const AppStateContext = createContext<AppStateValue | null>(null)

/* How fast a road eases toward its target risk. 0.02 per 60ms tick is a
   little over a second for a full green-to-red transition. */
const TICK_MS = 60
const EASE_RATE = 0.02

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [rain, setRain] = useState<RainMode>('normal')
  const [simRunning, setSimRunning] = useState(false)
  const [risk, setRisk] = useState<RiskMap>(emptyRisk)
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [places, setPlaces] = useState<SavedPlace[]>(defaultPlaces)
  const [secondsLeft, setSecondsLeft] = useState(floodAlert.leadMinutes * 60)
  const [prepared, setPrepared] = useState(false)
  const [alertPlace, setAlertPlace] = useState<SavedPlace | null>(null)
  const [myReports, setMyReports] = useState<AppStateValue['myReports']>([])
  const [demoKey, setDemoKey] = useState(0)

  /* Simulation clock, in ms of demo time. Held in a ref so pausing does not
     lose the position. */
  const elapsed = useRef(0)
  const reportSeq = useRef(0)

  /* --- The simulation loop --------------------------------------------- */
  useEffect(() => {
    if (!simRunning) return
    const id = window.setInterval(() => {
      elapsed.current = Math.min(elapsed.current + TICK_MS, floodScenario.totalMs)
      const targets = targetsAt(elapsed.current)
      setRisk((current) => ease(current, targets, EASE_RATE))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [simRunning])

  /* --- The countdown ---------------------------------------------------- */
  /* Ticks for real: a frozen number reads as a mock-up on a projector. */
  useEffect(() => {
    if (!alertPlace) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [alertPlace])

  /* --- Fire the warning ------------------------------------------------- */
  /* The moment a saved place's road reaches Watch, the warning goes out. The
     water has not arrived yet - that is the whole point of the product. */
  useEffect(() => {
    if (alertPlace) return
    const hit = places.find((p) => statusFromRisk(risk[p.roadId] ?? 0) !== 'clear')
    if (hit) {
      setSecondsLeft(floodAlert.leadMinutes * 60)
      setAlertPlace(hit)
    }
  }, [risk, places, alertPlace])

  /* --- Actions ---------------------------------------------------------- */

  const startHeavyRain = useCallback(() => {
    elapsed.current = 0
    setRisk(emptyRisk())
    setPrepared(false)
    setAlertPlace(null)
    setRain('heavy')
    setSimRunning(true)
  }, [])

  const pauseRain = useCallback(() => setSimRunning(false), [])

  const resumeRain = useCallback(() => {
    if (elapsed.current < floodScenario.totalMs) setSimRunning(true)
  }, [])

  const clearRain = useCallback(() => {
    elapsed.current = 0
    setSimRunning(false)
    setRain('normal')
    setRisk(emptyRisk())
    setAlertPlace(null)
    setPrepared(false)
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((p) => ({ ...p, ...patch }))
  }, [])

  /* One place per road: warnings are per road, so saving a second pin on the
     same road updates the existing place (new name, type, pin) instead. */
  const addPlace = useCallback((place: Omit<SavedPlace, 'id'>) => {
    setPlaces((current) => {
      const existing = current.find((p) => p.roadId === place.roadId)
      if (existing) {
        return current.map((p) => (p === existing ? { ...existing, ...place } : p))
      }
      return [...current, { ...place, id: `place-${current.length + 1}-${place.roadId}` }]
    })
  }, [])

  const removePlace = useCallback((id: string) => {
    setPlaces((current) => current.filter((p) => p.id !== id))
  }, [])

  const markPrepared = useCallback(() => setPrepared(true), [])

  const addReport = useCallback((report: { roadId: string; depth: string }) => {
    reportSeq.current += 1
    setMyReports((r) => [{ id: `own-${reportSeq.current}`, ...report }, ...r])
  }, [])

  const riskOf = useCallback((roadId: string) => risk[roadId] ?? 0, [risk])
  const statusOf = useCallback(
    (roadId: string) => statusFromRisk(risk[roadId] ?? 0),
    [risk],
  )

  const resetDemo = useCallback(() => {
    elapsed.current = 0
    reportSeq.current = 0
    setSimRunning(false)
    setRain('normal')
    setRisk(emptyRisk())
    setProfile(defaultProfile)
    setPlaces(defaultPlaces)
    setSecondsLeft(floodAlert.leadMinutes * 60)
    setPrepared(false)
    setAlertPlace(null)
    setMyReports([])
    setDemoKey((k) => k + 1)
  }, [])

  const value = useMemo<AppStateValue>(
    () => ({
      rain,
      simRunning,
      startHeavyRain,
      pauseRain,
      resumeRain,
      clearRain,
      risk,
      riskOf,
      statusOf,
      profile,
      updateProfile,
      places,
      addPlace,
      removePlace,
      alertPlace,
      secondsLeft,
      prepared,
      markPrepared,
      myReports,
      addReport,
      resetDemo,
      demoKey,
    }),
    [
      rain,
      simRunning,
      startHeavyRain,
      pauseRain,
      resumeRain,
      clearRain,
      risk,
      riskOf,
      statusOf,
      profile,
      updateProfile,
      places,
      addPlace,
      removePlace,
      alertPlace,
      secondsLeft,
      prepared,
      markPrepared,
      myReports,
      addReport,
      resetDemo,
      demoKey,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useApp must be used inside <AppStateProvider>')
  return ctx
}

/* Formats the countdown as M:SS / MM:SS. */
export function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
