import { totalTiles, type HandCounts } from '../core/hand'

export type HandDecomposition = {
  /** One entry per sequence, represented by its one-indexed starting rank. */
  sequences: readonly number[]
  /** One entry per triplet, represented by its one-indexed rank. */
  triplets: readonly number[]
  /** The one-indexed rank of the pair, when this is a winning decomposition. */
  pair?: number
}

export type HandAnalysis =
  | { kind: 'meldable'; decomposition: HandDecomposition }
  | { kind: 'not-meldable' }
  | { kind: 'waiting'; waitingTiles: readonly number[]; meldCount: number; isStandard: boolean }
  | { kind: 'winning'; decomposition: HandDecomposition; meldCount: number; isStandard: boolean }
  | { kind: 'not-winning' }

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
 * `null` means the hand has a tile count incompatible with a wait.
 *
 * This is a TypeScript port of `WaitingTiles.Decidable.decideCount` in Lean.
 */
export function waitingTiles(counts: HandCounts): number[] | null {
  if (totalTiles(counts) % 3 !== 1) return null

  const prefix = buildPrefix(counts)
  const suffix = buildSuffix(counts)
  const waits: number[] = []

  for (let index = 0; index < counts.length; index += 1) {
    const nextStates = stepSet(counts[index] + 1, prefix[index])
    if ((nextStates & suffix[index + 1]) !== 0) waits.push(index + 1)
  }

  return waits
}

/**
 * Returns Lean's canonical left-to-right meld placement, if one exists.
 *
 * At each rank, pending sequences consume `a + b` tiles. The residual is
 * maximally split into triplets, with its remainder starting new sequences.
 * This mirrors `Meldable.Decidable.scanHand` in Lean.
 */
export function meldDecomposition(counts: HandCounts): HandDecomposition | null {
  let a = 0
  let b = 0
  const sequences: number[] = []
  const triplets: number[] = []

  for (let index = 0; index < counts.length; index += 1) {
    const count = counts[index]
    if (!Number.isInteger(count) || count < a + b) return null

    const residual = count - a - b
    const rank = index + 1
    for (let triplet = 0; triplet < Math.floor(residual / 3); triplet += 1) {
      triplets.push(rank)
    }
    for (let sequence = 0; sequence < residual % 3; sequence += 1) {
      sequences.push(rank)
    }

    b = a
    a = residual % 3
  }

  if (a !== 0 || b !== 0) return null
  return { sequences, triplets }
}

/**
 * Returns a deterministic pair-and-meld decomposition.
 *
 * The smallest rank that can serve as the pair is selected; after removing
 * it, the remaining hand uses the canonical meld scan above. This keeps the
 * display stable when a hand has several valid decompositions.
 */
export function winningDecomposition(counts: HandCounts): HandDecomposition | null {
  for (let index = 0; index < counts.length; index += 1) {
    if (counts[index] < 2) continue
    const withoutPair = [...counts]
    withoutPair[index] -= 2
    const decomposition = meldDecomposition(withoutPair)
    if (decomposition) return { ...decomposition, pair: index + 1 }
  }

  return null
}

/**
 * Selects the applicable mathematical analysis from the hand's tile count.
 *
 * Every hand with a tile count congruent to one modulo three is checked for
 * waiting tiles; those congruent to two modulo three are checked for a pair-
 * and-meld decomposition; multiples of three are checked for meldability.
 */
export function analyzeHand(counts: HandCounts): HandAnalysis {
  const total = totalTiles(counts)
  const standardMeldCount = counts.length / 3 + 1

  if (total % 3 === 1) {
    const meldCount = (total - 1) / 3
    return {
      kind: 'waiting',
      waitingTiles: waitingTiles(counts) ?? [],
      meldCount,
      isStandard: meldCount === standardMeldCount,
    }
  }

  if (total % 3 === 2) {
    const decomposition = winningDecomposition(counts)
    if (!decomposition) return { kind: 'not-winning' }
    const meldCount = decomposition.sequences.length + decomposition.triplets.length
    return {
      kind: 'winning',
      decomposition,
      meldCount,
      isStandard: meldCount === standardMeldCount,
    }
  }

  const decomposition = meldDecomposition(counts)
  return decomposition ? { kind: 'meldable', decomposition } : { kind: 'not-meldable' }
}

export const handAnalysisPlugin = {
  id: 'hand-analysis',
  label: 'Hand analysis',
  calculate: analyzeHand,
} as const
