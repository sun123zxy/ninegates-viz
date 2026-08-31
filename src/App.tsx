import { useEffect, useState } from 'react'
import { addTile, removeTile, type HandCounts } from './core/hand'
import { DEFAULT_PRESET, PRESETS } from './core/presets'
import { HandInfo } from './components/HandInfo'
import { LinearHandView } from './components/LinearHandView'
import { StackedHandView } from './components/StackedHandView'
import { TileControlRow } from './components/TileControlRow'
import './App.css'

function App() {
  const [counts, setCounts] = useState<HandCounts>(() => [...DEFAULT_PRESET.counts])
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET.id)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !window.matchMedia('(max-width: 760px)').matches,
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

      const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)
      if (!match) return
      setCounts((current) => addTile(current, Number(match[1])))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const clearHand = () => setCounts(counts.map(() => 0))
  const handlePresetChange = (id: string) => {
    setSelectedPreset(id)
    const preset = PRESETS.find((item) => item.id === id)
    if (preset) setCounts([...preset.counts])
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Hand visualization workspace">
        <LinearHandView counts={counts} />
        <StackedHandView counts={counts} />
        <TileControlRow
          counts={counts}
          onAdd={(rank) => setCounts((current) => addTile(current, rank))}
          onRemove={(rank) => setCounts((current) => removeTile(current, rank))}
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
              <span className="eyebrow">NINEGATES / VISUAL LAB</span>
              <h1>Nine Gates<br />Hand Visualizer</h1>
              <p>Observe and edit hands in generalized Mahjong.</p>
            </div>

            <section className="preset-panel" aria-labelledby="preset-title">
              <div className="sidebar-label" id="preset-title">Hand presets</div>
              <div className="preset-controls">
                <select
                  value={selectedPreset}
                  onChange={(event) => handlePresetChange(event.target.value)}
                  aria-label="Choose a hand preset"
                >
                  {PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                </select>
                <button type="button" className="clear-button" onClick={clearHand}>Clear</button>
              </div>
            </section>

            <HandInfo counts={counts} />

            <div className="sidebar-footer">
              <span>Keyboard 1—9 / NumPad adds tiles</span>
              <span>Upper half + · lower half −</span>
            </div>
          </div>
        )}
      </aside>
    </main>
  )
}

export default App
