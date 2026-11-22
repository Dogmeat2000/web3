import { hostGame } from '@/src/graphql/gameConnection'
import { current_game_slice } from '@/src/slices/current_game_slice'
import { pending_game_slice } from '@/src/slices/pending_game_slice'
import { selectPlayerName } from '@/src/slices/player_slice'
import type { Dispatch, GetState } from '@/src/stores/store'
import LiveUpdateGameThunk from '@/src/thunks/LiveUpdateGameThunk'
import type { GameSettings, PublicGame } from '@domain/model/uno.dto.ts'
import { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>

/**
 * Returns a thunk that hosts a new game with the specified settings, follows its updates and navigates the user to the games page.
 */
export default function HostThunk(gameSettings: GameSettings, router: Router): (dispatch: Dispatch, getState: GetState) => Promise<void> {
  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const playerName: string | undefined = selectPlayerName(getState())

    if (playerName === undefined) {
      throw new Error('Choose a name before hosting a game.')
    }

    const hostedGame: PublicGame = await hostGame(gameSettings, playerName)

    // The host is always the first player.
    dispatch(current_game_slice.actions.gameJoined({ game: hostedGame, password: gameSettings.password, localPlayerId: 0 }))
    dispatch(LiveUpdateGameThunk(gameSettings))

    router.push(`/game/${hostedGame.name}`)
    dispatch(pending_game_slice.actions.hostCleared())
  }
}
