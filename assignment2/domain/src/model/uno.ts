import { Round } from "./round";
import { GameMemento } from "./uno.memento";

export interface Game {
    /**
     * The number of players participating in this game
     */
    playerCount: number;

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
    score(playerId: number): number | undefined

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

    /**
     * Modifies the state of the Game, allowing for customizing various Game data mid-game. WARNING: Modifying these internal stats might put the Game in an inconsistent state (or be used for cheating!), so use with caution!
     * @param players A hashmap of the modified players for this Game. Key is the playerId, string is the playerName.
     * @param scores A hashmap of the modified player scores. Key is the playerId, number is the adjusted player score.
     * @param targetScore The modified target score for this Game.
     * @param currentRound The modified active Round.
     */
    modifyGameState(players: Record<number, string>,
                    scores: Record<number, number>,
                    targetScore: number,
                    currentRound: Round | undefined): void
}
