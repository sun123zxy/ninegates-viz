import type { HandCounts } from './hand'

export type HandPreset = {
  id: string
  name: string
  n: number
  counts: HandCounts
}

export const PRESETS: readonly HandPreset[] = [
  {
    id: 'n3-a',
    name: 'A — Standard live full-sided wait',
    n: 3,
    counts: [3, 1, 1, 1, 1, 1, 1, 1, 3],
  },
  {
    id: 'n3-b',
    name: 'B',
    n: 3,
    counts: [3, 1, 1, 1, 1, 4, 1, 1, 0],
  },
  {
    id: 'n3-rb',
    name: 'R(B)',
    n: 3,
    counts: [0, 1, 1, 4, 1, 1, 1, 1, 3],
  },
  {
    id: 'n3-c',
    name: 'C',
    n: 3,
    counts: [1, 1, 4, 1, 1, 1, 1, 3, 0],
  },
  {
    id: 'n3-rc',
    name: 'R(C)',
    n: 3,
    counts: [0, 3, 1, 1, 1, 1, 4, 1, 1],
  },
  {
    id: 'n3-d',
    name: 'D',
    n: 3,
    counts: [0, 1, 4, 2, 1, 1, 1, 3, 0],
  },
  {
    id: 'n3-rd',
    name: 'R(D)',
    n: 3,
    counts: [0, 3, 1, 1, 1, 2, 4, 1, 0],
  },
  {
    id: 'n3-e',
    name: 'E',
    n: 3,
    counts: [0, 1, 1, 4, 1, 4, 1, 1, 0],
  },
]

export const DEFAULT_PRESET = PRESETS[0]
