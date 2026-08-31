import type { HandCounts } from '../core/hand'
import { MahjongTile } from './MahjongTile'

type StackedHandViewProps = {
  counts: HandCounts
}

export function StackedHandView({ counts }: StackedHandViewProps) {
  return (
    <section className="view-card stacked-view" aria-label="Stacked hand view">
      <div className="stacked-scroll" aria-label="Hand stacked by rank">
        <div className="rank-grid stacked-grid">
          {counts.map((count, index) => (
            <div className="stack-column" key={index}>
              {Array.from({ length: count }, (_, tileIndex) => (
                <MahjongTile key={`${index + 1}-${tileIndex}`} rank={index + 1} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
