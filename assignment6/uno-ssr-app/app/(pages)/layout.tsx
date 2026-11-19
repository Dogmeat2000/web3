import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import StoreProvider from '@/components/StoreProvider'
import { PLAYER_COOKIE } from '@/src/slices/player_slice'

/**
 * The layout of every page that needs a logged-in player, such as the lobby, the host page and the game.
 * Reading the cookie makes these pages dynamic, so the server renders them on every request.
 */
export default async function PlayerLayout({ children }: Readonly<{ children: ReactNode }>) {
  const playerName: string | undefined = (await cookies()).get(PLAYER_COOKIE)?.value

  if (playerName === undefined || playerName === '') {
    // Redirect players back to the login page, if they tried accessing these pages without choosing a name.
    redirect('/')
  }

  return <StoreProvider playerName={playerName}>{children}</StoreProvider>
}
