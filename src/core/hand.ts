export type HandCounts = readonly number[]

export const DEFAULT_RANK_COUNT = 9

function assertRank(counts: HandCounts, rank: number) {
  if (!Number.isInteger(rank) || rank < 1 || rank > counts.length) {
    throw new RangeError(`rank must be an integer between 1 and ${counts.length}`)
  }
}

export function addTile(counts: HandCounts, rank: number): number[] {
  assertRank(counts, rank)
  const next = [...counts]
  next[rank - 1] += 1
  return next
}

export function removeTile(counts: HandCounts, rank: number): number[] {
  assertRank(counts, rank)
  const next = [...counts]
  next[rank - 1] = Math.max(0, next[rank - 1] - 1)
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

export function emptyHand(rankCount = DEFAULT_RANK_COUNT): number[] {
  return Array.from({ length: rankCount }, () => 0)
}
