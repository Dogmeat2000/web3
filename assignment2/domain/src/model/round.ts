import { Deck } from "./deck";
import { PlayerHand } from "./playerHand";
import { RoundMemento } from "./round.memento";
import { Color } from "./color";
import { Card } from "./card";

/**
 * A Round encapsulates all the logic needed to complete a single round of the Uno game. Each round concludes with a winner (the first player to say uno and put down their last remaining card), as well as a score attributed to the winning player.
 */
export interface Round {
    readonly playerCount: number
    readonly dealer: number

    /**
     * @param playerId The id of player to return.
     * @returns The name of the player with the provided id, or undefined if no player match is found.
     */
    player(playerId: number): string | undefined

    /**
     * Plays the card with the provided index position on the current players hand. If the player names a color, this is also applied - which is primarily used for the WILD cards.
     * @param cardIndex Index position of the card to play from the current players hand (array of cards)
     * @param namedColor Optional: The color the player is naming. Is required for WILD cards. Results in an error if provided with non-wild cards.
     * @returns The card that was played.
     */
    play(cardIndex: number, namedColor?: Color): Card

    /**
     * @param playerId The id of a player.
     * @returns The cards that are currently on the specified players' hand.
     */
    playerHand(playerId: number): Card[]

    /**
     * @return The Discard Pile as a Deck.
     */
    discardPile(): Deck

    /**
     * @return The Draw Pile as a Deck.
     */
    drawPile(): Deck

    /**
     * @return The playerId of the currently active player.
     */
    playerInTurn(): number | undefined

    /**
     * @param cardIndex index number for the card on the players hand to check play eligibility for.
     * @return True if the card on the specified index position in the currently active players hand can be played. Otherwise, returns False.
     */
    canPlay(cardIndex: number): boolean

    /**
     * @return True if any card on the currently active players hand can be played. Otherwise, returns False.
     */
    canPlayAny(): boolean

    /**
     * Draws one or more cards onto the currently active players hand. Resets the amount of cards the next player should draw to 1.
     * Amount of cards drawn depends on the aggregate number of draw cards played by previous players.
     */
    draw(): void

    /**
     * Flags the specified player as having said 'UNO'
     * @param playerId playerID for the player that should be flagged.
     */
    sayUno(playerId: number): void

    /**
     * Check if accused player failed to say UNO and applies punishment if caught by another player.
     * @param players An object containing the playerID's for the accuser and the accused.
     * @returns True if the accused player did in fact fail to say UNO. Otherwise, false.
     */
    catchUnoFailure(players: { accuser: number, accused: number }): boolean

    /**
     * @returns True if this round has ended. This is determined by the presence, or absence of a winner.
     */
    hasEnded(): boolean

    /**
     * @returns The winning player's id in this round, if any. Otherwise, undefined.
     */
    winner(): number | undefined

    /**
     * @returns The score that the winning player gained in this round. Undefined, if the round has not ended yet.
     */
    score(): number | undefined

    /**
     * Callback function that publishes and event containing the winner, when the round ends.
     */
    onEnd(callback: (event: { winner: number }) => void): void

    /**
     * Converts the current Rounds state into a memento object.
     * @returns The converted memento object
     */
    toMemento(): RoundMemento

    /**
     * Modifies the state of the Round, allowing for customizing various Round data mid-round. WARNING: Modifying these internal stats might put the Round in an inconsistent state (or be used for cheating!), so use with caution!
     * @param playerHands Modifies the hands of the specified players. Important: The hands must be arranged in the array, such that their index in the array matches the index/playerId for the exact player to replace/modify the hand of.
     * @param drawPile Replaces the draw pile with the one provided.
     * @param discardPile Replaces the discard pile with the one provided.
     * @param currentColor Changes the active Card color to the one specified.
     * @param currentDirection Changes the currently active direction of play to the one specified (clockwise or counterclockwise)
     * @param playerInTurn Marks the player specified by this index/playerId as the one whose turn it currently is, in this round.
     */
    modifyRoundState(playerHands?: PlayerHand[], drawPile?: Deck, discardPile?: Deck, currentColor?: Color, currentDirection?: string, playerInTurn?: number): void
}
