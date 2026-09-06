import { HandInfo } from '../components/HandInfo'
import type { HandAnalysis } from './waitingTiles'
import { handAnalysisPlugin } from './waitingTiles'
import type { HandOverlay, InfoPlugin, InfoPluginResult, RankGroup } from './types'

function handAnalysisOverlay(analysis: HandAnalysis): HandOverlay | undefined {
  const groups: RankGroup[] = []
  if (analysis.kind === 'meldable' || analysis.kind === 'winning') {
    groups.push(
      ...analysis.decomposition.sequences.map((start) => ({
        kind: 'seq',
        ranks: [start, start + 1, start + 2],
      })),
      ...analysis.decomposition.triplets.map((rank) => ({
        kind: 'trip',
        ranks: [rank, rank, rank],
      })),
    )
    if (analysis.decomposition.pair !== undefined) {
      groups.push({ kind: 'pair', ranks: [analysis.decomposition.pair, analysis.decomposition.pair] })
    }
  }

  const highlights = analysis.kind === 'waiting' ? analysis.waitingTiles : undefined
  if (highlights) return { highlights, groups }
  return groups.length > 0 ? { groups } : undefined
}

const handAnalysisInfoPlugin: InfoPlugin = {
  id: handAnalysisPlugin.id,
  label: handAnalysisPlugin.label,
  calculate: (counts): InfoPluginResult => {
    const data = handAnalysisPlugin.calculate(counts)
    return { data, overlay: handAnalysisOverlay(data) }
  },
  render: (data, counts) => (
    <HandInfo counts={counts} analysis={data as HandAnalysis} />
  ),
}

export const INFO_PLUGINS: readonly InfoPlugin[] = [handAnalysisInfoPlugin]
