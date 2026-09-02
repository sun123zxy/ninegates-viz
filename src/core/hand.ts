export type HandCounts = readonly number[]

export const MAX_EDITABLE_TILE_COUNT = 6
export const STANDARD_TILE_LIMIT = 4

function assertRank(counts: HandCounts, rank: number) {
  if (!Number.isInteger(rank) || rank < 1 || rank > counts.length) {
    throw new RangeError(`rank must be an integer between 1 and ${counts.length}`)
  }
}

export function setTileCount(counts: HandCounts, rank: number, count: number): number[] {
  assertRank(counts, rank)
  if (!Number.isInteger(count) || count < 0 || count > MAX_EDITABLE_TILE_COUNT) {
    throw new RangeError(`count must be an integer between 0 and ${MAX_EDITABLE_TILE_COUNT}`)
  }
  const next = [...counts]
  next[rank - 1] = count
  return next
}

export function totalTiles(counts: HandCounts): number {
  return counts.reduce((total, count) => total + count, 0)
}

export function expandHand(counts: HandCounts): number[] {
  return counts.flatMap((count, index) => Array.from({ length: count }, () => index + 1))
}

export function formatVector(counts: HandCounts): string {
  return `(${counts.join(', ')})`
}

export function formatMultiset(counts: HandCounts): string {
  return `{${expandHand(counts).join(', ')}}`
}
