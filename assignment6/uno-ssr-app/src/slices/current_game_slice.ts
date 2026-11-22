import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { State } from '@/src/stores/store'
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

/** A cookie that has the current game's password. Required for F5 page updates to work. */
export const GAME_PASSWORD_COOKIE: string = 'gamePassword'

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
  name: 'currentGame',
  initialState: init_state,
  reducers: current_game_reducers,
})

/**
 * Returns the game this browser has joined or hosted, or undefined before that.
 */
export const selectGame = (state: State): PublicGame | undefined => state.currentGame.game

/**
 * Returns the playerId of the player using this browser in the ongoing game, or undefined before joining.
 */
export const selectLocalPlayerId = (state: State): number | undefined => state.currentGame.localPlayerId

/**
 * Returns the password used to connect to the current game, or undefined if player does not have a current game.
 */
export const selectGamePassword = (state: State): string | undefined => state.currentGame.password
