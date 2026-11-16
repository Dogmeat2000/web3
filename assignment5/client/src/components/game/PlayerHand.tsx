import type { Card } from '@domain/model/deck.ts'
import { CSSProperties } from 'react'
import { getCardUrl } from '@/helpers/cardUrlHelper.ts'

type PlayerHandProp = {
  readonly cards: readonly Card[]
  readonly playables: readonly boolean[]
  readonly onPlay: (cardIndex: number) => void
}

export default function PlayerHand({ cards, playables, onPlay }: PlayerHandProp) {
  const handStyle: CSSProperties = { '--cards': cards.length } as CSSProperties

  return (
    <ul className="hand" aria-label="Your-hand" style={handStyle}>
      {cards.map((card: Card, cardIndex: number) => (
        <li key={cardIndex}>
          <button className="hand__card" type="button" disabled={!playables[cardIndex]} onClick={(): void => onPlay(cardIndex)}>
            <img src={getCardUrl(card)} alt="" />
          </button>
        </li>
      ))}
    </ul>
  )
}
