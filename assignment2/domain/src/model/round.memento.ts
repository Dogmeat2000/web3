import { Deck } from "./deck";
import { CardMemento, toCard } from "./deck.memento";
import { Round } from "./round";
import { RoundImpl } from "./round.impl";
import { PlayerHand, PlayerHandImpl } from "./playerHand";
import { DeckImpl } from "./deck.impl";
import { Shuffler } from "../utils/random_utils";
import { Card, validColors } from "./card";
import { Color } from "./color";

export type RoundMemento = {
    players: string[],
    hands: CardMemento[][],
    drawPile: CardMemento[],
    discardPile: CardMemento[],
    currentColor: string,
    currentDirection: string,
    dealer: number,
    playerInTurn?: number
}

/**
 * Converts a memento version of a Round into an actual Round type
 * @param data The serialized data to convert into a proper Round type.
 * @param shuffler The shuffler to use for shuffling decks in this Round.
 */
export function toRound(data: RoundMemento, shuffler: Shuffler<Card>): Round {
    const playerNames: string[] = readPlayerNames(data)
    const playerHands: PlayerHand[] = readPlayerHands(data)
    const drawPile: Deck = readDrawPile(data)
    const discardPile: Deck = readDiscardPile(data)
    const currentColor: Color = readCurrentColor(data)
    const currentDirection: string = readCurrentDirection(data)
    const dealer: number = readDealer(data, playerNames)
    const playerInTurn: number | undefined = readCurrentPlayerInTurn(data, playerNames, playerHands)

    const convertedRound: Round = new RoundImpl(playerNames, dealer, shuffler, 0, false)
    convertedRound.modifyRoundState(playerHands, drawPile, discardPile, currentColor, currentDirection, playerInTurn)
    return convertedRound
}

function readPlayerNames(data: RoundMemento): string[] {
    const names: string[] = []

    for (let i = 0; i < data.players.length; i++) {
        names.push(data.players[i])
    }

    return names
}

function readPlayerHands(data: RoundMemento): PlayerHand[] {
    const hands: PlayerHand[]  = []

    for (let i = 0; i < data.players.length; i++) {
        const cards: Card[] = []

        for (const card of data.hands[i]) {
            cards.push(toCard(card))
        }

        hands.push(new PlayerHandImpl(cards))
    }

    return hands
}

function readDrawPile(data: RoundMemento): Deck {
    const readDrawPile: CardMemento[] = data.drawPile
    const convertedCards: Card[] = []

    for (const card of readDrawPile) {
        convertedCards.push(toCard(card))
    }

    return new DeckImpl(convertedCards)
}

function readDiscardPile(data: RoundMemento): Deck {
    const readDiscardPile: CardMemento[] = data.discardPile
    const convertedCards: Card[] = []

    for (const card of readDiscardPile) {
        convertedCards.push(toCard(card))
    }

    // Reversal here to satisfy memento to type conversion specifications as defined in the related unit tests...
    return new DeckImpl(convertedCards.reverse())
}

function readCurrentColor(data: RoundMemento): Color {
    const currentColor: string = data.currentColor

    if(!validColors.includes(currentColor as Color))
        throw new Error(`Invalid color: ${currentColor}`)

    return currentColor as Color
}

function readCurrentDirection(data: RoundMemento): 'clockwise' | 'counterclockwise' {
    const direction = data.currentDirection

    if(direction !== 'clockwise' && direction !== 'counterclockwise')
        throw new Error(`Invalid direction: ${direction}`)

    return direction
}

/**
 * Must pass a playerNames array, as this is used to verify that the extracted dealer id is valid.
 */
function readDealer(data: RoundMemento, playerNames: string[]): number {
    const dealerIndex: number = data.dealer

    if(dealerIndex >= playerNames.length || dealerIndex < 0)
        throw new Error(`Invalid dealer id: ${dealerIndex}`)

    return dealerIndex
}

/**
 * Must pass a players array, as this is used to verify that the extracted current player in turn id is valid.
 */
function readCurrentPlayerInTurn(data: RoundMemento, playerNames: string[], playerHands: PlayerHand[]): number | undefined {
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