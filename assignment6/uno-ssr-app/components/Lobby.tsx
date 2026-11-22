'use client'

import { useState, type SubmitEvent } from 'react'
import { useRouter } from 'next/navigation'
import {selectPlayerName} from '@/src/slices/player_slice'
import GameFooter from '@/components/shared/GameFooter'
import {useDispatch, useSelector} from "react-redux";
import {GameCredentials} from "@domain/model/uno.dto";
import { selectPendingCredentials } from "@/src/slices/pending_game_slice"
import Link from "next/link";
import {CredentialErrors, GAME_NAME_MAX_LENGTH, validateCredentials} from "@/models/GameSettings";
import {Dispatch} from "@/src/stores/store";
import JoinThunk from "@/src/thunks/JoinThunk";
import PrepareHostThunk from "@/src/thunks/PrepareHostThunk";

/**
 * Renders the Lobby form, where the players can connect to games, or host their own.
 */
export default function Lobby() {
    const dispatch: Dispatch = useDispatch();
    const router = useRouter()
    const playerName: string | undefined = useSelector(selectPlayerName)
    const pendingCredentials: GameCredentials | undefined = useSelector(selectPendingCredentials)

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

        void dispatch(JoinThunk(credentials, router)).catch((error: Error): void => setServerError(error.message))
    }

    function host(): void {
        if (!isValid()) {
            return
        }

        void dispatch(PrepareHostThunk(credentials, router))
    }

    return (
        <main className="lobby" id="lobby-screen">
            <section className="modal modal--card" aria-labelledby="lobby-title">
                <Link href="/" className="modal__close" aria-label="Back to choosing your name">
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
