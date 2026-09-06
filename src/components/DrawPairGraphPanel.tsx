import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import type { DrawPairEdge, DrawPairGraph } from '../plugins/drawPairGraph'
import { drawPairOverlay } from '../plugins/handOverlay'
import type { HandOverlay } from '../plugins/types'

type DrawPairGraphPanelProps = {
  graph: DrawPairGraph
  onPreviewOverlayChange: (overlay: HandOverlay | undefined) => void
}

type Point = { x: number; y: number }

type EdgeGeometry = {
  path: string
  arrowCenter: Point
  arrowAngle: number
}

const GRAPH_WIDTH = 320
const GRAPH_HEIGHT = 350
const NODE_RADIUS = 13
const LEFT_X = 68
const RIGHT_X = 252
const BOTTOM_Y = 264

function edgeKey(edge: Pick<DrawPairEdge, 'from' | 'to'>): string {
  return `${edge.from}-${edge.to}`
}

function spread(count: number, start: number, end: number): number[] {
  if (count <= 1) return [(start + end) / 2]
  return Array.from({ length: count }, (_, index) => (
    start + (end - start) * index / (count - 1)
  ))
}

function nodePositions(graph: DrawPairGraph): Map<number, Point> {
  const positions = new Map<number, Point>()
  for (const group of graph.groups) {
    if (group.role === 'bottom') {
      const xs = spread(group.ranks.length, 48, 272)
      group.ranks.forEach((rank, index) => positions.set(rank, { x: xs[index], y: BOTTOM_Y }))
    } else {
      const ys = spread(group.ranks.length, 60, 184)
      const x = group.role === 'left' ? LEFT_X : RIGHT_X
      group.ranks.forEach((rank, index) => positions.set(rank, { x, y: ys[index] }))
    }
  }
  return positions
}

function clippedEndpoints(from: Point, to: Point, normalOffset = 0): [Point, Point] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy) || 1
  const ux = dx / distance
  const uy = dy / distance
  const nx = -uy
  const ny = ux
  const tangentOffset = Math.sqrt(Math.max(0, NODE_RADIUS ** 2 - normalOffset ** 2))
  return [
    {
      x: from.x + ux * tangentOffset + nx * normalOffset,
      y: from.y + uy * tangentOffset + ny * normalOffset,
    },
    {
      x: to.x - ux * tangentOffset + nx * normalOffset,
      y: to.y - uy * tangentOffset + ny * normalOffset,
    },
  ]
}

function angleBetween(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI
}

function straightGeometry(start: Point, end: Point): EdgeGeometry {
  return {
    path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
    arrowCenter: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    },
    arrowAngle: angleBetween(start, end),
  }
}

function adjacencyRows(graph: DrawPairGraph) {
  const rankCount = graph.groups.reduce((count, group) => count + group.ranks.length, 0)
  const targets = Array.from({ length: rankCount }, () => [] as number[])
  for (const edge of graph.edges) targets[edge.from - 1].push(edge.to)
  return targets.map((to, index) => ({ from: index + 1, to }))
}

function edgeGeometry(
  edge: DrawPairEdge,
  positions: Map<number, Point>,
  bottomRanks: ReadonlySet<number>,
  hasReverse: boolean,
): EdgeGeometry | undefined {
  const from = positions.get(edge.from)
  const to = positions.get(edge.to)
  if (!from || !to) return undefined

  if (edge.from === edge.to) {
    const x = from.x
    const y = from.y
    const start = { x: x - 7, y: y + 10 }
    const control1 = { x: x - 31, y: y + 49 }
    const control2 = { x: x + 31, y: y + 49 }
    const end = { x: x + 7, y: y + 10 }
    const arrowCenter = {
      x: (start.x + 3 * control1.x + 3 * control2.x + end.x) / 8,
      y: (start.y + 3 * control1.y + 3 * control2.y + end.y) / 8,
    }
    const tangent = {
      x: -start.x - control1.x + control2.x + end.x,
      y: -start.y - control1.y + control2.y + end.y,
    }
    return {
      path: `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`,
      arrowCenter,
      arrowAngle: angleBetween({ x: 0, y: 0 }, tangent),
    }
  }

  if (hasReverse) {
    const [start, end] = clippedEndpoints(from, to, 3.5)
    return straightGeometry(start, end)
  }

  const [start, end] = clippedEndpoints(from, to)
  if (bottomRanks.has(edge.from) && bottomRanks.has(edge.to)) {
    const depth = 24 + Math.abs(end.x - start.x) * 0.2 + (edge.from > edge.to ? 13 : 0)
    const control = { x: (start.x + end.x) / 2, y: BOTTOM_Y + depth }
    return {
      path: `M ${start.x} ${start.y} Q ${control.x} ${control.y}, ${end.x} ${end.y}`,
      arrowCenter: {
        x: (start.x + 2 * control.x + end.x) / 4,
        y: (start.y + 2 * control.y + end.y) / 4,
      },
      arrowAngle: angleBetween(start, end),
    }
  }

  return straightGeometry(start, end)
}

function repeatedRank(rank: number, copies: number): string {
  return rank < 10
    ? String(rank).repeat(copies)
    : Array.from({ length: copies }, () => rank).join('-')
}

function sequenceRanks(rank: number): string {
  return rank + 2 < 10
    ? `${rank}${rank + 1}${rank + 2}`
    : `${rank}-${rank + 1}-${rank + 2}`
}

function formatDecomposition(edge: DrawPairEdge): string {
  const { decomposition } = edge
  const sequences = decomposition.sequences.map(sequenceRanks).join(', ') || '∅'
  const triplets = decomposition.triplets
    .map((rank) => repeatedRank(rank, 3))
    .join(', ') || '∅'
  const pair = decomposition.pair === undefined
    ? '∅'
    : repeatedRank(decomposition.pair, 2)
  return `${sequences}; ${triplets}; ${pair}`
}

export function DrawPairGraphPanel({
  graph,
  onPreviewOverlayChange,
}: DrawPairGraphPanelProps) {
  const [pinnedKey, setPinnedKey] = useState<string | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  const positions = useMemo(() => nodePositions(graph), [graph])
  const edgeByKey = useMemo(
    () => new Map(graph.edges.map((edge) => [edgeKey(edge), edge])),
    [graph.edges],
  )
  const bottomGroup = graph.groups.find((group) => group.role === 'bottom')
  const bottomRanks = useMemo(
    () => new Set(bottomGroup?.ranks ?? []),
    [bottomGroup],
  )
  const waitingTiles = useMemo(
    () => new Set(graph.waitingTiles),
    [graph.waitingTiles],
  )
  const adjacency = useMemo(() => adjacencyRows(graph), [graph])
  const effectiveKey = hoveredKey ?? focusedKey ?? pinnedKey
  const effectiveEdge = effectiveKey ? edgeByKey.get(effectiveKey) : undefined

  useEffect(() => {
    onPreviewOverlayChange(effectiveEdge
      ? drawPairOverlay(graph, effectiveEdge)
      : undefined)
  }, [effectiveEdge, graph, onPreviewOverlayChange])

  useEffect(() => () => onPreviewOverlayChange(undefined), [onPreviewOverlayChange])

  const togglePinned = (edge: DrawPairEdge) => {
    const key = edgeKey(edge)
    setPinnedKey((current) => current === key ? null : key)
  }

  const handleEdgeKeyDown = (event: KeyboardEvent<SVGPathElement>, edge: DrawPairEdge) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    togglePinned(edge)
  }

  return (
    <div className="draw-pair-panel">
      <svg
        className="draw-pair-graph"
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        role="group"
        aria-labelledby="draw-pair-graph-title draw-pair-graph-description"
      >
        <title id="draw-pair-graph-title">Draw-pair graph</title>
        <desc id="draw-pair-graph-description">
          Directed edges connect a drawn rank to a rank that can be used as the pair.
        </desc>
        <rect
          className="draw-pair-background"
          width={GRAPH_WIDTH}
          height={GRAPH_HEIGHT}
          onClick={() => {
            setPinnedKey(null)
            setHoveredKey(null)
            setFocusedKey(null)
          }}
        />

        {graph.edges.map((edge) => {
          const key = edgeKey(edge)
          const isActive = effectiveKey === key
          const hasReverse = edge.from !== edge.to && edgeByKey.has(`${edge.to}-${edge.from}`)
          const geometry = edgeGeometry(edge, positions, bottomRanks, hasReverse)
          if (!geometry) return null
          const stateClass = isActive ? ' draw-pair-edge-active' : ''
          return (
            <g key={key}>
              <path
                className={`draw-pair-edge${stateClass}`}
                d={geometry.path}
              />
              <path
                className={`draw-pair-arrow${stateClass}`}
                d="M 5 0 L -2.5 -3.25 L -2.5 3.25 Z"
                transform={`translate(${geometry.arrowCenter.x} ${geometry.arrowCenter.y}) rotate(${geometry.arrowAngle})`}
              />
              <path
                className="draw-pair-edge-hit"
                d={geometry.path}
                role="button"
                tabIndex={0}
                aria-label={`Draw ${edge.from}, use ${edge.to} as the pair`}
                onPointerDown={(event) => event.preventDefault()}
                onPointerEnter={() => setHoveredKey(key)}
                onPointerLeave={() => setHoveredKey((current) => current === key ? null : current)}
                onFocus={() => setFocusedKey(key)}
                onBlur={() => setFocusedKey((current) => current === key ? null : current)}
                onClick={(event) => {
                  event.stopPropagation()
                  togglePinned(edge)
                }}
                onKeyDown={(event) => handleEdgeKeyDown(event, edge)}
              />
            </g>
          )
        })}

        {graph.groups.map((group) => {
          const label = group.offset === 0 ? 's' : `s+${group.offset}`
          const labelPosition = group.role === 'bottom'
            ? { x: GRAPH_WIDTH / 2, y: 233 }
            : { x: group.role === 'left' ? LEFT_X : RIGHT_X, y: 27 }
          return (
            <g key={group.role}>
              <text className="draw-pair-group-label" x={labelPosition.x} y={labelPosition.y}>
                [{label}] ≡ {group.residue}
              </text>
              {group.ranks.map((rank) => {
                const point = positions.get(rank)
                if (!point) return null
                const isWaiting = waitingTiles.has(rank)
                const isDraw = effectiveEdge?.from === rank
                const isPair = effectiveEdge?.to === rank
                const nodeClasses = [
                  'draw-pair-node',
                  isWaiting && 'draw-pair-node-waiting',
                  isDraw && 'draw-pair-node-draw',
                  isPair && 'draw-pair-node-pair',
                ].filter(Boolean).join(' ')
                return (
                  <g
                    className={nodeClasses}
                    key={rank}
                    transform={`translate(${point.x} ${point.y})`}
                  >
                    <circle r={NODE_RADIUS} />
                    <text>{rank}</text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>

      <dl className="draw-pair-summary">
        <div><dt>s</dt><dd>{graph.weightedSum}</dd></div>
        <div><dt>s mod 3</dt><dd>{graph.sumResidue}</dd></div>
        <div><dt>Edges</dt><dd>{graph.edges.length}</dd></div>
      </dl>

      <div className="draw-pair-adjacency" aria-label="Adjacency list">
        {adjacency.map(({ from, to }) => (
          <div key={from}><span>{from}</span><span>→</span><span>{to.join(', ') || '∅'}</span></div>
        ))}
      </div>

      {effectiveEdge && (
        <dl className="draw-pair-selection">
          <div><dt>Selection</dt><dd>Draw {effectiveEdge.from} · pair {effectiveEdge.to}</dd></div>
          <div><dt>Decomposition</dt><dd>{formatDecomposition(effectiveEdge)}</dd></div>
        </dl>
      )}
    </div>
  )
}
