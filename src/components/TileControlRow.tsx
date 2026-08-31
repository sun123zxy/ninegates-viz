import type { HandCounts } from '../core/hand'
import { MahjongTile } from './MahjongTile'

type TileControlRowProps = {
  counts: HandCounts
  onAdd: (rank: number) => void
  onRemove: (rank: number) => void
}

export function TileControlRow({ counts, onAdd, onRemove }: TileControlRowProps) {
  return (
    <section className="controls-card" aria-label="Hand controls">
      <div className="controls-scroll">
        <div className="rank-grid control-grid">
          {counts.map((count, index) => {
            const rank = index + 1
            return (
              <div className="tile-control" key={rank}>
                <MahjongTile rank={rank} className="control-tile" />
                <button
                  type="button"
                  className="control-zone control-add"
                  onClick={() => onAdd(rank)}
                  aria-label={`Add rank ${rank}`}
                >
                  <span>+</span>
                </button>
                <button
                  type="button"
                  className="control-zone control-remove"
                  onClick={() => onRemove(rank)}
                  disabled={count === 0}
                  aria-label={`Remove rank ${rank}`}
                >
                  <span>−</span>
                </button>
                <span className="control-count" aria-hidden="true">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
