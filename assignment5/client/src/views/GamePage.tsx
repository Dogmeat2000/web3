import type { Dispatch } from '@/stores/store.ts'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import type { PublicGame, RoundData } from '@domain/model/uno.dto.ts'
import { selectPlayerName } from '@/slices/player_slice.ts'
import { selectGame, selectGamePassword, selectLocalPlayerId } from '@/slices/current_game_slice.ts'
import { useEffect } from 'react'
import PlayerAvatarCard from '@/components/game/PlayerAvatarCard.tsx'

export default function GamePage() {
  const dispatch: Dispatch = useDispatch()
  const navigate = useNavigate()
  const playerName: string | undefined = useSelector(selectPlayerName)
  const game: PublicGame | undefined = useSelector(selectGame)
  const password: string | undefined = useSelector(selectGamePassword)
  const localPlayerId: number | undefined = useSelector(selectLocalPlayerId)

  useEffect((): void => {
    if (playerName === undefined) {
      // Redirect players back to the login page, if they tried accessing this endpoint without choosing a name.
      navigate('/', { replace: true })
    } else if (password === undefined || localPlayerId === undefined) {
      // Redirect players back to the lobby page, if no game was joined.
      navigate('/lobby', { replace: true })
    }
  }, [playerName, game, navigate])

  if (game === undefined || localPlayerId === undefined) {
    return <main>Loading game…</main>
  }

  const seatingPriority = [3, 4, 5, 6, 7, 8, 9, 10, 1, 2]
  const round: RoundData | undefined = game.currentRound ?? undefined
  const nextPlayerId: number | undefined =
    round?.activePlayer === undefined || round.activePlayer === null
      ? undefined
      : (round.activePlayer.playerId + (round.playPassDirection === 'counterclockwise' ? -1 : 1) + round.players.length) % round.players.length

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
        {/*<p v-if="status === 'PENDING'" className="turn" role="status">Waiting for Host to start Game</p>*/}
        {/*<p v-else-if="round" className="turn" role="status">
          Turn: <strong>{ game.player(round.playerInTurn()!) }</strong>
        </p>*/}
        {/*<p v-else className="turn" role="status">Game is Over</p>*/}

        {/* Clicking the draw pile draws a card. */}
        {/*<button className="pile pile--draw" type="button" :disabled="!canDraw" @click="gameStore.drawCard()">
        <img src="@/assets/cards/backs/01-quarters.svg" alt="" />
        <span className="pile__label">Draw</span>
      </button>*/}

        {/* The top card of the discard pile. */}
        {/*<div className="pile pile--discard">
      <img v-if="topCard" :src="getCardUrl(topCard)" alt="" />
      <span className="pile__label">Discard</span>
    </div>*/}

        {/* Start Game button is shown to the host */}
        {/*<div v-if="isHost && status === 'PENDING'" className="start-game">
      <button className="say-uno say-uno--start" type="button" @click="gameStore.startGame()">Start Game</button>
    <p className="start-game__note">Starting locks this game. No one else can join.</p>
  </div>*/}

        {/* Player button to say 'UNO' with */}
        {/*<button v-if="isMyTurn" className="say-uno" type="button" @click="gameStore.sayUno()">Say UNO</button>*/}

        {/* Player button to catch someone who forgot to say 'UNO' */}
        {/*<button v-if="status === 'ACTIVE' && round" className="say-uno say-uno--catch" type="button" @click="gameStore.catchUno()">Catch!</button>*/}

        {/* Local Players side of the table */}
        <p className="you-bar">
          <span>Your Hand</span>
        </p>

        <p className="target-score">
          Target Score: <strong>{game.targetScore}</strong> pts.
        </p>

        {/* Show the Local Players' cards */}
        {/*<PlayerHand v-if="round" :cards="hand" :playable="playable" @play="onCardPlay" />*/}

        {/* Choosing a colour after playing a Wild card. */}
        {/*<ColorPicker v-if="pendingWild !== null" @choose="onColorChoose" />*/}

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
