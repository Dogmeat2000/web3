import { fetchGame, joinGame } from '@/src/graphql/gameConnection'
import {current_game_slice, GAME_PASSWORD_COOKIE} from '@/src/slices/current_game_slice'
import { selectPlayerName } from '@/src/slices/player_slice'
import type { Dispatch, GetState } from '@/src/stores/store'
import LiveUpdateGameThunk from '@/src/thunks/LiveUpdateGameThunk'
import type { GameCredentials, PublicGame } from '@domain/model/uno.dto.ts'
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie'

type Router = ReturnType<typeof useRouter>

/**
 * Returns a thunk that joins the logged-in player to the specified game, follows its updates and navigates the user to the games page.
 */
export default function JoinThunk(credentials: GameCredentials, router: Router): (dispatch: Dispatch, getState: GetState) => Promise<void> {
  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const playerName: string | undefined = selectPlayerName(getState())

    if (playerName === undefined) {
      throw new Error('Choose a name before joining a game.')
    }

    // Game Logic: If the local user had already joined this game, we don't want them to rejoin as a new player, instead they should join as the player they were already joined as.
    const foundGame: PublicGame = await fetchGame(credentials)
    const joinedGame: PublicGame = foundGame.joinedPlayers.includes(playerName) ? foundGame : await joinGame(credentials, playerName)

    dispatch(current_game_slice.actions.gameJoined({ game: joinedGame, password: credentials.password, localPlayerId: joinedGame.joinedPlayers.indexOf(playerName) }))
    dispatch(LiveUpdateGameThunk(credentials))
    Cookies.set(GAME_PASSWORD_COOKIE, credentials.password, { sameSite: 'lax' })

    router.push(`/game/${joinedGame.name}`)
  }
}
