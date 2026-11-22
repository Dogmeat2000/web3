import { Color } from "@domain/model/deck";
import Image from 'next/image'

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

/**
 * Renders the footer.
 */
export default function PlayerAvatarCard({ playerId, playerName, cardCount, score, isTurn, isNext, isLocalPlayer, isBot, hasSaidUno, hasSaidThisColor }: PlayerAvatarCardProps) {
  const avatar: string = `/avatars/Profile${playerId + 1}.webp`
  const cardBack: string = '/cards/backs/01-quarters.svg'

  return (
      <>
        {/* Display player avatar */}
        <p className="seat__score">Score: {score}</p>

        <article className={`player${isLocalPlayer ? ' player--you' : ''}${isTurn ? ' player--turn' : ''}${isNext ? ' player--next' : ''}`}>
          {/* Display player avatar */}
          <Image className="player__avatar" src={avatar} alt={''} width={256} height={256}/>

          {/* Display player name */}
          <h2 className="player__name">{playerName}</h2>

          {/* Show type of player */}
          {isBot && <p className="player__kind">Bot</p>}
          {!isBot && isLocalPlayer && <p>You</p>}
          {!isBot && !isLocalPlayer && <p>Human</p>}

          {/* Show number of cards remaining */}
          <p className="player__cards">
            <Image src={cardBack} alt="" width={244} height={364}/>
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
