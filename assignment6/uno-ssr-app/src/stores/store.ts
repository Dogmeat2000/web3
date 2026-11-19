import { configureStore } from '@reduxjs/toolkit'
import { player_slice, type PlayerState } from '@/src/slices/player_slice'

/** The whole client state */
export type State = {
  player: PlayerState
}

/**
 * Returns a new store for one browser, which starts out knowing the player the server read from the cookie.
 * A new store is made for every request on the server, so players never share a store.
 */
export function makeStore(playerName: string | undefined) {
  return configureStore<State>({
    reducer: {
      player: player_slice.reducer,
    },
    preloadedState: { player: { playerName } },
  })
}

export type StoreType = ReturnType<typeof makeStore>
export type Dispatch = StoreType['dispatch']
export type GetState = StoreType['getState']
