import { Color } from "./color";
import { GameMemento } from "./uno.memento";

/** The name and password of a hosted game. Every request about that game carries them. */
export type GameCredentials = {
    name: string,
    password: string
}

/** All game settings needed to host a game. */
export type GameSettings = GameCredentials & {
    playerCount: number,
    targetScore: number
}

/** Pending games still accept players. Active games are being played. Finished games are over. */
export type GameStatus = 'PENDING' | 'ACTIVE' | 'FINISHED'

/** The color a player named when playing a Wild card. */
export type NamedColor = {
    /**
     * PlayerId of the naming player.
     */
    playerId: number,

    /**
     * Color chosen.
     */
    color: Color
}

/** The round that ended most recently. */
export type RoundResult = {
    /**
     * How many rounds have been played in the game, prior to this.
     */
    roundsPlayed: number,

    /**
     * The playerId of the winner of this Round.
     */
    winner: number,

    /**
     * The score won, in this Round.
     */
    addedScore: number
}

/**
 * A hosted game, publicly visible. Therefor the password is not included here, but must be validated against the server, directly.
 */
export type PublicGame = GameMemento & {
    id: string,
    name: string,

    /**
     * The names of the players who have joined. Index positions correspond with playerIds in the game.
     */
    joinedPlayers: string[],
    status: GameStatus,

    /** Counts every change to the game. A higher number is a newer game. */
    version: number,

    namedColor: NamedColor | null,
    lastRound: RoundResult | null
}
