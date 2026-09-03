import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  MAX_EDITABLE_TILE_COUNT,
  STANDARD_TILE_LIMIT,
  type HandCounts,
} from '../core/hand'
import type { HandDecomposition } from '../plugins/waitingTiles'
import { MahjongTile } from './MahjongTile'

type StackedHandViewProps = {
  counts: HandCounts
  onCountChange: (rank: number, count: number) => void
  onEditStart: () => void
  onEditEnd: () => void
  waitingTiles?: readonly number[]
  decomposition?: HandDecomposition
}

type DragState = {
  pointerId: number
  rank: number
}

type DecompositionLine = {
  kind: 'seq' | 'trip' | 'pair'
  tiles: readonly { rank: number; level: number }[]
}

type LinePath = {
  kind: DecompositionLine['kind']
  points: string
  endpoints: readonly { x: number; y: number }[]
}

function buildDecompositionLines(decomposition: HandDecomposition): DecompositionLine[] {
  const groups: Array<{ kind: DecompositionLine['kind']; ranks: number[] }> = [
    ...decomposition.sequences.map((start) => ({ kind: 'seq' as const, ranks: [start, start + 1, start + 2] })),
    ...decomposition.triplets.map((rank) => ({ kind: 'trip' as const, ranks: [rank, rank, rank] })),
  ]
  if (decomposition.pair !== undefined) {
    groups.push({ kind: 'pair', ranks: [decomposition.pair, decomposition.pair] })
  }

  const usedLevels: number[] = []
  return groups.map(({ kind, ranks }) => ({
    kind,
    tiles: ranks.map((rank) => {
      const level = (usedLevels[rank - 1] ?? 0) + 1
      usedLevels[rank - 1] = level
      return { rank, level }
    }),
  }))
}

export function StackedHandView({
  counts,
  onCountChange,
  onEditStart,
  onEditEnd,
  waitingTiles,
  decomposition,
}: StackedHandViewProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const sliderRefs = useRef<Array<HTMLDivElement | null>>([])
  const decompositionLines = useMemo(
    () => decomposition ? buildDecompositionLines(decomposition) : [],
    [decomposition],
  )
  const [linePaths, setLinePaths] = useState<readonly LinePath[]>([])

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || decompositionLines.length === 0) {
      setLinePaths([])
      return undefined
    }

    const measureLines = () => {
      const nextPaths = decompositionLines.map(({ kind, tiles }) => {
        const centers = tiles.map(({ rank, level }) => {
          const cell = grid.querySelector<HTMLElement>(
            `[data-rank="${rank}"][data-level="${level}"]`,
          )
          if (!cell) return null
          return {
            x: cell.offsetLeft + cell.offsetWidth / 2,
            y: cell.offsetTop + cell.offsetHeight / 2,
          }
        }).filter((center): center is { x: number; y: number } => center !== null)
        return {
          kind,
          points: centers.map(({ x, y }) => `${x},${y}`).join(' '),
          endpoints: centers.length > 1 ? [centers[0], centers[centers.length - 1]] : centers,
        }
      }).filter((path) => path.points.length > 0)
      setLinePaths(nextPaths)
    }

    measureLines()
    const observer = new ResizeObserver(measureLines)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [decompositionLines])

  const focusAdjacentStack = (rank: number, direction: -1 | 1) => {
    sliderRefs.current[rank - 1 + direction]?.focus()
  }

  const countAtPointer = (clientY: number) => {
    const grid = gridRef.current
    if (!grid) return 0

    const rect = grid.getBoundingClientRect()
    const rowHeight = rect.height / MAX_EDITABLE_TILE_COUNT
    const heightFromBottom = rect.bottom - clientY
    return Math.min(
      MAX_EDITABLE_TILE_COUNT,
      Math.max(0, Math.ceil(heightFromBottom / rowHeight)),
    )
  }

  const updateFromPointer = (rank: number, clientY: number) => {
    onCountChange(rank, countAtPointer(clientY))
  }

  return (
    <section className="view-card stacked-view" aria-label="Editable stacked hand view">
      <div className="stacked-scroll">
        <div
          className="stacked-grid"
          ref={gridRef}
          style={{
            '--rank-count': counts.length,
            '--stack-level-count': MAX_EDITABLE_TILE_COUNT,
            '--over-limit-level-count': MAX_EDITABLE_TILE_COUNT - STANDARD_TILE_LIMIT,
          } as CSSProperties}
          aria-label="Six-level tile grid"
        >
          {counts.flatMap((count, index) =>
            Array.from({ length: MAX_EDITABLE_TILE_COUNT }, (_, levelIndex) => {
              const level = MAX_EDITABLE_TILE_COUNT - levelIndex
              const isFilled = level <= count
              const isWaitingTarget =
                waitingTiles?.includes(index + 1) &&
                count < MAX_EDITABLE_TILE_COUNT &&
                level === count + 1
              return (
                <div
                  className={`stack-cell ${isFilled ? 'stack-cell-filled' : 'stack-cell-empty'}${
                    isWaitingTarget ? ' stack-cell-waiting-target' : ''
                  }`}
                  key={`${index + 1}-${level}`}
                  style={{ gridColumn: index + 1, gridRow: levelIndex + 1 }}
                  data-rank={index + 1}
                  data-level={level}
                  aria-hidden="true"
                >
                  {isFilled && <MahjongTile rank={index + 1} />}
                </div>
              )
            }),
          )}
          <div className="standard-tile-limit" aria-hidden="true" />
          {linePaths.length > 0 && (
            <svg className="decomposition-overlay" aria-hidden="true">
              {linePaths.map((path, index) => (
                <g key={`${path.kind}-${index}`}>
                  <polyline className="decomposition-line-outline" points={path.points} />
                  <polyline
                    className={`decomposition-line decomposition-line-${path.kind}`}
                    points={path.points}
                  />
                  {path.endpoints.map(({ x, y }, endpointIndex) => (
                    <circle
                      className={`decomposition-endpoint decomposition-endpoint-${path.kind}`}
                      key={endpointIndex}
                      cx={x}
                      cy={y}
                    />
                  ))}
                </g>
              ))}
            </svg>
          )}
          {counts.map((count, index) => {
            const rank = index + 1
            return (
              <div
                className="stack-column-slider"
                key={rank}
                ref={(element) => {
                  sliderRefs.current[index] = element
                }}
                role="slider"
                tabIndex={0}
                aria-label={`Rank ${rank} tile count`}
                aria-valuemin={0}
                aria-valuemax={MAX_EDITABLE_TILE_COUNT}
                aria-valuenow={count}
                aria-valuetext={`${count} ${count === 1 ? 'tile' : 'tiles'}`}
                style={{ gridColumn: rank }}
                onPointerDown={(event) => {
                  if (event.pointerType === 'mouse' && event.button !== 0) return
                  event.currentTarget.setPointerCapture(event.pointerId)
                  dragRef.current = { pointerId: event.pointerId, rank }
                  onEditStart()
                  updateFromPointer(rank, event.clientY)
                }}
                onPointerMove={(event) => {
                  const drag = dragRef.current
                  if (drag?.pointerId === event.pointerId) {
                    updateFromPointer(drag.rank, event.clientY)
                  }
                }}
                onPointerUp={(event) => {
                  if (dragRef.current?.pointerId === event.pointerId) {
                    dragRef.current = null
                    onEditEnd()
                  }
                }}
                onPointerCancel={(event) => {
                  if (dragRef.current?.pointerId === event.pointerId) {
                    dragRef.current = null
                    onEditEnd()
                  }
                }}
                onLostPointerCapture={() => {
                  if (dragRef.current?.rank === rank) {
                    dragRef.current = null
                    onEditEnd()
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') {
                    focusAdjacentStack(rank, -1)
                  } else if (event.key === 'ArrowRight') {
                    focusAdjacentStack(rank, 1)
                  } else if (event.key === 'ArrowUp') {
                    onCountChange(rank, Math.min(count + 1, MAX_EDITABLE_TILE_COUNT))
                  } else if (event.key === 'ArrowDown') {
                    onCountChange(rank, Math.max(count - 1, 0))
                  } else if (event.key === 'Home') {
                    onCountChange(rank, 0)
                  } else if (event.key === 'End') {
                    onCountChange(rank, MAX_EDITABLE_TILE_COUNT)
                  } else {
                    return
                  }
                  event.preventDefault()
                }}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
