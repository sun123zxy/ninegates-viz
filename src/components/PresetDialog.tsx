import { useRef, useState, type CSSProperties } from 'react'
import { formatVector } from '../core/hand'
import type { HandPreset } from '../core/presets'
import { ModalDialog } from './ModalDialog'

type PresetDialogProps = {
  presets: readonly HandPreset[]
  onSelect: (presetId: string) => void
  onClose: () => void
}

type PresetGroup = {
  label: string
  presets: readonly HandPreset[]
}

function presetGroups(presets: readonly HandPreset[]): readonly PresetGroup[] {
  const n = presets[0]?.n
  if (n === 3) {
    return [
      { label: 'm = 4', presets: presets.filter((preset) => preset.m === 4) },
      { label: 'm = 5', presets: presets.filter((preset) => preset.m === 5) },
      {
        label: 'm ≥ 6 (non-exhaustive)',
        presets: presets.filter((preset) => preset.m >= 6),
      },
    ].filter((group) => group.presets.length > 0)
  }

  return [...new Set(presets.map((preset) => preset.m))]
    .sort((left, right) => left - right)
    .map((m) => ({
      label: `m = ${m}`,
      presets: presets.filter((preset) => preset.m === m),
    }))
}

function markerLabel(marker: HandPreset['marker']): string | undefined {
  if (marker === 'B') return 'bi-good'
  if (marker === 'G') return 'good'
  return undefined
}

export function PresetDialog({ presets, onSelect, onClose }: PresetDialogProps) {
  const [detailPresetId, setDetailPresetId] = useState<string | null>(null)
  const longPressTimerRef = useRef<number | undefined>(undefined)
  const longPressHandledRef = useRef(false)
  const groups = presetGroups(presets)

  const clearLongPress = () => {
    if (longPressTimerRef.current !== undefined) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = undefined
    }
  }

  const startLongPress = (preset: HandPreset, pointerType: string) => {
    if (pointerType === 'mouse') return
    longPressHandledRef.current = false
    clearLongPress()
    longPressTimerRef.current = window.setTimeout(() => {
      longPressHandledRef.current = true
      setDetailPresetId(preset.id)
    }, 500)
  }

  return (
    <ModalDialog className="preset-dialog" title="Presets" onClose={onClose}>
      <div className="preset-legend" aria-label="Preset marker legend">
        <span><b>B</b> bi-good</span>
        <span><b>G</b> good</span>
      </div>
      <div className="preset-dialog-list">
        {groups.map((group, groupIndex) => (
          <section className="preset-group" aria-label={group.label} key={group.label}>
            <h3>{group.label}</h3>
            <div className="preset-card-grid">
              {group.presets.map((preset, index) => {
                const detailVisible = detailPresetId === preset.id
                const markerText = markerLabel(preset.marker)
                return (
                  <button
                    type="button"
                    className="preset-card"
                    key={preset.id}
                    autoFocus={groupIndex === 0 && index === 0}
                    aria-label={`(${preset.n}, ${preset.m}) ${formatVector(preset.counts)}${markerText ? `, ${markerText}` : ''}`}
                    onClick={() => {
                      if (longPressHandledRef.current) {
                        longPressHandledRef.current = false
                        return
                      }
                      onSelect(preset.id)
                    }}
                    onMouseEnter={() => setDetailPresetId(preset.id)}
                    onMouseLeave={() => setDetailPresetId(null)}
                    onFocus={() => setDetailPresetId(preset.id)}
                    onBlur={() => setDetailPresetId(null)}
                    onPointerDown={(event) => startLongPress(preset, event.pointerType)}
                    onPointerUp={clearLongPress}
                    onPointerCancel={clearLongPress}
                  >
                    <span className="preset-card-header" aria-hidden="true">
                      <span className="preset-card-index">#{index + 1}</span>
                      {preset.marker && (
                        <span className={`preset-marker preset-marker-${preset.marker}`}>
                          {preset.marker}
                        </span>
                      )}
                    </span>
                    <span
                      className="preset-thumbnail"
                      aria-hidden="true"
                      style={{ '--rank-count': preset.counts.length } as CSSProperties}
                    >
                      {preset.counts.map((count, rank) => (
                        <span
                          className="preset-thumbnail-bar"
                          key={rank}
                          style={{ '--count': count } as CSSProperties}
                        />
                      ))}
                    </span>
                    {detailVisible && (
                      <span className="preset-card-detail" role="tooltip">
                        <span>(n,m) = ({preset.n},{preset.m})</span>
                        <code>{formatVector(preset.counts)}</code>
                        {markerText && <span>{markerText}</span>}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </ModalDialog>
  )
}
