import type { NavigateFunction } from 'react-router'
import { pending_game_slice } from '@/slices/pending_game_slice'
import type { Dispatch } from '@/stores/store'
import type { GameCredentials } from '@domain/model/uno.dto.ts'

/**
 * Returns a thunk that keeps the name and password selected in the lobby page, navigates the user to the host page and pre-fills the typed game name and password.
 */
export default function PrepareHostThunk(credentials: GameCredentials, navigate: NavigateFunction): (dispatch: Dispatch) => Promise<void> {
  return async (dispatch: Dispatch): Promise<void> => {
    dispatch(pending_game_slice.actions.hostPrepared(credentials))
    await navigate('/host')
  }
}
