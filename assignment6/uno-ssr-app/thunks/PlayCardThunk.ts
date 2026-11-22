import { play } from '@/src/graphql/gameConnection'
import { current_game_slice, selectGame, selectGamePassword } from '@/src/slices/current_game_slice'
import type { Dispatch, GetState } from '@/src/stores/store'
import type { PublicGame } from '@domain/model/uno.dto.ts'
import { Color } from '@domain/model/deck'

/**
 * Returns a thunk that plays a card for the specified player in the current game.
 */
export default function PlayCardThunk(playerId: number, cardIndex: number, namedColor?: Color): (dispatch: Dispatch, getState: GetState) => Promise<void> {
  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const game: PublicGame | undefined = selectGame(getState())
    const password: string | undefined = selectGamePassword(getState())
    if (game === undefined || password === undefined) {
      throw new Error('Join a game before trying to play cards...')
    }

    const answer: PublicGame = await play({ name: game.name, password }, playerId, cardIndex, namedColor)
    dispatch(current_game_slice.actions.gameUpdated(answer))
  }
}
