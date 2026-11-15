import { configureStore } from '@reduxjs/toolkit'
import { player_slice, type PlayerState } from '@/slices/player_slice'
import { pending_game_slice, type PendingGameState } from '@/slices/pending_game_slice'
import { current_game_slice, type CurrentGameState } from '@/slices/current_game_slice.ts'

/** The whole client state */
export type State = {
  player: PlayerState
  pendingGame: PendingGameState
  currentGame: CurrentGameState
}

export const store = configureStore<State>({
  reducer: {
    player: player_slice.reducer,
    pendingGame: pending_game_slice.reducer,
    currentGame: current_game_slice.reducer,
  },
})

export type StoreType = typeof store
export type Dispatch = StoreType['dispatch']
export type GetState = StoreType['getState']
