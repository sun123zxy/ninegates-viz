import { useEffect, useRef, useState } from 'react'
import { setTileCount } from './core/hand'
import {
  commitHistory,
  createHistory,
  redoHistory,
  undoHistory,
} from './core/history'
import {
  presetsForOrder,
  standardPreset,
  SUPPORTED_ORDERS,
  type Order,
} from './core/presets'
import { HandInfo } from './components/HandInfo'
import { LinearHandView } from './components/LinearHandView'
import { StackedHandView } from './components/StackedHandView'
import { handAnalysisPlugin } from './plugins/waitingTiles'
import './App.css'

const CUSTOM_PRESET_ID = 'custom'
const INITIAL_ORDER: Order = 3
const INITIAL_PRESET = standardPreset(INITIAL_ORDER)
const GITHUB_URL = 'https://github.com/sun123zxy/ninegates-webtools'

type HandSnapshot = {
  order: Order
  counts: number[]
  selectedPreset: string
}

function sameHand(left: HandSnapshot, right: HandSnapshot): boolean {
  return left.order === right.order &&
    left.selectedPreset === right.selectedPreset &&
    left.counts.length === right.counts.length &&
    left.counts.every((count, index) => count === right.counts[index])
}

function GitHubLink() {
  return (
    <a
      className="github-link"
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Open the Ninegates Web Tools repository on GitHub"
      title="View on GitHub"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1.6a10.4 10.4 0 0 0-3.3 20.26c.52.1.7-.22.7-.5v-2c-2.87.62-3.47-1.22-3.47-1.22-.47-1.18-1.14-1.5-1.14-1.5-.93-.64.07-.63.07-.63 1.03.07 1.57 1.05 1.57 1.05.91 1.55 2.4 1.1 2.98.84.09-.66.36-1.1.65-1.36-2.29-.26-4.7-1.14-4.7-5.08 0-1.12.4-2.03 1.05-2.75-.1-.26-.46-1.3.1-2.72 0 0 .86-.27 2.78 1.05a9.63 9.63 0 0 1 5.06 0c1.92-1.32 2.78-1.05 2.78-1.05.56 1.42.2 2.46.1 2.72.65.72 1.05 1.63 1.05 2.75 0 3.95-2.42 4.81-4.72 5.07.37.32.7.92.7 1.86v2.75c0 .28.18.6.7.5A10.4 10.4 0 0 0 12 1.6Z" />
      </svg>
    </a>
  )
}

function App() {
  const [history, setHistory] = useState(() => createHistory<HandSnapshot>({
    order: INITIAL_ORDER,
    counts: [...INITIAL_PRESET.counts],
    selectedPreset: INITIAL_PRESET.id,
  }))
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !window.matchMedia('(max-width: 760px)').matches,
  )
  const transactionStartRef = useRef<HandSnapshot | null>(null)

  const { order, counts, selectedPreset } = history.present

  const orderPresets = presetsForOrder(order)
  const livePresets = orderPresets.filter((preset) => preset.waitKind === 'live')
  const deadPresets = orderPresets.filter((preset) => preset.waitKind === 'dead')
  const analysis = handAnalysisPlugin.calculate(counts)
  const decomposition = analysis.kind === 'meldable' || analysis.kind === 'winning'
    ? analysis.decomposition
    : undefined

  const updateHand = (update: (current: HandSnapshot) => HandSnapshot) => {
    setHistory((current) => {
      const next = update(current.present)
      if (transactionStartRef.current) {
        return sameHand(current.present, next) ? current : { ...current, present: next }
      }
      return commitHistory(current, next, sameHand)
    })
  }

  const beginHistoryTransaction = () => {
    setHistory((current) => {
      transactionStartRef.current ??= current.present
      return current
    })
  }

  const finishHistoryTransaction = () => {
    const start = transactionStartRef.current
    transactionStartRef.current = null
    if (!start) return
    setHistory((current) => {
      if (sameHand(start, current.present)) return current
      return commitHistory({ ...current, present: start }, current.present, sameHand)
    })
  }

  const undo = () => setHistory(undoHistory)
  const redo = () => setHistory(redoHistory)

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      const key = event.key.toLowerCase()
      const isUndo = key === 'z' && !event.shiftKey
      const isRedo = key === 'y' || (key === 'z' && event.shiftKey)
      if (!isUndo && !isRedo) return
      event.preventDefault()
      if (isUndo) undo()
      if (isRedo) redo()
    }

    window.addEventListener('keydown', handleHistoryShortcut)
    return () => window.removeEventListener('keydown', handleHistoryShortcut)
  }, [])

  const clearHand = () => {
    updateHand((current) => ({
      ...current,
      counts: current.counts.map(() => 0),
      selectedPreset: CUSTOM_PRESET_ID,
    }))
  }

  const handlePresetChange = (id: string) => {
    if (id === CUSTOM_PRESET_ID) return
    updateHand((current) => {
      const preset = presetsForOrder(current.order).find((item) => item.id === id)
      return preset
        ? { ...current, counts: [...preset.counts], selectedPreset: preset.id }
        : current
    })
  }

  const handleOrderChange = (value: number) => {
    const nextOrder = value as Order
    const preset = standardPreset(nextOrder)
    updateHand(() => ({
      order: nextOrder,
      counts: [...preset.counts],
      selectedPreset: preset.id,
    }))
  }

  const handleCountChange = (rank: number, count: number) => {
    updateHand((current) => ({
      ...current,
      counts: setTileCount(current.counts, rank, count),
      selectedPreset: CUSTOM_PRESET_ID,
    }))
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Hand visualization workspace">
        <LinearHandView counts={counts} />
        <StackedHandView
          counts={counts}
          onCountChange={handleCountChange}
          onEditStart={beginHistoryTransaction}
          onEditEnd={finishHistoryTransaction}
          waitingTiles={analysis.kind === 'waiting' ? analysis.waitingTiles : undefined}
          decomposition={decomposition}
        />
      </section>

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? '›' : '‹'}
        </button>
        {sidebarOpen && (
          <div className="sidebar-content">
            <div className="brand-block">
              <h1><span className="brand-name">NinegatesViz</span></h1>
              <span className="brand-subtitle">A Mahjong game visualizer</span>
            </div>

            <section className="order-panel" aria-label="Order">
              <div className="order-control">
                <output htmlFor="order-slider">n = {order}</output>
                <input
                  id="order-slider"
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={order}
                  onChange={(event) => handleOrderChange(Number(event.target.value))}
                  onPointerDown={beginHistoryTransaction}
                  onPointerUp={finishHistoryTransaction}
                  onPointerCancel={finishHistoryTransaction}
                  onLostPointerCapture={finishHistoryTransaction}
                  aria-label="Generalized Mahjong order"
                />
                <div className="order-ticks" aria-hidden="true">
                  {SUPPORTED_ORDERS.map((value) => <span key={value}>{value}</span>)}
                </div>
              </div>
            </section>

            <section className="preset-panel" aria-label="Hand presets">
              <div className="preset-controls">
                <select
                  value={selectedPreset}
                  onChange={(event) => handlePresetChange(event.target.value)}
                  aria-label="Choose a hand preset"
                >
                  <option value={CUSTOM_PRESET_ID} disabled>Custom hand</option>
                  <optgroup label="Live full-sided">
                    {livePresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                  </optgroup>
                  {deadPresets.length > 0 && (
                    <optgroup label="Full-sided, dead wait">
                      {deadPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button type="button" className="clear-button" onClick={clearHand}>Clear</button>
              </div>
              <div className="history-controls">
                <button
                  type="button"
                  onClick={undo}
                  disabled={history.past.length === 0}
                  title="Undo (Ctrl/⌘+Z)"
                  aria-keyshortcuts="Control+Z Meta+Z"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={history.future.length === 0}
                  title="Redo (Ctrl+Y / Ctrl/⌘+Shift+Z)"
                  aria-keyshortcuts="Control+Y Control+Shift+Z Meta+Shift+Z"
                >
                  Redo
                </button>
              </div>
            </section>

            <HandInfo counts={counts} analysis={analysis} />

            <div className="sidebar-footer">
              <div className="sidebar-footer-copy">
                <span>Click or drag a stack to set its height</span>
                <span>← → switch stacks</span>
                <span>↑ ↓ / Home / End edit a focused stack</span>
                <span>Ctrl+Z undo; Ctrl+Y or Ctrl+Shift+Z redo</span>
              </div>
              <GitHubLink />
            </div>
          </div>
        )}
      </aside>
    </main>
  )
}

export default App
