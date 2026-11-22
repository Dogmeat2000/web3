import { draw } from '@/src/graphql/gameConnection'
import { current_game_slice, selectGame, selectGamePassword } from '@/src/slices/current_game_slice'
import type { Dispatch, GetState } from '@/src/stores/store'
import type { PublicGame } from '@domain/model/uno.dto.ts'

/**
 * Returns a thunk that draws a card for the specified player in the current game.
 */
export default function DrawThunk(playerId: number): (dispatch: Dispatch, getState: GetState) => Promise<void> {
  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const game: PublicGame | undefined = selectGame(getState())
    const password: string | undefined = selectGamePassword(getState())
    if (game === undefined || password === undefined) {
      throw new Error('Join a game before drawing.')
    }

    const answer: PublicGame = await draw({ name: game.name, password }, playerId)
    dispatch(current_game_slice.actions.gameUpdated(answer))
  }
}
