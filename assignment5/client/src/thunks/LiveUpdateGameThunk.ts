import { map, Subject } from 'rxjs'
import { current_game_slice } from '@/slices/current_game_slice.ts'
import type { Dispatch } from '@/stores/store'
import type { GameCredentials, PublicGame } from '@domain/model/uno.dto.ts'
import { subscribeToGame } from '@/graphql/gameConnection.ts'

/**
 * Returns a thunk that feeds every update the server pushes for the specified game into the browsers store.
 */
export default function LiveUpdateGameThunk(credentials: GameCredentials): (dispatch: Dispatch) => void {
  return (dispatch: Dispatch): void => {
    const updates: Subject<PublicGame> = new Subject<PublicGame>()
    updates.pipe(map(current_game_slice.actions.gameUpdated)).subscribe(dispatch)

    subscribeToGame(credentials, (game: PublicGame): void => updates.next(game))
  }
}
