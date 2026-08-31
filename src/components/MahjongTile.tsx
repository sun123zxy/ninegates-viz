type MahjongTileProps = {
  rank: number
  className?: string
}

export function MahjongTile({ rank, className = '' }: MahjongTileProps) {
  const position = `${((rank - 1) / 8) * 100}% center`

  return (
    <span
      className={`mahjong-tile ${className}`}
      role="img"
      aria-label={`Rank ${rank}`}
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}mahjong.jpg)`,
        backgroundPosition: position,
      }}
    />
  )
}
