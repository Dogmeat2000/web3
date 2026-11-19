import { createSlice } from '@reduxjs/toolkit'
import type { State } from '@/src/stores/store'

/** This max length ensures the name can be fully shown on the player avatars in game */
export const PLAYER_NAME_MAX_LENGTH: number = 12

/** The cookie that carries the logged-in player's name from the browser to the server. */
export const PLAYER_COOKIE: string = 'player'

/** The identity of the player using this browser, which is undefined until the player logs in. */
export type PlayerState = {
  readonly playerName: string | undefined
}

const init_state: PlayerState = { playerName: undefined }

export const player_slice = createSlice({
  name: 'player',
  initialState: init_state,
  reducers: {},
})

/**
 * Returns the name of the logged-in player, or undefined before the player logs in.
 */
export const selectPlayerName = (state: State): string | undefined => state.player.playerName
