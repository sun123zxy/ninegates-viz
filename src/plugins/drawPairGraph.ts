import type { HandCounts } from '../core/hand'
import { meldDecomposition, type HandDecomposition } from './waitingTiles'

export type DrawPairEdge = {
  from: number
  to: number
  decomposition: HandDecomposition
}

export type DrawPairResidueGroup = {
  role: 'bottom' | 'left' | 'right'
  offset: 0 | 1 | 2
  residue: number
  ranks: readonly number[]
}

export type DrawPairGraph = {
  weightedSum: number
  sumResidue: number
  groups: readonly DrawPairResidueGroup[]
  edges: readonly DrawPairEdge[]
  waitingTiles: readonly number[]
}

function mod3(value: number): number {
  return ((value % 3) + 3) % 3
}

function ranksInResidueClass(rankCount: number, residue: number): number[] {
  return Array.from({ length: rankCount }, (_, index) => index + 1)
    .filter((rank) => mod3(rank) === residue)
}

export function calculateDrawPairGraph(counts: HandCounts): DrawPairGraph {
  const weightedSum = counts.reduce(
    (sum, count, index) => sum + (index + 1) * count,
    0,
  )
  const sumResidue = mod3(weightedSum)
  const groupSpecs = [
    { role: 'bottom', offset: 0 },
    { role: 'left', offset: 1 },
    { role: 'right', offset: 2 },
  ] as const
  const groups = groupSpecs.map(({ role, offset }) => {
    const residue = mod3(sumResidue + offset)
    return {
      role,
      offset,
      residue,
      ranks: ranksInResidueClass(counts.length, residue),
    }
  })

  const edges: DrawPairEdge[] = []
  for (let from = 1; from <= counts.length; from += 1) {
    for (let to = 1; to <= counts.length; to += 1) {
      const remainder = [...counts]
      remainder[from - 1] += 1
      remainder[to - 1] -= 2
      if (remainder[to - 1] < 0) continue
      const decomposition = meldDecomposition(remainder)
      if (decomposition) {
        edges.push({
          from,
          to,
          decomposition: { ...decomposition, pair: to },
        })
      }
    }
  }

  const waitingTiles = [...new Set(edges.map((edge) => edge.from))]
  return { weightedSum, sumResidue, groups, edges, waitingTiles }
}
