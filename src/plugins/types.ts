import type { ReactNode } from 'react'
import type { HandCounts } from '../core/hand'

export type RankGroupKind = 'seq' | 'trip' | 'pair'

export type RankGroup = {
  kind: RankGroupKind
  ranks: readonly number[]
}

export type HandTarget = {
  rank: number
  kind: 'waiting' | 'draw'
}

export type HandOverlay = {
  targets?: readonly HandTarget[]
  groups?: readonly RankGroup[]
}

export type InfoPluginResult = {
  data: unknown
  overlay?: HandOverlay
}

export type InfoPluginRenderContext = {
  onPreviewOverlayChange: (overlay: HandOverlay | undefined) => void
}

export type InfoPlugin = {
  id: string
  label: string
  calculate: (counts: HandCounts) => InfoPluginResult
  render: (
    data: unknown,
    counts: HandCounts,
    context: InfoPluginRenderContext,
  ) => ReactNode
}
