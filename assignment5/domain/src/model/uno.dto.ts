import { Color } from "./deck";
import { Game } from "./uno";
import {Round} from "./round";

/** The name and password of a hosted game. Every request about that game carries them. */
export type GameCredentials = {
    readonly name: string,
    readonly password: string
}

/** All game settings needed to host a game. */
export type GameSettings = Readonly<GameCredentials> & {
    readonly playerCount: number,
    readonly targetScore: number
}

/** Pending games still accept players. Active games are being played. Finished games are over. */
export type GameStatus = 'PENDING' | 'ACTIVE' | 'FINISHED'

/** The color a player named when playing a Wild card. */
export type NamedColor = {
    /**
     * PlayerId of the naming player.
     */
    readonly playerId: number,

    /**
     * Color chosen.
     */
    readonly color: Color
}

/** The round that ended most recently. */
export type RoundResult = {
    /**
     * How many rounds have been played in the game, prior to this.
     */
    readonly roundsPlayed: number,

    /**
     * The playerId of the winner of this Round.
     */
    readonly winner: number,

    /**
     * The score won, in this Round.
     */
    readonly addedScore: number
}

export type RoundData = Readonly<Omit<Round, 'shuffler'>>
export type GameData = Readonly<Omit<Game, 'randomizer' | 'shuffler' | 'currentRound'>> & {
    readonly currentRound: RoundData | undefined
}


/**
 * A hosted game, publicly visible. Therefor the password is not included here, but must be validated against the server, directly.
 */
export type PublicGame = Readonly<GameData> & {
    readonly id: string,
    readonly name: string,

    /**
     * The names of the players who have joined. Index positions correspond with playerIds in the game.
     */
    readonly joinedPlayers: string[],
    readonly status: GameStatus,

    /** Counts every change to the game. A higher number is a newer game. */
    readonly version: number,

    readonly namedColor: NamedColor | null,
    readonly lastRound: RoundResult | null
}
