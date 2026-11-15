import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { State } from '@/stores/store'
import type { PublicGame } from '@domain/model/uno.dto.ts'

/** The game this browser has joined or hosted, with what is needed to send moves in it; all undefined before that. */
export type CurrentGameState = {
  readonly game: PublicGame | undefined
  readonly password: string | undefined
  readonly localPlayerId: number | undefined
}

/** What the store learns when this browser joins or hosts a game. */
export type JoinedGame = {
  readonly game: PublicGame
  readonly password: string
  readonly localPlayerId: number
}

const init_state: CurrentGameState = { game: undefined, password: undefined, localPlayerId: undefined }

const current_game_reducers = {
  gameJoined(_state: CurrentGameState, action: PayloadAction<JoinedGame>): CurrentGameState {
    return action.payload
  },

  gameUpdated(state: CurrentGameState, action: PayloadAction<PublicGame>): CurrentGameState {
    const shownGame: PublicGame | undefined = state.game
    if (shownGame === undefined || shownGame.id !== action.payload.id || action.payload.version <= shownGame.version) {
      return state
    }

    return { ...state, game: action.payload }
  },

  gameLeft(): CurrentGameState {
    return init_state
  },
}

export const current_game_slice = createSlice({
  name: 'ongoingGame',
  initialState: init_state,
  reducers: current_game_reducers,
})

/**
 * Returns the game this browser has joined or hosted, or undefined before that.
 */
export const selectGame = (state: State): PublicGame | undefined => state.ongoingGame.game

/**
 * Returns the playerId of the player using this browser in the ongoing game, or undefined before joining.
 */
export const selectLocalPlayerId = (state: State): number | undefined => state.ongoingGame.localPlayerId
