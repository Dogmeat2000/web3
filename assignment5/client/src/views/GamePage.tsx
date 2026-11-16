import type { Dispatch } from '@/stores/store.ts'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import type { PublicGame } from '@domain/model/uno.dto.ts'
import { selectPlayerName } from '@/slices/player_slice.ts'
import { selectGame, selectGamePassword, selectLocalPlayerId } from '@/slices/current_game_slice.ts'
import { useEffect, useState } from 'react'
import PlayerAvatarCard from '@/components/game/PlayerAvatarCard.tsx'
import { standardShuffler } from '@domain/utils/random_utils.ts'
import * as Round from '@domain/model/round.ts'
import DrawThunk from '@/thunks/DrawThunk.ts'
import cardBack from '@/assets/cards/backs/01-quarters.svg'
import { Card, Color } from '@domain/model/deck.ts'
import { getCardUrl } from '@/helpers/cardUrlHelper.ts'
import StartGameThunk from '@/thunks/StartGameThunk.ts'
import SayUnoThunk from '@/thunks/SayUnoThunk.ts'
import CatchUnoThunk from '@/thunks/CatchUnoThunk.ts'
import PlayerHand from '@/components/game/PlayerHand.tsx'
import PlayCardThunk from '@/thunks/PlayCardThunk.ts'
import ColorPicker from '@/components/game/ColorPicker.tsx'

export default function GamePage() {
  const dispatch: Dispatch = useDispatch()
  const navigate = useNavigate()
  const playerName: string | undefined = useSelector(selectPlayerName)
  const game: PublicGame | undefined = useSelector(selectGame)
  const password: string | undefined = useSelector(selectGamePassword)
  const localPlayerId: number | undefined = useSelector(selectLocalPlayerId)
  const [pendingWild, setPendingWild] = useState<number | undefined>(undefined)

  useEffect((): void => {
    if (playerName === undefined) {
      // Redirect players back to the login page, if they tried accessing this endpoint without choosing a name.
      navigate('/', { replace: true })
    } else if (password === undefined || localPlayerId === undefined) {
      // Redirect players back to the lobby page, if no game was joined.
      navigate('/lobby', { replace: true })
    }
  }, [playerName, password, localPlayerId, navigate])

  if (game === undefined || localPlayerId === undefined) {
    return <main>Loading game…</main>
  }

  const seatingPriority = [3, 4, 5, 6, 7, 8, 9, 10, 1, 2]
  const round: Round.Round | undefined = game.currentRound !== undefined ? { ...game.currentRound, shuffler: standardShuffler } : undefined
  const nextPlayerId: number | undefined =
    round?.activePlayer === undefined || round.activePlayer === null
      ? undefined
      : (round.activePlayer.playerId + (round.playPassDirection === 'counterclockwise' ? -1 : 1) + round.players.length) % round.players.length
  const isMyTurn: boolean = game.status === 'ACTIVE' && round?.activePlayer?.playerId === localPlayerId
  const canDraw: boolean = isMyTurn && round !== undefined && !Round.canPlayAny(round)
  const topCard: Card | undefined = round?.discardPile.at(-1)
  const isHost: boolean = localPlayerId === 0
  const myCards: readonly Card[] = round?.players[localPlayerId]?.hand ?? []
  const myPlayableCardsAtIndex: boolean[] = myCards.map((_card: Card, cardIndex: number) => {
    return round !== undefined && Round.canPlay(cardIndex, round)
  })

  const drawCard = (): void => {
    void dispatch(DrawThunk(localPlayerId)).catch((error: Error): void => console.error(error.message))
  }
  const startGame = (): void => {
    void dispatch(StartGameThunk()).catch((error: Error): void => console.error(error.message))
  }
  const sayUno = (): void => {
    void dispatch(SayUnoThunk(localPlayerId)).catch((error: Error): void => console.error(error.message))
  }

  const catchUno = (): void => {
    void dispatch(CatchUnoThunk(localPlayerId)).catch((error: Error): void => console.error(error.message))
  }

  const playCard = (cardIndex: number): void => {
    if ('color' in myCards[cardIndex]!) {
      void dispatch(PlayCardThunk(localPlayerId, cardIndex)).catch((error: Error): void => console.error(error.message))
    } else {
      setPendingWild(cardIndex)
    }
  }

  const chooseColor = (namedColor: Color): void => {
    if (pendingWild !== undefined) {
      void dispatch(PlayCardThunk(localPlayerId, pendingWild, namedColor)).catch((error: Error): void => console.error(error.message))
      setPendingWild(undefined)
    }
  }

  return (
    <main className="stage-frame" id="game-screen">
      <div className="stage">
        {/* Game name and password, for inviting friends */}
        <dl className="game-info">
          <dt>Game</dt>
          <dd>{game.name}</dd>
          <dt>Password</dt>
          <dd>{password}</dd>
        </dl>

        {/* Players around the table */}
        <ol className="seats" aria-label="Players">
          {game.playerNames.map((playerName: string, playerId: number) => (
            <li key={playerId} className={`seat seat--${seatingPriority[playerId]}`}>
              <PlayerAvatarCard
                playerId={playerId}
                playerName={playerName}
                cardCount={round?.players[playerId]?.hand.length ?? 0}
                score={game.scores[playerId] ?? 0}
                isBot={game.joinedPlayers[playerId] == undefined}
                isTurn={round?.activePlayer?.playerId === playerId}
                isNext={nextPlayerId === playerId}
                isLocalPlayer={playerId === localPlayerId}
                hasSaidThisColor={game.namedColor?.playerId === playerId ? game.namedColor.color : undefined}
                hasSaidUno={round?.players[playerId]?.hasSaidUno ?? false}
              ></PlayerAvatarCard>
            </li>
          ))}
        </ol>

        {/* The table */}
        <div className="turn" role="status">
          {/* Show Pending status if game has not been started */}
          {game.status === 'PENDING' && <p>Waiting for Host to start the Game</p>}

          {/* Show active players name, if game is ongoing */}
          {game.status !== 'PENDING' && round !== undefined && (
            <p>
              Turn: <strong>{round?.activePlayer?.playerName}</strong>
            </p>
          )}

          {/* Show Game Over, when game has ended */}
          {game.status !== 'PENDING' && round === undefined && <p>Game is Over</p>}
        </div>

        {/* Clicking the draw pile draws a card. */}
        <button className="pile pile--draw" type="button" disabled={!canDraw} onClick={drawCard}>
          <img src={cardBack} alt="" />
          <span className="pile__label">Draw</span>
        </button>

        {/* The top card of the discard pile. */}
        <div className="pile pile--discard">
          {topCard !== undefined && <img src={getCardUrl(topCard)} alt="" />}
          <span className="pile__label">Discard</span>
        </div>

        {/* Start Game button is shown to the host */}
        {isHost && game.status === 'PENDING' && (
          <div className="start-game">
            <button className="say-uno say-uno--start" type="button" onClick={startGame}>
              Start Game
            </button>
            <p className="start-game__note">Starting locks this game. No one else can join.</p>
          </div>
        )}

        {/* Player button to say 'UNO' with */}
        {isMyTurn && (
          <button className="say-uno" type="button" onClick={sayUno}>
            Say UNO
          </button>
        )}

        {/* Player button to catch someone who forgot to say 'UNO' */}
        {game.status === 'ACTIVE' && round !== undefined && (
          <button className="say-uno say-uno--catch" type="button" onClick={catchUno}>
            Catch!
          </button>
        )}

        {/* Local Players side of the table */}
        <p className="you-bar">
          <span>Your Hand</span>
        </p>

        <p className="target-score">
          Target Score: <strong>{game.targetScore}</strong> pts.
        </p>

        {/* Show the Local Players' cards */}
        {round !== undefined && <PlayerHand cards={myCards} playables={myPlayableCardsAtIndex} onPlay={playCard}></PlayerHand>}

        {/* Choosing a colour after playing a Wild card. */}
        {pendingWild !== undefined && <ColorPicker onChoose={chooseColor} />}

        {/* End of a round. */}
        {/*<ScoreBoard
      v-if="roundResult && winner === undefined"
      title="Round Winner"
:headline="game.player(roundResult.winner)"
    buttonLabel="Play Next Round"
  :rows="scoreRows"
  :winnerId="roundResult.winner"
  :gained="roundResult.addedScore"
  @close="onContinueClick"
      />*/}

        {/* End of the game. */}
        {/*<ScoreBoard v-if="winner !== undefined" title="Game Over" :headline="`Winner: ${game.player(winner)}`" buttonLabel="Exit" :rows="scoreRows" :winnerId="winner" @close="onExitClick" />*/}
      </div>
    </main>
  )
}
