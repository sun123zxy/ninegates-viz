import { useRef, type CSSProperties } from 'react'
import {
  MAX_EDITABLE_TILE_COUNT,
  STANDARD_TILE_LIMIT,
  type HandCounts,
} from '../core/hand'
import { MahjongTile } from './MahjongTile'

type StackedHandViewProps = {
  counts: HandCounts
  onCountChange: (rank: number, count: number) => void
}

type DragState = {
  pointerId: number
  rank: number
}

export function StackedHandView({ counts, onCountChange }: StackedHandViewProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

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
              return (
                <div
                  className={`stack-cell ${isFilled ? 'stack-cell-filled' : 'stack-cell-empty'}`}
                  key={`${index + 1}-${level}`}
                  style={{ gridColumn: index + 1, gridRow: levelIndex + 1 }}
                  aria-hidden="true"
                >
                  {isFilled && <MahjongTile rank={index + 1} />}
                </div>
              )
            }),
          )}
          <div className="standard-tile-limit" aria-hidden="true" />
          {counts.map((count, index) => {
            const rank = index + 1
            return (
              <div
                className="stack-column-slider"
                key={rank}
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
                  }
                }}
                onPointerCancel={(event) => {
                  if (dragRef.current?.pointerId === event.pointerId) {
                    dragRef.current = null
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp') {
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
