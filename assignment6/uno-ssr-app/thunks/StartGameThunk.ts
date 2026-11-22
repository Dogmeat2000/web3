import { startGame } from '@/src/graphql/gameConnection'
import { current_game_slice, selectGame, selectGamePassword } from '@/src/slices/current_game_slice'
import type { Dispatch, GetState } from '@/src/stores/store'
import type { PublicGame } from '@domain/model/uno.dto'

/**
 * Returns a thunk that allows a player to start the game.
 */
export default function StartGameThunk(): (dispatch: Dispatch, getState: GetState) => Promise<void> {
  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const game: PublicGame | undefined = selectGame(getState())
    const password: string | undefined = selectGamePassword(getState())
    if (game === undefined || password === undefined) {
      throw new Error('Join a game before starting.')
    }

    const answer: PublicGame = await startGame({ name: game.name, password })
    dispatch(current_game_slice.actions.gameUpdated(answer))
  }
}
