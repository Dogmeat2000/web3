import { catchUno } from '@/graphql/gameConnection.ts'
import { current_game_slice, selectGame, selectGamePassword } from '@/slices/current_game_slice.ts'
import type { Dispatch, GetState } from '@/stores/store'
import type { PublicGame } from '@domain/model/uno.dto.ts'

/**
 * Returns a thunk that draws a card for the specified player in the current game and stores the server's answer.
 */
export default function CatchUnoThunk(playerId: number): (dispatch: Dispatch, getState: GetState) => Promise<void> {
  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const game: PublicGame | undefined = selectGame(getState())
    const password: string | undefined = selectGamePassword(getState())
    if (game === undefined || password === undefined) {
      throw new Error('Join a game before trying to catch uno falures...')
    }

    const answer: PublicGame = await catchUno({ name: game.name, password }, playerId)
    dispatch(current_game_slice.actions.gameUpdated(answer))
  }
}
