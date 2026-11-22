import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Subject, type Subscription } from 'rxjs'
import type { Dispatch } from '@/src/stores/store'
import { selectGame, selectLocalPlayerId } from '@/src/slices/current_game_slice'
import type { PublicGame } from '@domain/model/uno.dto.ts'
import PlayBotsThunk from '@/src/thunks/PlayBotsThunk'

/**
 * Plays bots in place of the missing players, in the host's browser only.
 *
 * @param paused - tells whether the bots take a break, such as between rounds.
 */
export function useBots(paused: boolean): void {
  const dispatch: Dispatch = useDispatch()
  const game: PublicGame | undefined = useSelector(selectGame)
  const localPlayerId: number | undefined = useSelector(selectLocalPlayerId)
  const workers = useRef<Map<number, Worker>>(new Map())
  const games = useRef<Subject<PublicGame | undefined>>(new Subject<PublicGame | undefined>())

  // Let the bots play until the page closes:
  useEffect((): (() => void) => {
    const botWorkers: Map<number, Worker> = workers.current
    const subscription: Subscription = dispatch(PlayBotsThunk(games.current, botWorkers))
    return (): void => {
      subscription.unsubscribe()
      botWorkers.forEach((worker: Worker): void => worker.terminate())
      botWorkers.clear()
    }
  }, [dispatch])

  // Start a worker for each empty player slot:
  useEffect((): void => {
    if (workers.current.size > 0 || game?.status !== 'ACTIVE' || localPlayerId !== 0) {
      return
    }
    for (let playerId: number = game.joinedPlayers.length; playerId < game.playerNames.length; playerId++) {
      workers.current.set(playerId, new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' }))
    }
  }, [game, localPlayerId])

  // Update bots as changes happen:
  useEffect((): void => {
    games.current.next(paused ? undefined : game)
  }, [game, paused])
}
