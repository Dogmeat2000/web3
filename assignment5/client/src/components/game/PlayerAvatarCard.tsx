import type { Color } from '@domain/model/deck.ts'
import cardBack from '@/assets/cards/backs/01-quarters.svg'

type PlayerAvatarCardProps = {
  readonly playerId: number
  readonly playerName: string
  readonly cardCount: number
  readonly score: number
  readonly isTurn: boolean
  readonly isNext: boolean
  readonly isLocalPlayer: boolean
  readonly isBot: boolean
  readonly hasSaidUno: boolean
  readonly hasSaidThisColor: Color | undefined
}

export default function PlayerAvatarCard({ playerId, playerName, cardCount, score, isTurn, isNext, isLocalPlayer, isBot, hasSaidUno, hasSaidThisColor }: PlayerAvatarCardProps) {
  const avatar: string = new URL(`../../assets/images/Profile${playerId + 1}.webp`, import.meta.url).href

  return (
    <>
      {/* Display player avatar */}
      <p className="seat__score">Score: {score}</p>

      <article className={`player${isLocalPlayer ? ' player--you' : ''}${isTurn ? ' player--turn' : ''}${isNext ? ' player--next' : ''}`}>
        {/* Display player avatar */}
        <img className="player__avatar" src={avatar} alt={''} />

        {/* Display player name */}
        <h2 className="player__name">{playerName}</h2>

        {/* Show type of player */}
        {isBot && <p className="player__kind">Bot</p>}
        {!isBot && isLocalPlayer && <p>You</p>}
        {!isBot && !isLocalPlayer && <p>Human</p>}

        {/* Show number of cards remaining */}
        <p className="player__cards">
          <img src={cardBack} alt="" />
          {cardCount}
        </p>

        {/* Indicate if it is this players turn */}
        {isTurn && <p className="player__tag">Playing</p>}
        {!isTurn && isNext && <p className="player__tag">Next</p>}

        {/* Indicate if player has said Uno */}
        {hasSaidUno && <p className="player__uno">UNO!</p>}

        {/* Indicate which color, this player has said (if playing a WILD card) */}
        {hasSaidThisColor && <p className="player__uno">{hasSaidThisColor}</p>}
      </article>
    </>
  )
}
