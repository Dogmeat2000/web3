import { play } from '@/graphql/gameConnection.ts'
import { current_game_slice, selectGame, selectGamePassword } from '@/slices/current_game_slice.ts'
import type { Dispatch, GetState } from '@/stores/store'
import type { PublicGame } from '@domain/model/uno.dto.ts'
import { Color } from '@domain/model/deck.ts'

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
