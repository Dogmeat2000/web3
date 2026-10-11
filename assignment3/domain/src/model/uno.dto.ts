import { Color } from "./color";

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
export type PublicGame = {
    id: string,
    name: string,
    playerCount: number,
    targetScore: number,
    joinedPlayers: string[],
    status: GameStatus,

    /** Counts every change to the game. A higher number is a newer game. */
    version: number,

    /** The game, as the GameMemento JSON. */
    state: string,

    /** Includes one value pr. player, indicating which (if any) player has said UNO and which has not. Index positions correspond with playerIds in the game. */
    saidUno: boolean[],

    namedColor: NamedColor | null,
    lastRound: RoundResult | null
}
