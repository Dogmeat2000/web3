import { configureStore } from '@reduxjs/toolkit'
import { player_slice, type PlayerState } from '@/src/slices/player_slice'
import {pending_game_slice, PendingGameState} from "@/src/slices/pending_game_slice";
import {current_game_slice, CurrentGameState} from "@/src/slices/current_game_slice";

/** The whole client state */
export type State = {
  player: PlayerState
  pendingGame: PendingGameState
  currentGame: CurrentGameState
}

/**
 * Returns a new store for one browser, which starts out knowing the player the server read from the cookie.
 * A new store is made for every request on the server, so players never share a store.
 */
export function makeStore(playerName: string | undefined) {
  return configureStore({
    reducer: {
      player: player_slice.reducer,
      pendingGame: pending_game_slice.reducer,
      currentGame: current_game_slice.reducer,
    },
    preloadedState: { player: { playerName }},
  })
}

export type StoreType = ReturnType<typeof makeStore>
export type Dispatch = StoreType['dispatch']
export type GetState = StoreType['getState']
