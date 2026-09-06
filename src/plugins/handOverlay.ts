import type { DrawPairEdge, DrawPairGraph } from './drawPairGraph'
import type { HandDecomposition } from './waitingTiles'
import type { HandOverlay, HandTarget, RankGroup } from './types'

export function waitingTargets(
  ranks: readonly number[],
  drawRank?: number,
): HandTarget[] {
  return ranks.map((rank) => ({
    rank,
    kind: rank === drawRank ? 'draw' : 'waiting',
  }))
}

export function decompositionGroups(decomposition: HandDecomposition): RankGroup[] {
  const groups: RankGroup[] = [
    ...decomposition.sequences.map<RankGroup>((start) => ({
      kind: 'seq',
      ranks: [start, start + 1, start + 2],
    })),
    ...decomposition.triplets.map<RankGroup>((rank) => ({
      kind: 'trip',
      ranks: [rank, rank, rank],
    })),
  ]
  if (decomposition.pair !== undefined) {
    groups.push({ kind: 'pair', ranks: [decomposition.pair, decomposition.pair] })
  }
  return groups
}

export function drawPairOverlay(
  graph: DrawPairGraph,
  activeEdge?: DrawPairEdge,
): HandOverlay {
  const drawRank = activeEdge?.from
  return {
    targets: waitingTargets(graph.waitingTiles, drawRank),
    groups: activeEdge ? decompositionGroups(activeEdge.decomposition) : [],
  }
}
