import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { State } from '@/src/stores/store'
import type { GameCredentials } from '@domain/model/uno.dto.ts'

/** The name and password typed in the lobby for a game about to be hosted; undefined when no game is being set up. */
export type PendingGameState = {
  readonly credentials: GameCredentials | undefined
}

const init_state: PendingGameState = { credentials: undefined }

const pending_game_reducers = {
  hostPrepared(_state: PendingGameState, action: PayloadAction<GameCredentials>): PendingGameState {
    return { credentials: { name: action.payload.name.trim(), password: action.payload.password } }
  },

  hostCleared(): PendingGameState {
    return init_state
  },
}

export const pending_game_slice = createSlice({
  name: 'pendingGame',
  initialState: init_state,
  reducers: pending_game_reducers,
})

/**
 * Returns the name and password carried from the lobby to the host page, or undefined when no game is being set up.
 */
export const selectPendingCredentials = (state: State): GameCredentials | undefined => state.pendingGame.credentials
