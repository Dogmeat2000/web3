import { configureStore } from '@reduxjs/toolkit'
import { player_slice, type PlayerState } from '@/slices/player_slice'

/** The whole client state, one field per slice. */
export type State = {
  player: PlayerState
}

export const store = configureStore<State>({
  reducer: {
    player: player_slice.reducer,
  },
})

export type StoreType = typeof store
export type Dispatch = StoreType['dispatch']
export type GetState = StoreType['getState']
