import { HandInfo } from '../components/HandInfo'
import { DrawPairGraphPanel } from '../components/DrawPairGraphPanel'
import { calculateDrawPairGraph, type DrawPairGraph } from './drawPairGraph'
import { decompositionGroups, drawPairOverlay, waitingTargets } from './handOverlay'
import type { HandAnalysis } from './waitingTiles'
import { handAnalysisPlugin } from './waitingTiles'
import type { HandOverlay, InfoPlugin, InfoPluginResult } from './types'

function handAnalysisOverlay(analysis: HandAnalysis): HandOverlay | undefined {
  if (analysis.kind === 'meldable' || analysis.kind === 'winning') {
    const groups = decompositionGroups(analysis.decomposition)
    return groups.length > 0 ? { groups } : undefined
  }

  return analysis.kind === 'waiting'
    ? {
        targets: waitingTargets(analysis.waitingTiles),
        groups: [],
      }
    : undefined
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

const drawPairGraphInfoPlugin: InfoPlugin = {
  id: 'draw-pair-graph',
  label: 'Draw-pair graph',
  calculate: (counts) => {
    const graph = calculateDrawPairGraph(counts)
    return { data: graph, overlay: drawPairOverlay(graph) }
  },
  render: (data, counts, { onPreviewOverlayChange }) => (
    <DrawPairGraphPanel
      key={counts.join(',')}
      graph={data as DrawPairGraph}
      onPreviewOverlayChange={onPreviewOverlayChange}
    />
  ),
}

const controlsInfoPlugin: InfoPlugin = {
  id: 'controls',
  label: 'Controls',
  calculate: () => ({ data: null }),
  render: () => (
    <ul className="controls-list">
      <li>Click or drag a stack to set its height</li>
      <li>← → switch stacks</li>
      <li>↑ ↓ / Home / End edit a focused stack</li>
      <li>Ctrl+Z undo; Ctrl+Y or Ctrl+Shift+Z redo</li>
    </ul>
  ),
}

export const INFO_PLUGINS: readonly InfoPlugin[] = [
  handAnalysisInfoPlugin,
  drawPairGraphInfoPlugin,
  controlsInfoPlugin,
]
