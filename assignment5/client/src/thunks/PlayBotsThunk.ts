import { catchError, distinctUntilChanged, EMPTY, from, map, type Observable, type Subscription, switchMap } from 'rxjs'
import type { Dispatch } from '@/stores/store'
import type { Color } from '@domain/model/deck.ts'
import type { Player } from '@domain/model/player.ts'
import type { PublicGame } from '@domain/model/uno.dto.ts'
import DrawThunk from '@/thunks/DrawThunk.ts'
import PlayCardThunk from '@/thunks/PlayCardThunk.ts'
import SayUnoThunk from '@/thunks/SayUnoThunk.ts'
import CatchUnoThunk from '@/thunks/CatchUnoThunk.ts'

/** The types of action that a bot may do, along with the version of the game it was decided for. */
export type BotAction = ({ type: 'draw' } | { type: 'play'; cardIndex: number; namedColor?: Color }) & {
  readonly catchUno: boolean
  readonly sayUno: boolean
  readonly version: number
}

/**
 * Returns the player in turn in the provided game, if that player is a bot. Otherwise, returns undefined.
 */
const botInTurn = (workers: ReadonlyMap<number, Worker>, game: PublicGame | undefined): Player | undefined => {
  const player: Player | undefined = game?.status === 'ACTIVE' ? game.currentRound?.activePlayer : undefined
  return player !== undefined && workers.has(player.playerId) ? player : undefined
}

/**
 * Returns the provided game if a bot is in turn in it. Otherwise, returns undefined.
 */
const onlyBotTurns =
  (workers: ReadonlyMap<number, Worker>) =>
  (game: PublicGame | undefined): PublicGame | undefined =>
    botInTurn(workers, game) === undefined ? undefined : game

/**
 * Checks if it is still the same turn, i.e. the same player is in turn, and their hand has not changed.
 * This happens when a bot only says UNO or catches another player, which must not make it decide again.
 */
const isSameTurn = (previous: PublicGame | undefined, next: PublicGame | undefined): boolean => {
  const previousPlayer: Player | undefined = previous?.currentRound?.activePlayer
  const nextPlayer: Player | undefined = next?.currentRound?.activePlayer
  const isSamePlayer: boolean = previousPlayer?.playerId === nextPlayer?.playerId
  const isSameHand: boolean = JSON.stringify(previousPlayer?.hand) === JSON.stringify(nextPlayer?.hand)
  return isSamePlayer && isSameHand
}

/**
 * Asks the specified worker to decide on a move in the provided game, and returns its answer.
 */
const askBot = (worker: Worker, game: PublicGame): Promise<BotAction> =>
  new Promise((resolve): void => {
    const onAnswer = (event: MessageEvent<BotAction>): void => {
      if (event.data.version === game.version) {
        worker.removeEventListener('message', onAnswer)
        resolve(event.data)
      }
    }
    worker.addEventListener('message', onAnswer)
    worker.postMessage(game)
  })

/**
 * Sends the moves of the provided bot action to the server, on behalf of the specified player.
 */
async function takeTurn(dispatch: Dispatch, playerId: number, action: BotAction): Promise<void> {
  if (action.catchUno) {
    await dispatch(CatchUnoThunk(playerId))
  }

  if (action.type === 'draw') {
    await dispatch(DrawThunk(playerId))
  } else {
    if (action.sayUno) {
      await dispatch(SayUnoThunk(playerId))
    }
    await dispatch(PlayCardThunk(playerId, action.cardIndex, action.namedColor))
  }
}

/**
 * Returns a function that plays the turn of the bot in the provided game.
 * The turn is returned as a stream, so that a new turn or a pause can cancel it.
 */
const playBotTurn =
  (dispatch: Dispatch, workers: ReadonlyMap<number, Worker>) =>
  (game: PublicGame | undefined): Observable<void> => {
    const bot: Player | undefined = botInTurn(workers, game)
    if (game === undefined || bot === undefined) {
      return EMPTY
    }

    return from(askBot(workers.get(bot.playerId)!, game)).pipe(
      // Bot Logic: Send the bot's moves to the server, once it has decided:
      switchMap((action: BotAction): Observable<void> => from(takeTurn(dispatch, bot.playerId, action))),

      // Bot Logic: If an error occurs, we just log it, so bots don't die:
      catchError((error: Error): Observable<never> => {
        console.error(error.message)
        return EMPTY
      }),
    )
  }

/**
 * Returns a thunk that lets the bots play their turns in the provided games, until its subscription is stopped.
 */
export default function PlayBotsThunk(games: Observable<PublicGame | undefined>, workers: ReadonlyMap<number, Worker>): (dispatch: Dispatch) => Subscription {
  return (dispatch: Dispatch): Subscription =>
    games
      .pipe(
        // Bot Logic: Ignore games where a human is in turn:
        map(onlyBotTurns(workers)),

        // Bot Logic: Ignore updates within the same turn, such as the bot's own UNO call:
        distinctUntilChanged(isSameTurn),

        // Bot Logic: Play each new turn. A new turn, or a pause, cancels any decision the bot is still making:
        switchMap(playBotTurn(dispatch, workers)),
      )
      .subscribe()
}
