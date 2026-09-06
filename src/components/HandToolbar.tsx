import { useState } from 'react'
import type { HandCounts } from '../core/hand'
import type { HandPreset } from '../core/presets'
import { HandInputDialog } from './HandInputDialog'
import { PresetDialog } from './PresetDialog'

const GITHUB_URL = 'https://github.com/sun123zxy/ninegates-viz'

type HandToolbarProps = {
  presets: readonly HandPreset[]
  counts: HandCounts
  canUndo: boolean
  canRedo: boolean
  onPresetSelect: (presetId: string) => void
  onCountsApply: (counts: readonly number[]) => void
  onUndo: () => void
  onRedo: () => void
}

function GitHubLink() {
  return (
    <a
      className="toolbar-icon-button github-link"
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Open the NinegatesViz repository on GitHub"
      title="View on GitHub"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1.6a10.4 10.4 0 0 0-3.3 20.26c.52.1.7-.22.7-.5v-2c-2.87.62-3.47-1.22-3.47-1.22-.47-1.18-1.14-1.5-1.14-1.5-.93-.64.07-.63.07-.63 1.03.07 1.57 1.05 1.57 1.05.91 1.55 2.4 1.1 2.98.84.09-.66.36-1.1.65-1.36-2.29-.26-4.7-1.14-4.7-5.08 0-1.12.4-2.03 1.05-2.75-.1-.26-.46-1.3.1-2.72 0 0 .86-.27 2.78 1.05a9.63 9.63 0 0 1 5.06 0c1.92-1.32 2.78-1.05 2.78-1.05.56 1.42.2 2.46.1 2.72.65.72 1.05 1.63 1.05 2.75 0 3.95-2.42 4.81-4.72 5.07.37.32.7.92.7 1.86v2.75c0 .28.18.6.7.5A10.4 10.4 0 0 0 12 1.6Z" />
      </svg>
    </a>
  )
}

export function HandToolbar({
  presets,
  counts,
  canUndo,
  canRedo,
  onPresetSelect,
  onCountsApply,
  onUndo,
  onRedo,
}: HandToolbarProps) {
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [inputOpen, setInputOpen] = useState(false)

  return (
    <section className="hand-tools-panel" aria-label="Hand tools">
      <div className="hand-toolbar">
        <button
          type="button"
          className="toolbar-icon-button toolbar-glyph"
          aria-label="Choose a hand preset"
          aria-haspopup="dialog"
          title="Presets"
          onClick={() => setPresetsOpen(true)}
        >
          ▦
        </button>
        <button
          type="button"
          className="toolbar-icon-button toolbar-input-glyph"
          aria-label="Input a hand"
          title="Input hand"
          onClick={() => {
            setPresetsOpen(false)
            setInputOpen(true)
          }}
        >
          {'{…}'}
        </button>
        <button
          type="button"
          className="toolbar-icon-button toolbar-glyph"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl/⌘+Z)"
          aria-label="Undo"
          aria-keyshortcuts="Control+Z Meta+Z"
        >
          ↶
        </button>
        <button
          type="button"
          className="toolbar-icon-button toolbar-glyph"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y / Ctrl/⌘+Shift+Z)"
          aria-label="Redo"
          aria-keyshortcuts="Control+Y Control+Shift+Z Meta+Shift+Z"
        >
          ↷
        </button>
        <GitHubLink />
      </div>

      {presetsOpen && (
        <PresetDialog
          presets={presets}
          onClose={() => setPresetsOpen(false)}
          onSelect={(presetId) => {
            onPresetSelect(presetId)
            setPresetsOpen(false)
          }}
        />
      )}

      {inputOpen && (
        <HandInputDialog
          counts={counts}
          onClose={() => setInputOpen(false)}
          onApply={(nextCounts) => {
            onCountsApply(nextCounts)
            setInputOpen(false)
          }}
        />
      )}
    </section>
  )
}
