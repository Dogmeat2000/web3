import { useState, type SubmitEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { PLAYER_NAME_MAX_LENGTH } from '@/slices/player_slice'
import type { Dispatch, State } from '@/stores/store'
import LoginThunk from '@/thunks/LoginThunk'
import GameFooter from '@/components/shared/GameFooter.tsx'

export default function LoginPage() {
  const dispatch: Dispatch = useDispatch()
  const navigate = useNavigate()
  const storedName: string | undefined = useSelector((state: State): string | undefined => state.player.playerName)
  const [playerName, setPlayerName] = useState<string>(storedName ?? '')
  const [message, setMessage] = useState<string>('')

  function login(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (playerName.trim() === '') {
      setMessage('Please enter a name')
      return
    }

    void dispatch(LoginThunk(playerName, navigate))
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
