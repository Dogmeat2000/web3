import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { State } from '@/stores/store'

/** This max length ensures the name can be fully shown on the player avatars in game */
export const PLAYER_NAME_MAX_LENGTH: number = 12

/** The identity of the player using this browser, which is undefined until the player logs in. */
export type PlayerState = {
  readonly playerName: string | undefined
}

const init_state: PlayerState = { playerName: undefined }

const player_reducers = {
  loggedIn(_state: PlayerState, action: PayloadAction<string>): PlayerState {
    return { playerName: action.payload.trim().toLowerCase() }
  },
}

export const player_slice = createSlice({
  name: 'player',
  initialState: init_state,
  reducers: player_reducers,
})

/**
 * Returns the name of the logged-in player, or undefined before the player logs in.
 */
export const selectPlayerName = (state: State): string | undefined => state.player.playerName
