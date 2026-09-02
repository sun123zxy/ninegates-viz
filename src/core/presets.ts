import type { HandCounts } from './hand'

export const SUPPORTED_ORDERS = [1, 2, 3, 4] as const

export type Order = (typeof SUPPORTED_ORDERS)[number]
export type WaitKind = 'live' | 'dead'

export type HandPreset = {
  id: string
  name: string
  n: Order
  counts: HandCounts
  waitKind: WaitKind
  isStandard: boolean
}

const live = (
  id: string,
  name: string,
  n: Order,
  counts: HandCounts,
  isStandard = false,
): HandPreset => ({
  id,
  name,
  n,
  counts,
  waitKind: 'live',
  isStandard,
})

const dead = (id: string, name: string, n: Order, counts: HandCounts): HandPreset => ({
  id,
  name,
  n,
  counts,
  waitKind: 'dead',
  isStandard: false,
})

export const PRESETS: readonly HandPreset[] = [
  live('n1-standard', 'Standard — Live full-sided wait', 1, [3, 1, 3], true),
  live('n1-solution-1', 'Solution 1 — Live full-sided wait', 1, [1, 3, 3]),
  live('n1-solution-2', 'Solution 2 — Live full-sided wait', 1, [2, 2, 3]),
  live('n1-solution-3', 'Solution 3 — Live full-sided wait', 1, [2, 3, 2]),
  live('n1-solution-4', 'Solution 4 — Live full-sided wait', 1, [3, 3, 1]),
  live('n1-solution-5', 'Solution 5 — Live full-sided wait', 1, [3, 2, 2]),

  live('n2-a', 'A — Standard live full-sided wait', 2, [3, 1, 1, 1, 1, 3], true),
  dead('n2-b', 'B — Full-sided, dead wait', 2, [3, 1, 4, 1, 1, 0]),
  dead('n2-rb', 'R(B) — Full-sided, dead wait', 2, [0, 1, 1, 4, 1, 3]),
  dead('n2-c', 'C — Full-sided, dead wait', 2, [1, 1, 4, 1, 3, 0]),
  dead('n2-rc', 'R(C) — Full-sided, dead wait', 2, [0, 3, 1, 4, 1, 1]),
  dead('n2-d', 'D — Full-sided, dead wait', 2, [0, 1, 4, 2, 3, 0]),
  dead('n2-rd', 'R(D) — Full-sided, dead wait', 2, [0, 3, 2, 4, 1, 0]),
  dead('n2-e', 'E — Full-sided, dead wait', 2, [0, 1, 4, 4, 1, 0]),

  live('n3-a', 'A — Standard live full-sided wait', 3, [3, 1, 1, 1, 1, 1, 1, 1, 3], true),
  dead('n3-b', 'B — Full-sided, dead wait', 3, [3, 1, 1, 1, 1, 4, 1, 1, 0]),
  dead('n3-rb', 'R(B) — Full-sided, dead wait', 3, [0, 1, 1, 4, 1, 1, 1, 1, 3]),
  dead('n3-c', 'C — Full-sided, dead wait', 3, [1, 1, 4, 1, 1, 1, 1, 3, 0]),
  dead('n3-rc', 'R(C) — Full-sided, dead wait', 3, [0, 3, 1, 1, 1, 1, 4, 1, 1]),
  dead('n3-d', 'D — Full-sided, dead wait', 3, [0, 1, 4, 2, 1, 1, 1, 3, 0]),
  dead('n3-rd', 'R(D) — Full-sided, dead wait', 3, [0, 3, 1, 1, 1, 2, 4, 1, 0]),
  dead('n3-e', 'E — Full-sided, dead wait', 3, [0, 1, 1, 4, 1, 4, 1, 1, 0]),

  live('n4-a', 'A — Standard live full-sided wait', 4,
    [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3], true),
  dead('n4-b', 'B — Full-sided, dead wait', 4,
    [3, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 0]),
  dead('n4-rb', 'R(B) — Full-sided, dead wait', 4,
    [0, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 3]),
  dead('n4-c', 'C — Full-sided, dead wait', 4,
    [1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 3, 0]),
  dead('n4-rc', 'R(C) — Full-sided, dead wait', 4,
    [0, 3, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1]),
  dead('n4-d', 'D — Full-sided, dead wait', 4,
    [0, 1, 4, 2, 1, 1, 1, 1, 1, 1, 3, 0]),
  dead('n4-rd', 'R(D) — Full-sided, dead wait', 4,
    [0, 3, 1, 1, 1, 1, 1, 1, 2, 4, 1, 0]),
  dead('n4-e', 'E — Full-sided, dead wait', 4,
    [0, 1, 1, 4, 1, 1, 1, 1, 4, 1, 1, 0]),
]

export function presetsForOrder(n: Order): readonly HandPreset[] {
  return PRESETS.filter((preset) => preset.n === n)
}

export function standardPreset(n: Order): HandPreset {
  const preset = presetsForOrder(n).find((item) => item.isStandard)
  if (!preset) throw new Error(`missing standard preset for n = ${n}`)
  return preset
}
