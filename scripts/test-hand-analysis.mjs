import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true },
})

try {
  const { analyzeHand, meldDecomposition, winningDecomposition } =
    await server.ssrLoadModule('/src/plugins/waitingTiles.ts')

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
  assert.deepEqual(analyzeHand([3, 1, 3]), {
    kind: 'waiting',
    waitingTiles: [1, 2, 3],
  })
  assert.deepEqual(winningDecomposition([3, 1, 1, 1, 2, 1, 1, 1, 3]), {
    sequences: [2, 6],
    triplets: [1, 9],
    pair: 5,
  })
  assert.deepEqual(analyzeHand([1, 0, 2]), { kind: 'not-meldable' })
  assert.deepEqual(analyzeHand([7, 1, 0]), { kind: 'not-winning' })

  console.log('hand-analysis checks passed')
} finally {
  await server.close()
}
