import { Deck_old } from "./deck_old";
import { CardMemento, toCard } from "./deck.memento";
import { Round_old } from "./round_old";
import { RoundImpl_old } from "./round.impl_old";
import { PlayerHand_old, PlayerHandImpl } from "./playerHand_old";
import { Player_old } from "./player_old";
import { DeckImpl_old } from "./deck.impl_old";
import { Shuffler } from "../utils/random_utils";
import { Card_old, validColors } from "./card_old";
import { Color_old } from "./color_old";

export type RoundMemento_old = {
    players: string[],
    hands: CardMemento[][],
    drawPile: CardMemento[],
    discardPile: CardMemento[],
    currentColor: string,
    currentDirection: string,
    dealer: number,
    playerInTurn?: number,

    /**
     * One value pr. player, indicating whether that player has said UNO. Index positions correspond with playerIds.
     */
    saidUno?: boolean[],

    /**
     * One value pr. player, indicating whether that player has drawn cards in their turn. Index positions correspond with playerIds.
     */
    hasDrawn?: boolean[]
}

/**
 * Converts a memento version of a Round into an actual Round type
 * @param data The serialized data to convert into a proper Round type.
 * @param shuffler The shuffler to use for shuffling decks in this Round.
 */
export function toRound(data: RoundMemento_old, shuffler: Shuffler<Card_old>): Round_old {
    const playerNames: string[] = readPlayerNames(data)
    const playerHands: PlayerHand_old[] = readPlayerHands(data)
    const drawPile: Deck_old = readDrawPile(data)
    const discardPile: Deck_old = readDiscardPile(data)
    const currentColor: Color_old = readCurrentColor(data)
    const currentDirection: string = readCurrentDirection(data)
    const dealer: number = readDealer(data, playerNames)
    const playerInTurn: number | undefined = readCurrentPlayerInTurn(data, playerNames, playerHands)

    const convertedRound: Round_old = new RoundImpl_old(playerNames, dealer, shuffler, 0, false)
    convertedRound.modifyRoundState(playerHands, drawPile, discardPile, currentColor, currentDirection, playerInTurn)
    readPlayerFlags(data, convertedRound)
    return convertedRound
}

/**
 * Restores which players have said UNO, and which have drawn cards in their turn.
 */
function readPlayerFlags(data: RoundMemento_old, round: Round_old): void {
    for (let i: number = 0; i < data.players.length; i++) {
        const player: Player_old | undefined = round.playerObj(i)

        if(player !== undefined) {
            player.hasSaidUno = data.saidUno?.[i] ?? false
            player.hasDrawnCardInTurn = data.hasDrawn?.[i] ?? false
        }
    }
}

function readPlayerNames(data: RoundMemento_old): string[] {
    const names: string[] = []

    for (let i = 0; i < data.players.length; i++) {
        names.push(data.players[i])
    }

    return names
}

function readPlayerHands(data: RoundMemento_old): PlayerHand_old[] {
    const hands: PlayerHand_old[]  = []

    for (let i = 0; i < data.players.length; i++) {
        const cards: Card_old[] = []

        for (const card of data.hands[i]) {
            cards.push(toCard(card))
        }

        hands.push(new PlayerHandImpl(cards))
    }

    return hands
}

function readDrawPile(data: RoundMemento_old): Deck_old {
    const readDrawPile: CardMemento[] = data.drawPile
    const convertedCards: Card_old[] = []

    for (const card of readDrawPile) {
        convertedCards.push(toCard(card))
    }

    return new DeckImpl_old(convertedCards)
}

function readDiscardPile(data: RoundMemento_old): Deck_old {
    const readDiscardPile: CardMemento[] = data.discardPile
    const convertedCards: Card_old[] = []

    for (const card of readDiscardPile) {
        convertedCards.push(toCard(card))
    }

    // Reversal here to satisfy memento to type conversion specifications as defined in the related unit tests...
    return new DeckImpl_old(convertedCards.reverse())
}

function readCurrentColor(data: RoundMemento_old): Color_old {
    const currentColor: string = data.currentColor

    if(!validColors.includes(currentColor as Color_old))
        throw new Error(`Invalid color: ${currentColor}`)

    return currentColor as Color_old
}

function readCurrentDirection(data: RoundMemento_old): 'clockwise' | 'counterclockwise' {
    const direction = data.currentDirection

    if(direction !== 'clockwise' && direction !== 'counterclockwise')
        throw new Error(`Invalid direction: ${direction}`)

    return direction
}

/**
 * Must pass a playerNames array, as this is used to verify that the extracted dealer id is valid.
 */
function readDealer(data: RoundMemento_old, playerNames: string[]): number {
    const dealerIndex: number = data.dealer

    if(dealerIndex >= playerNames.length || dealerIndex < 0)
        throw new Error(`Invalid dealer id: ${dealerIndex}`)

    return dealerIndex
}

/**
 * Must pass a players array, as this is used to verify that the extracted current player in turn id is valid.
 */
function readCurrentPlayerInTurn(data: RoundMemento_old, playerNames: string[], playerHands: PlayerHand_old[]): number | undefined {
    const playerIndex: number = data.playerInTurn!
    const isRoundFinished: boolean = playerHands.some(hand => hand.cards.length === 0)

    if(playerIndex > playerNames.length || playerIndex < 0)
        throw new Error(`Invalid active player id: ${playerIndex}`)

    if(playerIndex === undefined){
        if(!isRoundFinished){
            throw new Error("Unfinished rounds must have an active player in the turn")
        }
        return undefined
    }

    return playerIndex
}