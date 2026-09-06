import { useRef, type KeyboardEvent } from 'react'
import type { HandCounts } from '../core/hand'
import type { InfoPlugin, InfoPluginResult } from '../plugins/types'

type InfoTabsProps = {
  plugins: readonly InfoPlugin[]
  activePluginId: string
  counts: HandCounts
  result: InfoPluginResult | undefined
  onPluginChange: (pluginId: string) => void
}

export function InfoTabs({
  plugins,
  activePluginId,
  counts,
  result,
  onPluginChange,
}: InfoTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = Math.max(0, plugins.findIndex((plugin) => plugin.id === activePluginId))
  const activePlugin = plugins[activeIndex]

  if (!activePlugin) return null

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (activeIndex + 1) % plugins.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (activeIndex - 1 + plugins.length) % plugins.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = plugins.length - 1
    }
    if (nextIndex === undefined) return
    event.preventDefault()
    onPluginChange(plugins[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <section className="info-panel" aria-label="Information">
      <div className="info-tabs" role="tablist" aria-label="Information views">
        {plugins.map((plugin) => {
          const isActive = plugin.id === activePlugin.id
          return (
            <button
              type="button"
              role="tab"
              key={plugin.id}
              ref={(element) => {
                tabRefs.current[plugins.indexOf(plugin)] = element
              }}
              id={`info-tab-${plugin.id}`}
              aria-controls={`info-panel-${plugin.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`info-tab${isActive ? ' info-tab-active' : ''}`}
              onClick={() => onPluginChange(plugin.id)}
              onKeyDown={handleTabKeyDown}
            >
              {plugin.label}
            </button>
          )
        })}
      </div>
      <div
        id={`info-panel-${activePlugin.id}`}
        className="info-tabpanel"
        role="tabpanel"
        aria-labelledby={`info-tab-${activePlugin.id}`}
        tabIndex={0}
      >
        {result && activePlugin.render(result.data, counts)}
      </div>
    </section>
  )
}
