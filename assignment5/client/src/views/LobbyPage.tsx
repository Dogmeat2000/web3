import { useEffect, useState, type SubmitEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import GameFooter from '@/components/shared/GameFooter.tsx'
import { GAME_NAME_MAX_LENGTH, validateCredentials, type CredentialErrors } from '@/models/GameSettings.ts'
import { selectPendingCredentials } from '@/slices/pending_game_slice.ts'
import { selectPlayerName } from '@/slices/player_slice.ts'
import type { Dispatch } from '@/stores/store.ts'
import JoinThunk from '@/thunks/JoinThunk.ts'
import PrepareHostThunk from '@/thunks/PrepareHostThunk.ts'
import type { GameCredentials } from '@domain/model/uno.dto.ts'

export default function LobbyPage() {
  const dispatch: Dispatch = useDispatch()
  const navigate = useNavigate()
  const playerName: string | undefined = useSelector(selectPlayerName)
  const pendingCredentials: GameCredentials | undefined = useSelector(selectPendingCredentials)

  // Redirect players back to the lobby page, if they tried accessing this endpoint without choosing a name.
  useEffect((): void => {
    if (playerName === undefined) {
      navigate('/', { replace: true })
    }
  }, [playerName, navigate])

  const [credentials, setCredentials] = useState<GameCredentials>({
    name: pendingCredentials?.name ?? '',
    password: pendingCredentials?.password ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState<CredentialErrors>({})
  const [serverError, setServerError] = useState<string>('')

  const message: string = fieldErrors.name ?? fieldErrors.password ?? serverError

  function change(field: keyof GameCredentials, value: string): void {
    setCredentials({ ...credentials, [field]: value })
    setFieldErrors({})
    setServerError('')
  }

  function isValid(): boolean {
    const errors: CredentialErrors = validateCredentials(credentials)
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function join(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (!isValid()) {
      return
    }

    void dispatch(JoinThunk(credentials, navigate)).catch((error: Error): void => setServerError(error.message))
  }

  function host(): void {
    if (!isValid()) {
      return
    }

    void dispatch(PrepareHostThunk(credentials, navigate))
  }

  return (
    <main className="lobby" id="lobby-screen">
      <section className="modal modal--card" aria-labelledby="lobby-title">
        <Link to="/" className="modal__close" aria-label="Back to choosing your name">
          ×
        </Link>

        <h1 className="modal__title" id="lobby-title">
          A Game of UNO
        </h1>

        <p className="modal__intro">
          <strong>Welcome, {playerName}!</strong>
          <br />
          Join a game by entering the name of a hosted game and its password, or host your own game and invite your friends.
        </p>

        <form className="lobby-form" id="lobby-form" noValidate onSubmit={join}>
          {/* Game Name */}
          <input
            value={credentials.name}
            onChange={(event) => change('name', event.target.value)}
            className="field"
            id="game-name"
            name="gameName"
            type="text"
            placeholder="Game Name"
            autoComplete="off"
            maxLength={GAME_NAME_MAX_LENGTH}
            aria-invalid={fieldErrors.name ? 'true' : undefined}
            aria-describedby="form-error"
            required
          />

          {/* Password */}
          <input
            value={credentials.password}
            onChange={(event) => change('password', event.target.value)}
            className="field"
            id="game-password"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="off"
            aria-invalid={fieldErrors.password ? 'true' : undefined}
            aria-describedby="form-error"
            required
          />

          {/* Buttons */}
          <button className="btn" type="submit">
            Join Game
          </button>

          <button className="btn" type="button" onClick={host}>
            Host Game
          </button>
        </form>

        {/* Validation and server messages */}
        <p className="form-error" id="form-error" role="alert">
          {message}
        </p>

        <GameFooter />
      </section>
    </main>
  )
}
