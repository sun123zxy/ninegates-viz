import type { HandCounts } from './hand'
import { MINIMAL_WAIT_DATA } from './minimalWaitData'

export const SUPPORTED_ORDERS = [1, 2, 3, 4] as const

export type Order = (typeof SUPPORTED_ORDERS)[number]
export type PresetMarker = 'B' | 'G'

export type HandPreset = {
  id: string
  n: Order
  m: number
  counts: HandCounts
  marker?: PresetMarker
  isStandard: boolean
}

function vectorId(n: Order, m: number, counts: HandCounts): string {
  return `n${n}-m${m}-${counts.join('-')}`
}

function markerFor(goodPairCount: number, biGoodPairCount: number): PresetMarker | undefined {
  if (biGoodPairCount > 0) return 'B'
  if (goodPairCount > 0) return 'G'
  return undefined
}

function isStandardVector(counts: HandCounts): boolean {
  return counts.every((count, index) =>
    count === (index === 0 || index === counts.length - 1 ? 3 : 1))
}

const ORDER_ONE_PRESETS: readonly HandPreset[] = [
  [3, 1, 3],
  [1, 3, 3],
  [2, 2, 3],
  [2, 3, 2],
  [3, 3, 1],
  [3, 2, 2],
].map((counts) => ({
  id: vectorId(1, 2, counts),
  n: 1,
  m: 2,
  counts,
  isStandard: isStandardVector(counts),
}))

const ORDER_FOUR_PRESETS: readonly HandPreset[] = [
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
  [3, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 0],
  [0, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 3],
  [1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 3, 0],
  [0, 3, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1],
  [0, 1, 4, 2, 1, 1, 1, 1, 1, 1, 3, 0],
  [0, 3, 1, 1, 1, 1, 1, 1, 2, 4, 1, 0],
  [0, 1, 1, 4, 1, 1, 1, 1, 4, 1, 1, 0],
].map((counts) => ({
  id: vectorId(4, 5, counts),
  n: 4,
  m: 5,
  counts,
  marker: 'B',
  isStandard: isStandardVector(counts),
}))

const IMPORTED_PRESETS: readonly HandPreset[] = MINIMAL_WAIT_DATA
  .filter((record) => record.n === 2 ||
    (record.n === 3 && (record.m === 4 || record.m === 5 ||
      (record.m >= 6 && record.goodPairCount === 0))))
  .map((record) => ({
    id: vectorId(record.n, record.m, record.counts),
    n: record.n,
    m: record.m,
    counts: record.counts,
    marker: markerFor(record.goodPairCount, record.biGoodPairCount),
    isStandard: isStandardVector(record.counts),
  }))

/** The presets intentionally shown in the UI. The imported source remains exhaustive. */
export const PRESETS: readonly HandPreset[] = [
  ...ORDER_ONE_PRESETS,
  ...IMPORTED_PRESETS,
  ...ORDER_FOUR_PRESETS,
]

export function presetsForOrder(n: Order): readonly HandPreset[] {
  return PRESETS.filter((preset) => preset.n === n)
}

export function standardPreset(n: Order): HandPreset {
  const preset = presetsForOrder(n).find((item) => item.isStandard)
  if (!preset) throw new Error(`missing standard preset for n = ${n}`)
  return preset
}
