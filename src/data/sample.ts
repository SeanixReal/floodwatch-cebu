/* ==========================================================================
   FloodWatch Cebu - sample content
   --------------------------------------------------------------------------
   THIS IS THE ONLY FILE WITH SAMPLE DATA. Road names and geometry come from
   OpenStreetMap (src/data/roads.geojson); everything about water, reports and
   people is invented for the demo.

   House rules for anything written in this file:
     - Warnings come from RAINFALL / WEATHER INFORMATION plus VERIFIED
       COMMUNITY REPORTS. Never mention sensors, devices or hardware.
     - Do not write statistics about Cebu City. Everything here describes one
       made-up afternoon for one made-up store owner.
   ========================================================================== */

import { roadName } from './roads'

export type FloodStatus = 'clear' | 'watch' | 'flooding'
export type DepthKey = 'ankle' | 'knee' | 'waist' | 'higher'
export type Trend = 'rising' | 'falling' | 'steady'

/* --- Brand ---------------------------------------------------------------- */

export const brand = {
  name: 'FloodWatch',
  nameSuffix: 'Cebu',
  fullName: 'FloodWatch Cebu',
  tagline: 'Know before the water does.',
}

/* --- The person using the app --------------------------------------------- */

export const user = {
  firstName: 'Tess',
  fullName: 'Tess Abellana',
  initials: 'TA',
  memberSince: 'Member since June',
}

/* --- Plain-language depth scale ------------------------------------------- */

export const depths: Record<
  DepthKey,
  { key: DepthKey; label: string; plain: string; short: string }
> = {
  ankle: { key: 'ankle', label: 'Ankle-deep', plain: 'About ankle-deep', short: 'Ankle' },
  knee: { key: 'knee', label: 'Knee-deep', plain: 'About knee-deep', short: 'Knee' },
  waist: { key: 'waist', label: 'Waist-deep', plain: 'About waist-deep', short: 'Waist' },
  higher: {
    key: 'higher',
    label: 'Higher than waist',
    plain: 'Higher than waist-deep',
    short: 'Higher',
  },
}

export const depthOrder: DepthKey[] = ['ankle', 'knee', 'waist', 'higher']

/* --- Status labels -------------------------------------------------------- */

export const statusLabels: Record<FloodStatus, { label: string; meaning: string }> = {
  clear: { label: 'Clear', meaning: 'Passable. No water reported.' },
  watch: { label: 'Watch', meaning: 'Water expected soon. Get ready.' },
  flooding: { label: 'Flooding', meaning: 'Water on the road right now.' },
}

/* ==========================================================================
   THE FLOOD SCENARIO
   --------------------------------------------------------------------------
   Heavy rain starts in the low-lying downtown streets and spreads outward
   along roads that actually connect to each other. Ring 0 is where it starts;
   each later ring is one street further out.

   To move the flood somewhere else, change `seedRoadIds` to other ids from
   roads.geojson. Everything else follows automatically.
   ========================================================================== */

export const floodScenario = {
  /* Low-lying streets around the downtown market area. */
  seedRoadIds: [
    'colon-street',
    'magallanes-street',
    'p-burgos-street',
    'm-c-briones-street',
    'lapu-lapu-street',
  ],
  /* How many rings out the water reaches. */
  depth: 3,
  /* The accelerated demo clock, in milliseconds from "Heavy rain" being
     pressed. A road eases to its new colour over about a second, so the whole
     thing reads as water spreading rather than roads switching. */
  timeline: [
    { at: 1200, ring: 0, risk: 0.55 },
    { at: 7000, ring: 0, risk: 1 },
    { at: 7000, ring: 1, risk: 0.55 },
    { at: 13500, ring: 1, risk: 1 },
    { at: 13500, ring: 2, risk: 0.55 },
    { at: 20000, ring: 2, risk: 1 },
    { at: 20000, ring: 3, risk: 0.45 },
    { at: 26000, ring: 3, risk: 0.62 },
  ],
  totalMs: 27000,
}

/* Risk thresholds that turn a number into one of the three named statuses. */
export const RISK_WATCH = 0.34
export const RISK_FLOODING = 0.72

export function statusFromRisk(risk: number): FloodStatus {
  if (risk >= RISK_FLOODING) return 'flooding'
  if (risk >= RISK_WATCH) return 'watch'
  return 'clear'
}

/** Expected depth, described in plain terms, for a given risk. */
export function depthFromRisk(risk: number): DepthKey | null {
  if (risk < RISK_WATCH) return null
  if (risk < 0.9) return 'knee'
  return 'waist'
}

/* --- Map framing ---------------------------------------------------------- */

/* Where the map opens. Tuned to fill a tall phone screen with the built-up
   part of Cebu City; the road data reaches further west into the hills. */
export const cityView = {
  center: [10.3125, 123.8895] as [number, number],
  zoom: 13,
}

/* --- Saved places --------------------------------------------------------- */

export interface SavedPlace {
  id: string
  label: string
  kind: 'home' | 'store' | 'route'
  roadId: string
}

/* Tess: her store sits on a street one ring out from where the water starts,
   so the warning reaches her while her road is still on Watch. */
export const savedPlaces: SavedPlace[] = [
  { id: 'store', label: 'My sari-sari store', kind: 'store', roadId: 'manalili-street' },
  { id: 'home', label: 'Home', kind: 'home', roadId: 'salinas-drive' },
]

/* Offered during onboarding so a place can be saved in one tap. */
export const placeSuggestions: {
  label: string
  kind: SavedPlace['kind']
  roadId: string
}[] = [
  { label: 'My sari-sari store', kind: 'store', roadId: 'manalili-street' },
  { label: 'Home', kind: 'home', roadId: 'salinas-drive' },
  { label: 'Route to school', kind: 'route', roadId: 'osmena-boulevard' },
]

export const placeKindLabel: Record<SavedPlace['kind'], string> = {
  home: 'Home',
  store: 'Store or work',
  route: 'Route',
}

/* --- Weather conditions --------------------------------------------------- */

export interface ConditionState {
  headline: string
  detail: string
  rainfall: string
  outlook: string
  updated: string
  intensity: number
}

export const conditions: Record<'normal' | 'heavy', ConditionState> = {
  normal: {
    headline: 'Light rain',
    detail: 'Nothing building up on the low streets.',
    rainfall: 'Light',
    outlook: 'Easing over the next hour',
    updated: 'Updated 2 min ago',
    intensity: 1,
  },
  heavy: {
    headline: 'Heavy rain',
    detail: 'Water is building on the low streets downtown.',
    rainfall: 'Heavy',
    outlook: 'Continuing for the next hour',
    updated: 'Updated 1 min ago',
    intensity: 3,
  },
}

/* --- The warning ---------------------------------------------------------- */

export const floodAlert = {
  /* Minutes of lead time the countdown starts from. */
  leadMinutes: 35,
  reportCount: 8,
  actions: [
    {
      id: 'stock',
      title: 'Move stock to higher shelves',
      detail: 'Rice, flour and sacks first.',
    },
    {
      id: 'staff',
      title: 'Send staff home early',
      detail: 'Rides stop once it is knee-deep.',
    },
    {
      id: 'delivery',
      title: 'Delay your supplier delivery',
      detail: 'Ask them to come after the water drops.',
    },
    {
      id: 'route',
      title: 'Plan another route',
      detail: 'Check the map for a road still on Clear.',
    },
  ],
}

/* --- Past alerts ---------------------------------------------------------- */

export interface PastAlert {
  id: string
  roadId: string
  title: string
  body: string
  time: string
  reportCount: number
}

export const pastAlerts: PastAlert[] = [
  {
    id: 'p1',
    roadId: 'colon-street',
    title: 'Flooding cleared',
    body: 'Water drained after about three hours.',
    time: 'Yesterday, 6:10 PM',
    reportCount: 12,
  },
  {
    id: 'p2',
    roadId: 'sanciangko-street',
    title: 'Ankle-deep water reported',
    body: 'Cleared the same afternoon.',
    time: 'Tuesday, 3:40 PM',
    reportCount: 6,
  },
  {
    id: 'p3',
    roadId: 'manalili-street',
    title: 'Knee-deep water reported',
    body: 'Warning sent 40 minutes before the water arrived.',
    time: 'Last Saturday, 2:15 PM',
    reportCount: 14,
  },
  {
    id: 'p4',
    roadId: 'osmena-boulevard',
    title: 'Water on one lane',
    body: 'Traffic slow for about an hour.',
    time: 'Last Friday, 5:05 PM',
    reportCount: 9,
  },
]

/* --- SMS preview ---------------------------------------------------------- */

/* {road} is replaced with the saved place's real road name. */
export const smsPreview = {
  sender: 'FloodWatch',
  messages: [
    {
      id: 'm1',
      time: '2:04 PM',
      text: 'FloodWatch: Heavy rain over Cebu City. Watch for water on low streets.',
    },
    {
      id: 'm2',
      time: '2:41 PM',
      text: 'FloodWatch: Flooding expected on {road} in ~35 min. Move goods up. Reply STOP to end alerts.',
    },
    {
      id: 'm3',
      time: '3:26 PM',
      text: 'FloodWatch: {road} is now knee-deep. Reply STOP to end alerts.',
    },
  ],
  footnote:
    'SMS alerts still arrive when mobile data is weak, so the warning gets through during heavy rain.',
}

/* --- Business tier -------------------------------------------------------- */

export interface BusinessLocation {
  id: string
  name: string
  roadId: string
  seasonEvents: number
  lastFlooded: string
  history: { month: string; count: number }[]
}

export const businessLocations: BusinessLocation[] = [
  {
    id: 'b1',
    name: 'Carbon Market stall',
    roadId: 'manalili-street',
    seasonEvents: 17,
    lastFlooded: 'Yesterday',
    history: [
      { month: 'Jun', count: 1 },
      { month: 'Jul', count: 2 },
      { month: 'Aug', count: 4 },
      { month: 'Sep', count: 5 },
      { month: 'Oct', count: 3 },
      { month: 'Nov', count: 2 },
    ],
  },
  {
    id: 'b2',
    name: 'Colon branch',
    roadId: 'colon-street',
    seasonEvents: 21,
    lastFlooded: 'Yesterday',
    history: [
      { month: 'Jun', count: 2 },
      { month: 'Jul', count: 3 },
      { month: 'Aug', count: 5 },
      { month: 'Sep', count: 6 },
      { month: 'Oct', count: 3 },
      { month: 'Nov', count: 2 },
    ],
  },
  {
    id: 'b3',
    name: 'Lahug branch',
    roadId: 'salinas-drive',
    seasonEvents: 3,
    lastFlooded: 'Last month',
    history: [
      { month: 'Jun', count: 0 },
      { month: 'Jul', count: 0 },
      { month: 'Aug', count: 1 },
      { month: 'Sep', count: 1 },
      { month: 'Oct', count: 1 },
      { month: 'Nov', count: 0 },
    ],
  },
]

export const businessPlan = {
  name: 'FloodWatch Business',
  /* Placeholder on purpose - pricing is not set. */
  price: 'P__',
  period: 'per month',
  blurb: 'For owners watching more than one location.',
  features: [
    'Up to 10 saved locations',
    'Alerts for every location at once',
    'Flood history for the whole season',
    'Staff numbers on the SMS list',
  ],
}

/* --- Settings options ----------------------------------------------------- */

export type ChannelId = 'sms' | 'app' | 'both'

export const alertChannels: { id: ChannelId; label: string; detail: string }[] = [
  { id: 'sms', label: 'SMS', detail: 'A plain text message to your number.' },
  { id: 'app', label: 'App notification', detail: 'A push notification on this phone.' },
  {
    id: 'both',
    label: 'Both',
    detail: 'Recommended. The warning reaches you either way.',
  },
]

export const smsNote =
  'SMS works even when mobile data is weak, so the warning still reaches you during heavy rain.'

export const leadTimes = [15, 30, 45, 60]

export type LanguageId = 'en' | 'ceb'

export const languages: { id: LanguageId; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ceb', label: 'Cebuano' },
]

/* --- Wording used wherever a warning source is shown ---------------------- */

export function sourceLine(reportCount: number) {
  const plural = reportCount === 1 ? 'report' : 'reports'
  return `Based on rainfall data + ${reportCount} verified community ${plural}`
}

/* ==========================================================================
   GENERATED STREET CONTENT
   --------------------------------------------------------------------------
   There are more roads in Cebu City than anyone wants to hand-write reports
   for, so each road gets its own stable, made-up set built from these pools.
   The same road always produces the same content.
   ========================================================================== */

const reporterNames = [
  'Ana R.',
  'Dodong M.',
  'Liza P.',
  'Boy S.',
  'Marites C.',
  'Jun T.',
  'Nene B.',
  'Ernie L.',
  'Cora M.',
  'Rico D.',
  'Mila G.',
  'Fely A.',
]

const messagesByStatus: Record<FloodStatus, string[]> = {
  clear: [
    'Road is dry. Passing normally.',
    'No water here. Using this as a detour.',
    'Raining but the road is still clear.',
    'Nothing to report. Traffic moving fine.',
  ],
  watch: [
    'Water is filling the gutter near the corner.',
    'Ankle-deep in front of the bakery. Still passable on foot.',
    'Traffic slowing down, one lane already has water.',
    'Drainage near the junction is backing up.',
  ],
  flooding: [
    'Knee-deep here. Jeeps are turning back.',
    'Water covering both lanes. Avoid this road.',
    'Deep at the low part. Tricycles cannot pass.',
    'Still rising. Do not try to cross.',
  ],
}

const agoLabels = ['3 min ago', '6 min ago', '14 min ago', '21 min ago', '28 min ago']

/** Stable hash so a road always generates the same content. */
function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export interface CommunityReport {
  id: string
  name: string
  message: string
  ago: string
  verified: boolean
}

export function reportsFor(roadId: string, status: FloodStatus): CommunityReport[] {
  const seed = hash(roadId)
  const pool = messagesByStatus[status]
  const count = status === 'clear' ? 2 : 4
  return Array.from({ length: count }, (_, i) => ({
    id: `${roadId}-${status}-${i}`,
    name: reporterNames[(seed + i * 5) % reporterNames.length],
    message: pool[(seed + i * 3) % pool.length],
    ago: agoLabels[i % agoLabels.length],
    /* The newest report on a busy street is often still awaiting confirmation. */
    verified: !(status !== 'clear' && i === count - 1),
  }))
}

/** How many verified reports back the current status. */
export function reportCountFor(roadId: string, status: FloodStatus): number {
  const seed = hash(roadId)
  if (status === 'clear') return 1 + (seed % 3)
  if (status === 'watch') return 5 + (seed % 6)
  return 8 + (seed % 8)
}

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']

export function historyFor(roadId: string): { month: string; count: number }[] {
  const seed = hash(roadId)
  /* A gentle arc that peaks in the wetter middle months. */
  const shape = [0.3, 0.55, 0.85, 1, 0.65, 0.4]
  const scale = 2 + (seed % 5)
  return MONTHS.map((month, i) => ({
    month,
    count: Math.max(0, Math.round(shape[i] * scale + ((seed >> i) % 2) - 0.4)),
  }))
}

export function trendFor(status: FloodStatus): Trend {
  return status === 'clear' ? 'steady' : 'rising'
}

export function updatedFor(roadId: string): string {
  const seed = hash(roadId)
  return `${1 + (seed % 12)} minutes ago`
}

/** One line of plain-language advice for the top of Street Detail. */
export function noteFor(roadId: string, status: FloodStatus): string {
  const name = roadName(roadId)
  if (status === 'flooding')
    return `There is water on ${name} right now. Find another route.`
  if (status === 'watch') return `Water is expected on ${name} soon. Get ready now.`
  return `${name} is dry and passable. Nothing reported today.`
}
