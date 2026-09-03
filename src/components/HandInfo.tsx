import { formatMultiset, formatVector, totalTiles, type HandCounts } from '../core/hand'
import type { HandAnalysis } from '../plugins/waitingTiles'

type HandInfoProps = {
  counts: HandCounts
  analysis: HandAnalysis
}

function repeatedRank(rank: number, copies: number): string {
  return rank < 10 ? String(rank).repeat(copies) : Array.from({ length: copies }, () => rank).join('-')
}

function sequenceRanks(rank: number): string {
  return rank + 2 < 10
    ? `${rank}${rank + 1}${rank + 2}`
    : `${rank}-${rank + 1}-${rank + 2}`
}

export function HandInfo({ counts, analysis }: HandInfoProps) {
  const decomposition = analysis.kind === 'meldable' || analysis.kind === 'winning'
    ? analysis.decomposition
    : undefined
  const expectedMeldCount = counts.length / 3 + 1
  const waitingMeldCount = (totalTiles(counts) - 1) / 3
  const winningMeldCount = decomposition
    ? decomposition.sequences.length + decomposition.triplets.length
    : 0
  const waitingIsNonStandard = analysis.kind === 'waiting' && waitingMeldCount !== expectedMeldCount
  const winningIsNonStandard = analysis.kind === 'winning' && winningMeldCount !== expectedMeldCount

  return (
    <section className="info-panel" aria-label="Hand information">
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
        {analysis.kind === 'waiting' && (
          <>
            <div>
              <dt>Hand analysis</dt>
              <dd>
                Waiting — <span className={waitingIsNonStandard ? 'analysis-warning' : undefined}>
                  {waitingMeldCount} melds
                </span> + 1 pair
              </dd>
            </div>
            <div>
              <dt>Waiting tiles</dt>
              <dd>{analysis.waitingTiles.length === 0 ? '∅' : analysis.waitingTiles.join(', ')}</dd>
            </div>
          </>
        )}
        {analysis.kind === 'meldable' && (
          <div>
            <dt>Hand analysis</dt>
            <dd>Meldable</dd>
          </div>
        )}
        {analysis.kind === 'winning' && (
          <div>
              <dt>Hand analysis</dt>
              <dd>
                Winning — <span className={winningIsNonStandard ? 'analysis-warning' : undefined}>
                  {winningMeldCount} melds
                </span> + 1 pair
              </dd>
          </div>
        )}
        {analysis.kind === 'not-meldable' && (
          <div>
            <dt>Hand analysis</dt>
            <dd>Not meldable</dd>
          </div>
        )}
        {analysis.kind === 'not-winning' && (
          <div>
            <dt>Hand analysis</dt>
            <dd>Not a winning hand</dd>
          </div>
        )}
        {analysis.kind === 'none' && (
          <div>
            <dt>Hand analysis</dt>
            <dd>Not applicable for this tile count</dd>
          </div>
        )}
        {decomposition && (
          <div>
            <dt>Decomposition</dt>
            <dd>
              {decomposition.sequences.length === 0
                ? '—'
                : decomposition.sequences.map(sequenceRanks).join(', ')};{' '}
              {decomposition.triplets.length === 0
                ? '—'
                : decomposition.triplets.map((rank) => repeatedRank(rank, 3)).join(', ')};{' '}
              {decomposition.pair === undefined ? '—' : repeatedRank(decomposition.pair, 2)}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
