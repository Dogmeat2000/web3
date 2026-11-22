import Game from "@/components/Game";
import { PLAYER_COOKIE } from "@/src/slices/player_slice";
import { cookies } from "next/headers";
import type { PublicGame } from "@domain/model/uno.dto";
import { fetchGame } from "@/src/graphql/gameConnection";
import { redirect } from "next/navigation";
import { GAME_PASSWORD_COOKIE } from "@/src/slices/current_game_slice";

/**
 * The dynamic Game page. This is a server component. The client component is the <Game> component loaded further down in the code.
 *
 * @param params - the route's parameters, holding the game's name
 */
export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id }: { id: string } = await params
    const cookieStore = await cookies()
    const playerName: string | undefined = cookieStore.get(PLAYER_COOKIE)?.value
    const password: string | undefined = cookieStore.get(GAME_PASSWORD_COOKIE)?.value

    const game: PublicGame | undefined = password === undefined ? undefined : await fetchGame({ name: id, password }).catch((): undefined => undefined)
    const localPlayerId: number = game === undefined || playerName === undefined ? -1 : game.joinedPlayers.indexOf(playerName)

    // Redirect players back to the lobby, if the game cannot be found, or they are not part of it.
    if (password === undefined || game === undefined || localPlayerId === -1) {
        redirect('/lobby')
    }

    return <Game joinedGame={{ game, password, localPlayerId }} />
}