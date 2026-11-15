import type { NavigateFunction } from 'react-router'
import { hostGame } from '@/graphql/gameConnection.ts'
import { current_game_slice } from '@/slices/current_game_slice.ts'
import { pending_game_slice } from '@/slices/pending_game_slice.ts'
import { selectPlayerName } from '@/slices/player_slice.ts'
import type { Dispatch, GetState } from '@/stores/store'
import LiveUpdateGameThunk from '@/thunks/LiveUpdateGameThunk'
import type { GameSettings, PublicGame } from '@domain/model/uno.dto.ts'

/**
 * Returns a thunk that hosts a new game with the specified settings, follows its updates and navigates the user to the games page.
 */
export default function HostThunk(gameSettings: GameSettings, navigate: NavigateFunction): (dispatch: Dispatch, getState: GetState) => Promise<void> {
  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const playerName: string | undefined = selectPlayerName(getState())

    if (playerName === undefined) {
      throw new Error('Choose a name before hosting a game.')
    }

    const hostedGame: PublicGame = await hostGame(gameSettings, playerName)

    // The host is always the first player.
    dispatch(current_game_slice.actions.gameJoined({ game: hostedGame, password: gameSettings.password, localPlayerId: 0 }))
    dispatch(LiveUpdateGameThunk(gameSettings))

    await navigate(`/game/${hostedGame.name}`)

    dispatch(pending_game_slice.actions.hostCleared())
  }
}
