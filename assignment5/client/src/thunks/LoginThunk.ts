import type { Dispatch } from '@reduxjs/toolkit'
import type { NavigateFunction } from 'react-router'
import { player_slice } from '@/slices/player_slice'

/**
 * Returns a thunk that logs the player in under the specified player name and navigates the player to the lobby where games and be joined or hosted.
 */
export default function LoginThunk(playerName: string, navigate: NavigateFunction): (dispatch: Dispatch) => Promise<void> {
  return async (dispatch: Dispatch): Promise<void> => {
    dispatch(player_slice.actions.loggedIn(playerName))
    await navigate('/lobby')
  }
}
