/* ==========================================================================
   The spreading-water simulation.

   Every road carries a risk from 0 (clear) to 1 (flooding). Heavy rain sets
   target risks for successive rings of connected roads over an accelerated
   clock; each road then eases toward its target so the map reads as water
   finding its way outward rather than roads flicking between three colours.
   ========================================================================== */

import { floodRings, roads } from '../data/roads'
import { floodScenario, statusFromRisk, type FloodStatus } from '../data/sample'

export type RiskMap = Record<string, number>

/** Everything clear. */
export function emptyRisk(): RiskMap {
  const map: RiskMap = {}
  for (const road of roads) map[road.properties.id] = 0
  return map
}

/** The rings the flood spreads through, computed once from the road graph. */
export const rings: string[][] = floodRings(
  floodScenario.seedRoadIds,
  floodScenario.depth,
)

/** Target risk for every road at a given point on the demo clock. */
export function targetsAt(elapsedMs: number): RiskMap {
  const targets = emptyRisk()
  for (const step of floodScenario.timeline) {
    if (elapsedMs < step.at) continue
    for (const id of rings[step.ring] ?? []) targets[id] = step.risk
  }
  return targets
}

/**
 * Moves current risks one tick toward their targets.
 * `rate` is how much risk can change in this tick.
 * Returns a new map, or the same object when nothing moved.
 */
export function ease(current: RiskMap, targets: RiskMap, rate: number): RiskMap {
  let changed = false
  const next: RiskMap = {}
  for (const id in current) {
    const from = current[id]
    const to = targets[id] ?? 0
    if (from === to) {
      next[id] = from
      continue
    }
    const delta = to - from
    const step = Math.sign(delta) * Math.min(Math.abs(delta), rate)
    const value = Math.abs(delta) <= rate ? to : from + step
    next[id] = value
    changed = true
  }
  return changed ? next : current
}

/** Counts of roads in each status, for the home screen summary. */
export function statusCounts(risk: RiskMap): Record<FloodStatus, number> {
  const counts: Record<FloodStatus, number> = { clear: 0, watch: 0, flooding: 0 }
  for (const id in risk) counts[statusFromRisk(risk[id])]++
  return counts
}

/** Roads that are not clear, worst first. Used by the alerts list and map sheet. */
export function affectedRoads(risk: RiskMap): { id: string; risk: number }[] {
  return Object.entries(risk)
    .filter(([, value]) => statusFromRisk(value) !== 'clear')
    .map(([id, value]) => ({ id, risk: value }))
    .sort((a, b) => b.risk - a.risk)
}
