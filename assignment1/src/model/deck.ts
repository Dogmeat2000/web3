import { Shuffler } from "../utils/random_utils";
import { DeckMemento, toCard } from "./deck.memento";
import { DeckImpl } from "./deck.impl";

export const validColors: Color[] = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const
export const validCardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export type Color = 'BLUE' | 'RED' | 'GREEN' | 'YELLOW'
export type Type = Card["type"]
export type TypedCard<T extends Type> = Extract<Card, { type: T }>

// Generic Card Type
export type Card = NumberedCard | DrawCard | ReverseCard | SkipCard | WildCard | WildDrawCard

// Concrete Card Types
type NumberedCard = {
    type: 'NUMBERED'
    color: Color
    number: typeof validCardNumbers[number]
}

type DrawCard = {
    type: 'DRAW'
    color: Color
}

type ReverseCard = {
    type: 'REVERSE'
    color: Color
}

type SkipCard = {
    type: 'SKIP'
    color: Color
}

type WildCard = {
    type: 'WILD'
}

type WildDrawCard = {
    type: 'WILD DRAW'
}

// Deck
export interface Deck {
    /**
     * @returns the number of cards present in this deck
     */
    get size(): number

    /**
     * Deals the bottom most card (i.e. index 0) from this deck, removing this Card from the deck.
     * @returns a Card if deck has cards. Otherwise, returns undefined
     */
    deal(): Card | undefined

    /**
     * Shuffles the deck.
     * @argument shuffler The shuffler implementation to use for the shuffling operation.
     */
    shuffle(shuffler: Shuffler<Card>): void

    /**
     * Filters based on the provided predicate and returns a new Deck containing only the filtered cards.
     * @returns The filtered Deck
     */
    filter(pred: (card: Card) => boolean): Deck

    /**
     * @returns The top-most Card in the Deck.
     */
    top(): Card | undefined

    /**
     * Adds a Card to the end (top) of the Deck stack
     */
    push(card: Card): void

    /**
     * Converts this deck into a Memento type.
     * @returns The memento converted deck as a DeckMemento type.
     */
    toMemento(): DeckMemento
}

/**
 * Checks if the provided card has the specified number.
 * @param card The card to check
 * @param number The number to check for on this card
 * @returns True the card has the provided number. Otherwise, False.
 */
export function hasNumber(card: Card, number: TypedCard<'NUMBERED'>['number']): boolean {
    if(card.type  === 'NUMBERED')
        return card.number === number;

    return false
}

/**
 * Checks if the provided card has the specified color.
 * @param card The card to check
 * @param color The color to check for on this card
 * @returns True the card has the provided number. Otherwise, False.
 */
export function hasColor(card: Card, color: Color): boolean {
    if(card.type  === 'NUMBERED' || card.type === 'DRAW' || card.type === 'REVERSE' || card.type === 'SKIP')
        return card.color === color;

    return false
}

/**
 * Creates a new Deck object from the specified memento.
 * @param memento A memento containing the serialized deck information.
 * @returns The
 * */
export function fromMemento(memento: DeckMemento): Deck {
    return new DeckImpl(memento.map(toCard))
}
