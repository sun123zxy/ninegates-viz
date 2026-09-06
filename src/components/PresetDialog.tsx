import type { HandPreset } from '../core/presets'
import { ModalDialog } from './ModalDialog'

type PresetDialogProps = {
  presets: readonly HandPreset[]
  onSelect: (presetId: string) => void
  onClose: () => void
}

export function PresetDialog({ presets, onSelect, onClose }: PresetDialogProps) {
  const livePresets = presets.filter((preset) => preset.waitKind === 'live')
  const deadPresets = presets.filter((preset) => preset.waitKind === 'dead')

  const renderGroup = (label: string, group: readonly HandPreset[]) => (
    group.length > 0 && (
      <section className="preset-group" aria-label={label}>
        <h3>{label}</h3>
        {group.map((preset) => (
          <button
            type="button"
            className="preset-option"
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            autoFocus={preset === presets[0]}
          >
            {preset.name}
          </button>
        ))}
      </section>
    )
  )

  return (
    <ModalDialog className="preset-dialog" title="Presets" onClose={onClose}>
      <div className="preset-dialog-list">
        {renderGroup('Live full-sided', livePresets)}
        {renderGroup('Full-sided, dead wait', deadPresets)}
      </div>
    </ModalDialog>
  )
}
