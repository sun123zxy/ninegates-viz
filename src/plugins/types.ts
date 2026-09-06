import type { ReactNode } from 'react'
import type { HandCounts } from '../core/hand'

export type RankGroup = {
  kind: string
  ranks: readonly number[]
}

export type HandOverlay = {
  highlights?: readonly number[]
  groups?: readonly RankGroup[]
}

export type InfoPluginResult = {
  data: unknown
  overlay?: HandOverlay
}

export type InfoPlugin = {
  id: string
  label: string
  calculate: (counts: HandCounts) => InfoPluginResult
  render: (data: unknown, counts: HandCounts) => ReactNode
}

