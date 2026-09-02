import { totalTiles, type HandCounts } from '../core/hand'

const STATE_COUNT = 18
const INITIAL_STATE = encodeState(0, 0, false)
const FINAL_STATE = encodeState(0, 0, true)

function encodeState(a: number, b: number, pairUsed: boolean): number {
  return (a * 3 + b) * 2 + Number(pairUsed)
}

function decodeState(state: number) {
  const pairUsed = state % 2 === 1
  const withoutPair = Math.floor(state / 2)
  return { a: Math.floor(withoutPair / 3), b: withoutPair % 3, pairUsed }
}

function addState(states: number, state: number): number {
  return states | (1 << state)
}

function hasState(states: number, state: number): boolean {
  return (states & (1 << state)) !== 0
}

function step(count: number, state: number): number {
  const { a, b, pairUsed } = decodeState(state)
  let nextStates = 0

  for (const usePair of [false, true]) {
    if (pairUsed && usePair) continue
    const required = a + b + (usePair ? 2 : 0)
    if (required > count) continue
    nextStates = addState(
      nextStates,
      encodeState((count - required) % 3, a, pairUsed || usePair),
    )
  }

  return nextStates
}

function stepSet(count: number, states: number): number {
  let nextStates = 0
  for (let state = 0; state < STATE_COUNT; state += 1) {
    if (hasState(states, state)) nextStates |= step(count, state)
  }
  return nextStates
}

function buildPrefix(counts: HandCounts): number[] {
  const prefix = [addState(0, INITIAL_STATE)]
  for (const count of counts) {
    prefix.push(stepSet(count, prefix[prefix.length - 1]))
  }
  return prefix
}

function buildSuffix(counts: HandCounts): number[] {
  const suffix = Array.from({ length: counts.length + 1 }, () => 0)
  suffix[counts.length] = addState(0, FINAL_STATE)

  for (let index = counts.length - 1; index >= 0; index -= 1) {
    let states = 0
    for (let state = 0; state < STATE_COUNT; state += 1) {
      if ((step(counts[index], state) & suffix[index + 1]) !== 0) {
        states = addState(states, state)
      }
    }
    suffix[index] = states
  }

  return suffix
}

/**
 * Returns one-indexed ranks that become winning after one tile is added.
 * `null` means the hand has the wrong size to be a wait.
 *
 * This is a TypeScript port of `WaitingTiles.Decidable.decideCount` in Lean.
 */
export function waitingTiles(counts: HandCounts): number[] | null {
  if (totalTiles(counts) !== counts.length + 4) return null

  const prefix = buildPrefix(counts)
  const suffix = buildSuffix(counts)
  const waits: number[] = []

  for (let index = 0; index < counts.length; index += 1) {
    const nextStates = stepSet(counts[index] + 1, prefix[index])
    if ((nextStates & suffix[index + 1]) !== 0) waits.push(index + 1)
  }

  return waits
}

export const waitingTilesPlugin = {
  id: 'waiting-tiles',
  label: 'Waiting tiles',
  calculate: waitingTiles,
} as const
