'use client'

import { useState, type SubmitEvent } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { PLAYER_COOKIE, PLAYER_NAME_MAX_LENGTH } from '@/src/slices/player_slice'
import GameFooter from '@/components/shared/GameFooter'

/**
 * Renders the login form, where the player chooses the name used in the game.
 */
export default function Login() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState<string>('')
  const [message, setMessage] = useState<string>('')

  function login(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()

    const chosenName: string = playerName.trim().toLowerCase()
    if (chosenName === '') {
      setMessage('Please enter a name')
      return
    }

    Cookies.set(PLAYER_COOKIE, chosenName, { sameSite: 'lax' })
    router.push('/lobby')
  }

  return (
    <main className="login" id="login-screen">
      <section className="modal modal--card">
        <h1 className="modal__title" id="login-title">
          A Game of UNO
        </h1>
        <p className="modal__intro">Choose a name to use in the game.</p>

        <form className="login-form" id="login-form" noValidate onSubmit={login}>
          {/* Player Name */}
          <input
            value={playerName}
            onChange={(event) => {
              setPlayerName(event.target.value)
              setMessage('')
            }}
            className="field"
            id="player-name"
            name="playerName"
            type="text"
            placeholder="Your Name"
            autoComplete="off"
            maxLength={PLAYER_NAME_MAX_LENGTH}
            aria-invalid={message ? 'true' : undefined}
            aria-describedby="form-error"
            required
          />

          {/* Buttons */}
          <button className="btn" type="submit">
            Continue
          </button>
        </form>

        {/* Validation messages */}
        <p className="form-error" id="form-error" role="alert">
          {message}
        </p>

        <GameFooter />
      </section>
    </main>
  )
}
