'use client'

import { useSelector } from 'react-redux'
import { selectPlayerName } from '@/src/slices/player_slice'

/**
 * TODO
 */
export default function LobbyPage() {
  const playerName: string | undefined = useSelector(selectPlayerName)

  return (
    <main className="lobby" id="lobby-screen">
      <section className="modal modal--card">
        <h1 className="modal__title">Welcome, {playerName}</h1>
        <p className="modal__intro">Placeholder.</p>
      </section>
    </main>
  )
}
