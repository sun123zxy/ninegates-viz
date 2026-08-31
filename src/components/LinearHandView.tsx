import { expandHand, type HandCounts } from '../core/hand'
import { MahjongTile } from './MahjongTile'

type LinearHandViewProps = {
  counts: HandCounts
}

export function LinearHandView({ counts }: LinearHandViewProps) {
  return (
    <section className="view-card linear-view" aria-label="Linear hand view">
      <div className="linear-scroll" aria-label="Hand in ascending rank order">
        <div className="linear-hand">
          {expandHand(counts).map((rank, index) => (
            <MahjongTile key={`${rank}-${index}`} rank={rank} />
          ))}
          {expandHand(counts).length === 0 && <span className="empty-hint">No tiles</span>}
        </div>
      </div>
    </section>
  )
}
