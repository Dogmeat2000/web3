'use client'

import type { Dispatch } from '@/src/stores/store'
import { useDispatch, useSelector } from 'react-redux'
import type {PublicGame, RoundResult} from '@domain/model/uno.dto'
import {useEffect, useState} from 'react'
import { useRouter } from "next/navigation";
import {current_game_slice, JoinedGame, selectGame, selectGamePassword, selectLocalPlayerId} from "@/src/slices/current_game_slice";
import { standardShuffler } from "@domain/utils/random_utils"
import * as Round from '@domain/model/round'
import {Card, Color} from "@domain/model/deck";
import {Player} from "@domain/model/player";
import {ScoreRow} from "@/models/ScoreRow";
import DrawThunk from "@/src/thunks/DrawThunk";
import StartGameThunk from "@/src/thunks/StartGameThunk"
import PlayCardThunk from "@/src/thunks/PlayCardThunk";
import SayUnoThunk from "@/src/thunks/SayUnoThunk";
import CatchUnoThunk from "@/src/thunks/CatchUnoThunk";
import {getCardUrl} from "@/helpers/cardUrlHelper";
import Image from 'next/image'
import PlayerAvatarCard from "@/components/game/PlayerAvatarCard";
import PlayerHand from "@/components/game/PlayerHand";
import ColorPicker from "@/components/game/ColorPicker";
import ScoreBoard from "@/components/game/ScoreBoard";
import {useBots} from "@/bots/useBots";
import LiveUpdateGameThunk from "@/src/thunks/LiveUpdateGameThunk";

/**
 * Renders the Game page, where the players play the game.
 */
export default function Game({ joinedGame }: { joinedGame: JoinedGame }) {
    const dispatch: Dispatch = useDispatch()
    const router = useRouter()
    const storedGame: PublicGame | undefined = useSelector(selectGame)
    const game: PublicGame = storedGame ?? joinedGame.game
    const password: string = useSelector(selectGamePassword) ?? joinedGame.password
    const localPlayerId: number = useSelector(selectLocalPlayerId) ?? joinedGame.localPlayerId
    const isStoreEmpty: boolean = storedGame === undefined
    const [pendingWild, setPendingWild] = useState<number | undefined>(undefined)
    const [dismissedRoundScores, setDismissedRoundScores] = useState<number>(game?.lastRound?.roundsPlayed ?? 0)

    // The round that just ended. Its scoreboard is shown in every browser, until it is closed there.
    const roundResult: RoundResult | undefined = game.lastRound != null && game.lastRound.roundsPlayed > dismissedRoundScores ? game.lastRound : undefined

    // Bots run on the host player's browser. They are paused between rounds.
    useBots(roundResult !== undefined)

    useEffect((): void => {
        if (isStoreEmpty) {
            dispatch(current_game_slice.actions.gameJoined(joinedGame))
            dispatch(LiveUpdateGameThunk({ name: joinedGame.game.name, password: joinedGame.password }))
        }
    }, [dispatch, joinedGame, isStoreEmpty])

    const seatingPriority = [3, 4, 5, 6, 7, 8, 9, 10, 1, 2]
    const round: Round.Round | undefined = game.currentRound != null ? { ...game.currentRound, shuffler: standardShuffler } : undefined
    const nextPlayerId: number | undefined =
        round?.activePlayer === undefined || round.activePlayer === null
            ? undefined
            : (round.activePlayer.playerId + (round.playPassDirection === 'counterclockwise' ? -1 : 1) + round.players.length) % round.players.length
    const isMyTurn: boolean = game.status === 'ACTIVE' && round?.activePlayer?.playerId === localPlayerId
    const canDraw: boolean = isMyTurn && round !== undefined && !Round.canPlayAny(round)
    const topCard: Card | undefined = round?.discardPile.at(-1)
    const isHost: boolean = localPlayerId === 0
    const myCards: readonly Card[] = round?.players[localPlayerId]?.hand ?? []
    const myPlayableCardsAtIndex: boolean[] = myCards.map((_card: Card, cardIndex: number) => {
        return isMyTurn && round !== undefined && Round.canPlay(cardIndex, round)
    })
    const winner: Player | undefined = game.winner ?? undefined
    const cardBack: string = '/cards/backs/01-quarters.svg'

    // All players, with the highest score first.
    const scoreRows: ScoreRow[] = game.playerNames
        .map((name: string, playerId: number): ScoreRow => ({ playerId, name, score: game.scores[playerId] ?? 0, isLocalPlayer: playerId === localPlayerId }))
        .sort((a: ScoreRow, b: ScoreRow): number => b.score - a.score)

    const continueToNextRound = (): void => {
        setDismissedRoundScores(game.lastRound?.roundsPlayed ?? 0)
    }

    const exitGame = (): void => {
        router.push('/lobby')
    }

    const drawCard = (): void => {
        void dispatch(DrawThunk(localPlayerId)).catch((error: Error): void => console.error(error.message))
    }
    const startGame = (): void => {
        void dispatch(StartGameThunk()).catch((error: Error): void => console.error(error.message))
    }
    const sayUno = (): void => {
        void dispatch(SayUnoThunk(localPlayerId)).catch((error: Error): void => console.error(error.message))
    }

    const catchUno = (): void => {
        void dispatch(CatchUnoThunk(localPlayerId)).catch((error: Error): void => console.error(error.message))
    }

    const playCard = (cardIndex: number): void => {
        const card: Card = myCards[cardIndex]!
        if (card.type === 'WILD' || card.type === 'WILD DRAW') {
            setPendingWild(cardIndex)
        } else {
            void dispatch(PlayCardThunk(localPlayerId, cardIndex)).catch((error: Error): void => console.error(error.message))
        }
    }

    const chooseColor = (namedColor: Color): void => {
        if (pendingWild !== undefined) {
            void dispatch(PlayCardThunk(localPlayerId, pendingWild, namedColor)).catch((error: Error): void => console.error(error.message))
            setPendingWild(undefined)
        }
    }

    return (
        <main className="stage-frame" id="game-screen">
            <div className="stage">
                {/* Game name and password, for inviting friends */}
                <dl className="game-info">
                    <dt>Game</dt>
                    <dd>{game.name}</dd>
                    <dt>Password</dt>
                    <dd>{password}</dd>
                </dl>

                {/* Players around the table */}
                <ol className="seats" aria-label="Players">
                    {game.playerNames.map((playerName: string, playerId: number) => (
                        <li key={playerId} className={`seat seat--${seatingPriority[playerId]}`}>
                            <PlayerAvatarCard
                                playerId={playerId}
                                playerName={playerName}
                                cardCount={round?.players[playerId]?.hand.length ?? 0}
                                score={game.scores[playerId] ?? 0}
                                isBot={game.joinedPlayers[playerId] == undefined}
                                isTurn={round?.activePlayer?.playerId === playerId}
                                isNext={nextPlayerId === playerId}
                                isLocalPlayer={playerId === localPlayerId}
                                hasSaidThisColor={game.namedColor?.playerId === playerId ? game.namedColor.color : undefined}
                                hasSaidUno={round?.players[playerId]?.hasSaidUno ?? false}
                            ></PlayerAvatarCard>
                        </li>
                    ))}
                </ol>

                {/* The table */}
                <div className="turn" role="status">
                    {/* Show Pending status if game has not been started */}
                    {game.status === 'PENDING' && <p>Waiting for Host to start the Game</p>}

                    {/* Show active players name, if game is ongoing */}
                    {game.status !== 'PENDING' && round !== undefined && (
                        <p>
                            Turn: <strong>{round?.activePlayer?.playerName}</strong>
                        </p>
                    )}

                    {/* Show Game Over, when game has ended */}
                    {game.status !== 'PENDING' && round === undefined && <p>Game is Over</p>}
                </div>

                {/* Clicking the draw pile draws a card. */}
                <button className="pile pile--draw" type="button" disabled={!canDraw} onClick={drawCard}>
                    <Image src={cardBack} alt="" width={244} height={364}/>
                    <span className="pile__label">Draw</span>
                </button>

                {/* The top card of the discard pile. */}
                <div className="pile pile--discard">
                    {topCard !== undefined && <Image src={getCardUrl(topCard)} alt="" width={244} height={364}/>}
                    <span className="pile__label">Discard</span>
                </div>

                {/* Start Game button is shown to the host */}
                {isHost && game.status === 'PENDING' && (
                    <div className="start-game">
                        <button className="say-uno say-uno--start" type="button" onClick={startGame}>
                            Start Game
                        </button>
                        <p className="start-game__note">Starting locks this game. No one else can join.</p>
                    </div>
                )}

                {/* Player button to say 'UNO' with */}
                {isMyTurn && (
                    <button className="say-uno" type="button" onClick={sayUno}>
                        Say UNO
                    </button>
                )}

                {/* Player button to catch someone who forgot to say 'UNO' */}
                {game.status === 'ACTIVE' && round !== undefined && (
                    <button className="say-uno say-uno--catch" type="button" onClick={catchUno}>
                        Catch!
                    </button>
                )}

                {/* Local Players side of the table */}
                <p className="you-bar">
                    <span>Your Hand</span>
                </p>

                <p className="target-score">
                    Target Score: <strong>{game.targetScore}</strong> pts.
                </p>

                {/* Show the Local Players' cards */}
                {round !== undefined && <PlayerHand cards={myCards} playables={myPlayableCardsAtIndex} onPlay={playCard}></PlayerHand>}

                {/* Choosing a color after playing a Wild card. */}
                {pendingWild !== undefined && <ColorPicker onChoose={chooseColor} />}

                {/* End of a round. */}
                {roundResult !== undefined && winner === undefined && (
                    <ScoreBoard
                        title="Round Winner"
                        headline={game.playerNames[roundResult.winner] ?? ''}
                        buttonLabel="Play Next Round"
                        rows={scoreRows}
                        winnerId={roundResult.winner}
                        gained={roundResult.addedScore}
                        onClose={continueToNextRound}
                    />
                )}

                {/* End of the game. */}
                {winner !== undefined && <ScoreBoard title="Game Over" headline={`Winner: ${winner.playerName}`} buttonLabel="Exit" rows={scoreRows} winnerId={winner.playerId} onClose={exitGame} />}
            </div>
        </main>
    )
}
