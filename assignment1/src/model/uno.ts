import { Round } from "./round";
import { GameMemento } from "./uno.memento";

export interface Game {
    /**
     * The number of players participating in this game
     */
    readonly playerCount: number;

    /**
     * The score that players must achieve to win the game.
     */
    targetScore: number;

    /**
     * @param playerId The id for the player for which to retrieve their name in this game.
     * @returns The specified players' name.
     */
    player(playerId: number): string


    /**
     * @param playerId The id for the player for which to retrieve their current score in this game.
     * @returns The current score this player has.
     */
    score(playerId: number): number

    /**
     * @returns The winning player's id in this Game, if any. Otherwise, undefined.
     */
    winner(): number | undefined


    /**
     * @returns The current round in play. Undefined if there is no current round.
     */
    currentRound(): Round | undefined


    /**
     * Converts the current Game state into a memento object.
     * @returns The converted memento object
     */
    toMemento(): GameMemento
}
