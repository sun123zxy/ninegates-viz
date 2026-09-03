import { useState } from 'react'
import { setTileCount, type HandCounts } from './core/hand'
import {
  presetsForOrder,
  standardPreset,
  SUPPORTED_ORDERS,
  type Order,
} from './core/presets'
import { HandInfo } from './components/HandInfo'
import { LinearHandView } from './components/LinearHandView'
import { StackedHandView } from './components/StackedHandView'
import { waitingTilesPlugin } from './plugins/waitingTiles'
import './App.css'

const CUSTOM_PRESET_ID = 'custom'
const INITIAL_ORDER: Order = 3
const INITIAL_PRESET = standardPreset(INITIAL_ORDER)

function App() {
  const [order, setOrder] = useState<Order>(INITIAL_ORDER)
  const [counts, setCounts] = useState<HandCounts>(() => [...INITIAL_PRESET.counts])
  const [selectedPreset, setSelectedPreset] = useState(INITIAL_PRESET.id)
  const [waitingTilesEnabled, setWaitingTilesEnabled] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !window.matchMedia('(max-width: 760px)').matches,
  )

  const orderPresets = presetsForOrder(order)
  const livePresets = orderPresets.filter((preset) => preset.waitKind === 'live')
  const deadPresets = orderPresets.filter((preset) => preset.waitKind === 'dead')
  const calculatedWaitingTiles = waitingTilesEnabled
    ? waitingTilesPlugin.calculate(counts)
    : null

  const clearHand = () => {
    setCounts(counts.map(() => 0))
    setSelectedPreset(CUSTOM_PRESET_ID)
  }

  const handlePresetChange = (id: string) => {
    if (id === CUSTOM_PRESET_ID) return
    setSelectedPreset(id)
    const preset = orderPresets.find((item) => item.id === id)
    if (preset) setCounts([...preset.counts])
  }

  const handleOrderChange = (value: number) => {
    const nextOrder = value as Order
    const preset = standardPreset(nextOrder)
    setOrder(nextOrder)
    setCounts([...preset.counts])
    setSelectedPreset(preset.id)
  }

  const handleCountChange = (rank: number, count: number) => {
    setCounts((current) => setTileCount(current, rank, count))
    setSelectedPreset(CUSTOM_PRESET_ID)
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Hand visualization workspace">
        <LinearHandView counts={counts} />
        <StackedHandView
          counts={counts}
          onCountChange={handleCountChange}
          waitingTiles={calculatedWaitingTiles ?? undefined}
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
            <section className="order-panel" aria-labelledby="order-title">
              <div className="sidebar-label" id="order-title">Order n</div>
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
                  aria-label="Generalized Mahjong order"
                />
                <div className="order-ticks" aria-hidden="true">
                  {SUPPORTED_ORDERS.map((value) => <span key={value}>{value}</span>)}
                </div>
              </div>
            </section>

            <section className="preset-panel" aria-labelledby="preset-title">
              <div className="sidebar-label" id="preset-title">Hand presets</div>
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
            </section>

            <section className="algorithms-panel" aria-labelledby="algorithms-title">
              <div className="sidebar-label" id="algorithms-title">Algorithms</div>
              <label className="algorithm-toggle">
                <input
                  type="checkbox"
                  checked={waitingTilesEnabled}
                  onChange={(event) => setWaitingTilesEnabled(event.target.checked)}
                />
                <span>{waitingTilesPlugin.label}</span>
              </label>
            </section>

            <HandInfo counts={counts} waitingTiles={calculatedWaitingTiles ?? undefined} />

            <div className="sidebar-footer">
              <span>Click or drag a stack to set its height</span>
              <span>← → switch stacks; ↑ ↓ / Home / End edit a focused stack</span>
            </div>
          </div>
        )}
      </aside>
    </main>
  )
}

export default App
