import type { Dispatch } from '@/src/stores/store'
import { useDispatch, useSelector } from 'react-redux'
import type { GameCredentials, GameSettings } from '@domain/model/uno.dto.ts'
import { selectPendingCredentials } from '@/src/slices/pending_game_slice'
import { useState, type SubmitEvent } from 'react'
import { useRouter } from "next/navigation";
import { SettingsErrors, validateGameSettings } from "@/models/GameSettings";
import HostThunk from "@/thunks/HostThunk";
import Link from "next/link";
import GameFooter from "@/components/shared/GameFooter";

const playerCounts: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * Renders the Host form, where the players define settings for a newly hosted game.
 */
export default function Host() {
  const dispatch: Dispatch = useDispatch()
  const router = useRouter()
  const pendingCredentials: GameCredentials | undefined = useSelector(selectPendingCredentials)
  const [isHosting, setIsHosting] = useState<boolean>(false)

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    name: pendingCredentials?.name ?? '',
    password: pendingCredentials?.password ?? '',
    playerCount: 10,
    targetScore: 500,
  })
  const [fieldErrors, setFieldErrors] = useState<SettingsErrors>({})
  const [serverError, setServerError] = useState<string>('')

  if (pendingCredentials === undefined) {
    return null
  }

  const message: string = fieldErrors.name ?? fieldErrors.password ?? fieldErrors.playerCount ?? fieldErrors.targetScore ?? serverError

  function change<Field extends keyof GameSettings>(field: Field, value: GameSettings[Field]): void {
    setGameSettings({ ...gameSettings, [field]: value })
    setFieldErrors({})
    setServerError('')
  }

  function host(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()
    const errors: SettingsErrors = validateGameSettings(gameSettings)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsHosting(true)
    void dispatch(HostThunk(gameSettings, router)).catch((error: Error): void => {
      setIsHosting(false)
      setServerError(error.message)
    })
  }

  return (
    <main className="host" id="host-screen">
      <section className="modal modal--card" aria-labelledby="host-title">
        <Link href="/lobby" className="modal__close" aria-label="Back to lobby">
          ×
        </Link>

        <h1 className="modal__title" id="host-title">
          Host New Game
        </h1>

        {/* Display selected game name and password */}
        <dl className="summary">
          <dt>Game Name</dt>
          <dd>{gameSettings.name}</dd>
          <dt>Password</dt>
          <dd>{gameSettings.password}</dd>
        </dl>

        <form className="host-form" id="host-form" noValidate onSubmit={host}>
          {/* Select Number of Players */}
          <label htmlFor="player-count">
            <b>Number of Players</b>
            <br />2 - 10 players allowed.
          </label>

          <select className="field" id="player-count" value={gameSettings.playerCount} onChange={(event) => change('playerCount', Number(event.target.value))}>
            {playerCounts.map((count: number) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>

          {/* Select Target score */}
          <label htmlFor="target-score">
            <b>Target Score</b>
            <br />
            How many points it takes for a player to win the game.
          </label>

          <input
            value={gameSettings.targetScore}
            onChange={(event) => change('targetScore', Number(event.target.value))}
            className="field"
            id="target-score"
            name="targetScore"
            type="number"
            min="0"
            step="10"
            placeholder="Target Score"
            autoComplete="off"
            aria-invalid={fieldErrors.targetScore ? 'true' : undefined}
            aria-describedby="form-error"
            required
          />

          {/* Buttons */}
          <button className="btn" type="submit">
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
