import {Shuffler } from "../utils/random_utils";
import { Player } from "./player";
import {Card, Color, dealFromDeck, shuffleCards} from "./deck";
import * as deck from "./deck";
import {createInitialDeck} from "../../__test__/utils/test_adapter";

export type Round = {
    readonly players: Player[],
    readonly dealer: Player,
    readonly drawPile: Card[],
    readonly discardPile: Card[],
    readonly shuffler: Shuffler<Card>,
    readonly activeCardColor: Color,
    readonly activePlayer: Player,
    readonly playPassDirection: 'counterclockwise' | 'clockwise',
    readonly noOfCardsPlayerMustDraw: number,
    readonly skipNextPlayer: boolean,
    readonly endCallbacks?: ((event: { winner: number}) => void)[]
    readonly saidUno?: boolean[], //One value pr. player, indicating whether that player has said UNO. Index positions correspond with playerIds.
    readonly hasDrawn?: boolean[] // One value pr. player, indicating whether that player has drawn cards in their turn. Index positions correspond with playerIds.
}

export function createRound(players: string[], dealer: number, shuffler: Shuffler<Card>, cardsPerPlayer: number, initializeFreshRound: boolean = true): Round {
    if(validPlayerCount(players)) {
        return initializeFreshRound ?
            createEmptyRound(players, dealer, shuffler) :
            initializeRoundFromEmpty(
                createEmptyRound(players, dealer, shuffler),
                cardsPerPlayer
            )
    }
}

/**
 * @param round Round to search for the player in.
 * @param playerId The id of player to return.
 * @returns The name of the player with the provided id, or undefined if no player match is found.
 */
export function getPlayerName(round: Round, playerId: number): string | undefined {
    return getPlayerObj(round, playerId)?.playerName
}

/**
 * Returns the player object containing information about this player, from within the specified Round.
 */
export function getPlayerObj(round: Round, playerId: number): Player | undefined {
    if(playerId < 0 || playerId >= round.players.length) {
        throw new Error("Provided PlayerId is outside of index bounds.")
    }
    return round.players.find(p => p.playerId === playerId)
}

/**
 * Plays the card with the provided index position on the active players hand. If the player names a color, this is also applied - which is primarily used for the WILD cards.
 * @param cardIndex Index position of the card to play from the current players hand (array of cards)
 * @param namedColor Optional: The color the player is naming. Is required for WILD cards. Results in an error if provided with non-wild cards.
 * @returns The card that was played.
 */
export function play(cardIndex: number, namedColor?: Color): Card {

}

/**
 * @param playerId The id of a player.
 * @returns The cards that are currently on the specified players' hand.
 */
export function playerHand(playerId: number): Card_old[] {
    //TODO
}

/**
 * @return The Discard Pile as a Deck.
 */
export function discardPile(): Deck_old {
    //TODO
}

/**
 * @return The Draw Pile as a Deck.
 */
export function drawPile(): Deck_old {
    //TODO
}

/**
 * @return The playerId of the currently active player.
 */
export function playerInTurn(): number | undefined {
    //TODO
}

/**
 * @param cardIndex index number for the card on the players hand to check play eligibility for.
 * @return True if the card on the specified index position in the currently active players hand can be played. Otherwise, returns False.
 */
export function canPlay(cardIndex: number): boolean {
    //TODO
}

/**
 * @return True if any card on the currently active players hand can be played. Otherwise, returns False.
 */
export function canPlayAny(): boolean {
    //TODO
}

/**
 * Draws one or more cards onto the currently active players hand. Resets the amount of cards the next player should draw to 1.
 * Amount of cards drawn depends on the aggregate number of draw cards played by previous players.
 */
export function draw(): void {
    //TODO
}

/**
 * Flags the specified player as having said 'UNO'
 * @param playerId playerID for the player that should be flagged.
 */
export function sayUno(playerId: number): void {
    //TODO
}

/**
 * Check if accused player failed to say UNO and applies punishment if caught by another player.
 * @param players An object containing the playerID's for the accuser and the accused.
 * @returns True if the accused player did in fact fail to say UNO. Otherwise, false.
 */
export function catchUnoFailure(players: { accuser: number, accused: number }): boolean {
    //TODO
}

/**
 * @returns True if this round has ended. This is determined by the presence, or absence of a winner.
 */
export function hasEnded(): boolean {
    //TODO
}

/**
 * @returns The winning player's id in this round, if any. Otherwise, undefined.
 */
export function winner(): number | undefined {
    //TODO
}

/**
 * @returns The score that the winning player gained in this round. Undefined, if the round has not ended yet.
 */
export function score(): number | undefined {
    //TODO
}

/**
 * Callback function that publishes and event containing the winner, when the round ends.
 */
export function onEnd(callback: (event: { winner: number }) => void): void {
    //TODO
}

/**
 * Returns the direction of play.
 */
export function playDirection(): 'counterclockwise' | 'clockwise' {
    //TODO
}

/**
 * Converts the current Rounds state into a memento object.
 * @returns The converted memento object
 */
export function toMemento(): RoundMemento_old {
    //TODO
}

/**
 * Modifies the state of the Round, allowing for customizing various Round data mid-round. WARNING: Modifying these internal stats might put the Round in an inconsistent state (or be used for cheating!), so use with caution!
 * @param playerHands Modifies the hands of the specified players. Important: The hands must be arranged in the array, such that their index in the array matches the index/playerId for the exact player to replace/modify the hand of.
 * @param drawPile Replaces the draw pile with the one provided.
 * @param discardPile Replaces the discard pile with the one provided.
 * @param currentColor Changes the active Card color to the one specified.
 * @param currentDirection Changes the currently active direction of play to the one specified (clockwise or counterclockwise)
 * @param playerInTurn Marks the player specified by this index/playerId as the one whose turn it currently is, in this round.
 */
function modifyRoundState(playerHands?: PlayerHand_old[], drawPile?: Deck_old, discardPile?: Deck_old, currentColor?: Color_old, currentDirection?: string, playerInTurn?: number): void {
    //TODO
}

/**
 * Validates if the player count is between 2 and 10 players. Returns true if so, otherwise returns false.
 */
function validPlayerCount(players: string[]): boolean {
    // Game Rule: Rounds in UNO must be played by between 2 and 10 players.
    if(players.length > 10 || players.length < 2) {
        throw new Error(`A round must be played by between 2 to 10 players. Round was attempted to be played with ${players.length} players`)
    }

    return true
}

/**
 * Initializes new players based on the provided player names.
 */
function initializePlayers(players: string[]): Player[] {
    return players.map((name, index) => ({
        playerId: index,
        playerName: name,
        hand: [],
        hasSaidUno: false,
        hasDrawnCardInTurn: false
    }))
}

/**
 * Initializes each Player's hand for the players provided, taking cards from the provided fresh card Deck.
 * Returns the initialized Players with their hands and an array of cards that were not distributed to players.
 */
function initializePlayerHands(players: Player[], cardDeck: Card[], cardsPerPlayer: number): { players: Player[], remainingCards: Card[] } {
    if(players.length * cardsPerPlayer > cardDeck.length){
        throw new Error(`Not enough cards in Card Deck to initialize player hands.`)
    }

    // TODO: CONTINUE FROM HERE
    dealFromDeck(cardDeck)

    let dealerDeck: Deck_old = freshCardDeck
    for (const player of this._players) {
        dealerDeck = this.initializeHand(dealerDeck, player, cardsPerPlayer)

        //
        for (let i: number = 0; i < cardsPerPlayer; i++) {
            const card: Card_old | undefined = dealerDeck.deal()

            if(card !== undefined) {
                player.hand.addCard(card)
                continue
            }


        }
        return dealerDeck
        //
    }
    return dealerDeck
}

/**
 * Creates a barebones empty Round. Unspecified attributes of the Round are initialized as empty or undefined.
 */
function createEmptyRound(players: string[], dealer: number, shuffler: Shuffler<Card>): Round {
    const newPlayers: Player[] = initializePlayers(players)

    return {
        players: newPlayers,
        dealer: newPlayers[dealer],
        drawPile: [],
        discardPile: [],
        shuffler: shuffler,
        activeCardColor: 'BLUE',
        activePlayer: newPlayers[dealer],
        playPassDirection: 'clockwise',
        noOfCardsPlayerMustDraw: 0,
        skipNextPlayer: false
    }
}

/**
 * Initializes a Round from its empty version into clean fresh Round ready to begin playing with.
 */
function initializeRoundFromEmpty(emptyRound: Round, cardsPerPlayer: number ): Round {
    // Game Rule: Shuffle the deck before dealing:
    const newDeck: Card[] = shuffleCards(createInitialDeck(), emptyRound.shuffler)



    // TODO REMOVE THIS OLD CODE
    // Game Rule: Give the players their cards. Leftover cards go to the Draw Pile:
    this._drawPileDeck = this.initializePlayerHands(newDeck, cardsPerPlayer)

    // Game Rule: If the top card of the Discard Pile is a Wild or Wild Draw 4, return it to the Draw Pile and pick another card.
    let card: Card_old | undefined = this._drawPileDeck.deal()
    let attempts: number = 0
    while (card !== undefined && (card.type === 'WILD' || card.type === 'WILD DRAW')){
        if(++attempts > 500)
            throw new Error("Initializing Round failed. Could not find a non-wild card for the discard pile")
        this._drawPileDeck.push(card)
        this._drawPileDeck.shuffle(shuffler)

        // Game Rule: Move the top card to the discard pile to finish setting up the game:
        card = this._drawPileDeck.deal()
    }

    if (card !== undefined && 'color' in card) {
        this._discardPileDeck = new DeckImpl_old([card])
        this._activeCardColor = card.color
    } else {
        throw new Error("Unable to deal card from draw pile. Round can not begin")
    }

    // Apply any effects of the initial discard card:
    switch (card.type) {
        case 'REVERSE':
            this.togglePlayDirection()
            break

        case 'SKIP':
            this._skipNextPlayer = true
            break

        case 'DRAW':
            this._noOfCardsPlayerMustDraw = 2
            this._skipNextPlayer = true
            break
    }
    this.nextPlayer()
}