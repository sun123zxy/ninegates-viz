import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { InfoTabs } from './components/InfoTabs'
import { HandToolbar } from './components/HandToolbar'
import { LinearHandView } from './components/LinearHandView'
import { StackedHandView } from './components/StackedHandView'
import { INFO_PLUGINS } from './plugins/info'
import type { HandOverlay } from './plugins/types'
import './App.css'

const INITIAL_ORDER: Order = 3
const INITIAL_PRESET = standardPreset(INITIAL_ORDER)

type HandSnapshot = {
  order: Order
  counts: number[]
}

type PreviewOverlay = {
  pluginId: string
  counts: readonly number[]
  overlay: HandOverlay
}

function sameHand(left: HandSnapshot, right: HandSnapshot): boolean {
  return left.order === right.order &&
    left.counts.length === right.counts.length &&
    left.counts.every((count, index) => count === right.counts[index])
}

function App() {
  const [history, setHistory] = useState(() => createHistory<HandSnapshot>({
    order: INITIAL_ORDER,
    counts: [...INITIAL_PRESET.counts],
  }))
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !window.matchMedia('(max-width: 760px)').matches,
  )
  const [activeInfoPluginId, setActiveInfoPluginId] = useState(INFO_PLUGINS[0]?.id ?? '')
  const [previewOverlay, setPreviewOverlay] = useState<PreviewOverlay | null>(null)
  const transactionStartRef = useRef<HandSnapshot | null>(null)

  const { order, counts } = history.present

  const orderPresets = presetsForOrder(order)
  const activeInfoPlugin = INFO_PLUGINS.find((plugin) => plugin.id === activeInfoPluginId)
    ?? INFO_PLUGINS[0]
  const activeInfoResult = useMemo(
    () => activeInfoPlugin?.calculate(counts),
    [activeInfoPlugin, counts],
  )
  const handlePreviewOverlayChange = useCallback((overlay: HandOverlay | undefined) => {
    setPreviewOverlay(overlay && activeInfoPlugin
      ? { pluginId: activeInfoPlugin.id, counts, overlay }
      : null)
  }, [activeInfoPlugin, counts])
  const matchingPreview = previewOverlay?.pluginId === activeInfoPlugin?.id &&
    previewOverlay.counts === counts
    ? previewOverlay.overlay
    : undefined
  const visibleOverlay = matchingPreview ?? activeInfoResult?.overlay

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
      const target = event.target
      if (target instanceof HTMLElement && (
        target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )) return
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

  const handlePresetSelect = (id: string) => {
    updateHand((current) => {
      const preset = presetsForOrder(current.order).find((item) => item.id === id)
      return preset
        ? { ...current, counts: [...preset.counts] }
        : current
    })
  }

  const handleOrderChange = (value: number) => {
    const nextOrder = value as Order
    const preset = standardPreset(nextOrder)
    updateHand(() => ({
      order: nextOrder,
      counts: [...preset.counts],
    }))
  }

  const handleCountChange = (rank: number, count: number) => {
    updateHand((current) => ({
      ...current,
      counts: setTileCount(current.counts, rank, count),
    }))
  }

  const handleCountsApply = (nextCounts: readonly number[]) => {
    updateHand((current) => ({
      ...current,
      counts: [...nextCounts],
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
          overlay={visibleOverlay}
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

            <HandToolbar
              presets={orderPresets}
              counts={counts}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
              onPresetSelect={handlePresetSelect}
              onCountsApply={handleCountsApply}
              onUndo={undo}
              onRedo={redo}
            />

            <InfoTabs
              plugins={INFO_PLUGINS}
              activePluginId={activeInfoPlugin?.id ?? ''}
              counts={counts}
              result={activeInfoResult}
              onPluginChange={setActiveInfoPluginId}
              onPreviewOverlayChange={handlePreviewOverlayChange}
            />
          </div>
        )}
      </aside>
    </main>
  )
}

export default App
