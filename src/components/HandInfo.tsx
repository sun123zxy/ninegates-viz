import { formatMultiset, formatVector, totalTiles, type HandCounts } from '../core/hand'

type HandInfoProps = {
  counts: HandCounts
}

export function HandInfo({ counts }: HandInfoProps) {
  return (
    <section className="info-panel" aria-labelledby="info-title">
      <div className="sidebar-label" id="info-title">Hand information</div>
      <dl className="info-list">
        <div>
          <dt>Tile count</dt>
          <dd>{totalTiles(counts)}</dd>
        </div>
        <div>
          <dt>Multiplicity vector</dt>
          <dd>{formatVector(counts)}</dd>
        </div>
        <div>
          <dt>Hand</dt>
          <dd>{formatMultiset(counts)}</dd>
        </div>
      </dl>
    </section>
  )
}
