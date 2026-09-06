import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true },
})

try {
  const { analyzeHand, meldDecomposition, winningDecomposition } =
    await server.ssrLoadModule('/src/plugins/waitingTiles.ts')
  const { calculateDrawPairGraph } =
    await server.ssrLoadModule('/src/plugins/drawPairGraph.ts')
  const { decompositionGroups, drawPairOverlay } =
    await server.ssrLoadModule('/src/plugins/handOverlay.ts')
  const { DrawPairGraphPanel } =
    await server.ssrLoadModule('/src/components/DrawPairGraphPanel.tsx')
  const { StackedHandView } =
    await server.ssrLoadModule('/src/components/StackedHandView.tsx')
  const { INFO_PLUGINS } = await server.ssrLoadModule('/src/plugins/info.tsx')
  const { HISTORY_LIMIT, commitHistory, createHistory, redoHistory, undoHistory } =
    await server.ssrLoadModule('/src/core/history.ts')

  assert.deepEqual(meldDecomposition([1, 1, 1]), {
    sequences: [1],
    triplets: [],
  })
  assert.deepEqual(meldDecomposition([3, 0, 0]), {
    sequences: [],
    triplets: [1],
  })
  assert.equal(meldDecomposition([1, 0, 0]), null)

  assert.deepEqual(winningDecomposition([3, 2, 3]), {
    sequences: [],
    triplets: [1, 3],
    pair: 2,
  })
  assert.deepEqual(analyzeHand([2, 0, 0]), {
    kind: 'winning',
    decomposition: { sequences: [], triplets: [], pair: 1 },
    meldCount: 0,
    isStandard: false,
  })
  assert.deepEqual(analyzeHand([3, 1, 3]), {
    kind: 'waiting',
    waitingTiles: [1, 2, 3],
    meldCount: 2,
    isStandard: true,
  })
  assert.deepEqual(analyzeHand([1, 0, 0]), {
    kind: 'waiting',
    waitingTiles: [1],
    meldCount: 0,
    isStandard: false,
  })
  assert.deepEqual(winningDecomposition([3, 1, 1, 1, 2, 1, 1, 1, 3]), {
    sequences: [2, 6],
    triplets: [1, 9],
    pair: 5,
  })
  assert.deepEqual(analyzeHand([1, 0, 2]), { kind: 'not-meldable' })
  assert.deepEqual(analyzeHand([7, 1, 0]), { kind: 'not-winning' })

  const threeRankGraph = calculateDrawPairGraph([3, 1, 3])
  assert.deepEqual(threeRankGraph, {
    weightedSum: 14,
    sumResidue: 2,
    groups: [
      { role: 'bottom', offset: 0, residue: 2, ranks: [2] },
      { role: 'left', offset: 1, residue: 0, ranks: [3] },
      { role: 'right', offset: 2, residue: 1, ranks: [1] },
    ],
    edges: [
      {
        from: 1,
        to: 3,
        decomposition: { sequences: [1], triplets: [1], pair: 3 },
      },
      {
        from: 2,
        to: 2,
        decomposition: { sequences: [], triplets: [1, 3], pair: 2 },
      },
      {
        from: 3,
        to: 1,
        decomposition: { sequences: [1], triplets: [3], pair: 1 },
      },
    ],
    waitingTiles: [1, 2, 3],
  })
  const drawOnePairThree = threeRankGraph.edges[0]
  assert.deepEqual(decompositionGroups(drawOnePairThree.decomposition), [
    { kind: 'seq', ranks: [1, 2, 3] },
    { kind: 'trip', ranks: [1, 1, 1] },
    { kind: 'pair', ranks: [3, 3] },
  ])
  const seventhLevelGraph = calculateDrawPairGraph([1, 3, 6])
  const seventhLevelEdge = seventhLevelGraph.edges
    .find(({ from, to }) => from === 3 && to === 2)
  assert.ok(seventhLevelEdge)
  assert.equal(
    decompositionGroups(seventhLevelEdge.decomposition)
      .flatMap(({ ranks }) => ranks)
      .filter((rank) => rank === 3)
      .length,
    7,
  )
  const seventhLevelOverlay = drawPairOverlay(
    seventhLevelGraph,
    seventhLevelEdge,
  )
  const stackedMarkup = renderToStaticMarkup(createElement(StackedHandView, {
    counts: [1, 3, 6],
    onCountChange: () => {},
    onEditStart: () => {},
    onEditEnd: () => {},
    overlay: seventhLevelOverlay,
  }))
  assert.match(
    stackedMarkup,
    /stack-cell-virtual-target stack-cell-target stack-cell-target-draw/,
  )
  const graphMarkup = renderToStaticMarkup(createElement(DrawPairGraphPanel, {
    graph: threeRankGraph,
    onPreviewOverlayChange: () => {},
  }))
  assert.match(graphMarkup, /viewBox="0 0 320 350"/)
  assert.match(graphMarkup, /\[s\] ≡ 2/)
  assert.match(graphMarkup, /\[s\+1\] ≡ 0/)
  assert.match(graphMarkup, /Draw 1, use 3 as the pair/)
  assert.match(graphMarkup, /role="button" tabindex="0"/)
  assert.doesNotMatch(graphMarkup, /<marker/)
  assert.match(graphMarkup, /class="draw-pair-arrow"/)
  assert.match(graphMarkup, /M [^"]+ L [^"]+"/)
  assert.match(graphMarkup, /draw-pair-node-waiting/)
  assert.deepEqual(drawPairOverlay(threeRankGraph, threeRankGraph.edges[0]), {
    targets: [
      { rank: 1, kind: 'draw' },
      { rank: 2, kind: 'waiting' },
      { rank: 3, kind: 'waiting' },
    ],
    groups: [
      { kind: 'seq', ranks: [1, 2, 3] },
      { kind: 'trip', ranks: [1, 1, 1] },
      { kind: 'pair', ranks: [3, 3] },
    ],
  })
  assert.deepEqual(calculateDrawPairGraph([0, 0, 0, 0, 0, 0]), {
    weightedSum: 0,
    sumResidue: 0,
    groups: [
      { role: 'bottom', offset: 0, residue: 0, ranks: [3, 6] },
      { role: 'left', offset: 1, residue: 1, ranks: [1, 4] },
      { role: 'right', offset: 2, residue: 2, ranks: [2, 5] },
    ],
    edges: [],
    waitingTiles: [],
  })

  const handPlugin = INFO_PLUGINS.find((plugin) => plugin.id === 'hand-analysis')
  assert.ok(handPlugin)
  const waitingResult = handPlugin.calculate([3, 1, 1, 1, 1, 1, 1, 1, 3])
  assert.deepEqual(waitingResult.overlay, {
    targets: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((rank) => ({ rank, kind: 'waiting' })),
    groups: [],
  })
  assert.equal(JSON.stringify(waitingResult).includes('level'), false)
  assert.equal(JSON.stringify(waitingResult).includes('offset'), false)

  const winningResult = handPlugin.calculate([3, 1, 1, 1, 2, 1, 1, 1, 3])
  assert.deepEqual(winningResult.overlay, {
    groups: [
      { kind: 'seq', ranks: [2, 3, 4] },
      { kind: 'seq', ranks: [6, 7, 8] },
      { kind: 'trip', ranks: [1, 1, 1] },
      { kind: 'trip', ranks: [9, 9, 9] },
      { kind: 'pair', ranks: [5, 5] },
    ],
  })

  const controlsPlugin = INFO_PLUGINS.find((plugin) => plugin.id === 'controls')
  assert.ok(controlsPlugin)
  assert.match(
    renderToStaticMarkup(controlsPlugin.render(null, [], { onPreviewOverlayChange: () => {} })),
    /Ctrl\+Z undo/,
  )

  const equal = (left, right) => left === right
  let history = createHistory(1)
  history = commitHistory(history, 2, equal)
  history = commitHistory(history, 3, equal)
  assert.equal(undoHistory(history).present, 2)
  assert.equal(redoHistory(undoHistory(history)).present, 3)
  assert.equal(commitHistory(undoHistory(history), 4, equal).future.length, 0)

  let cappedHistory = createHistory(0)
  for (let value = 1; value <= HISTORY_LIMIT + 1; value += 1) {
    cappedHistory = commitHistory(cappedHistory, value, equal)
  }
  assert.equal(cappedHistory.past.length, HISTORY_LIMIT)
  assert.equal(cappedHistory.past[0], 1)

  console.log('core checks passed')
} finally {
  await server.close()
}
