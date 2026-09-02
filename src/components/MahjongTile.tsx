type MahjongTileProps = {
  rank: number
}

const CHINESE_RANKS = [
  '', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二',
]

function rankLabel(rank: number): string {
  return CHINESE_RANKS[rank] ?? String(rank)
}

export function MahjongTile({ rank }: MahjongTileProps) {
  const label = rankLabel(rank)

  return (
    <span className="mahjong-tile" role="img" aria-label={`${label}萬`}>
      <span className="tile-rank" aria-hidden="true">{label}</span>
      <span className="tile-suit" aria-hidden="true">萬</span>
    </span>
  )
}
