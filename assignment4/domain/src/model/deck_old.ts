import { Shuffler } from "../utils/random_utils";
import { DeckMemento, toCard } from "./deck.memento";
import { DeckImpl_old } from "./deck.impl_old";
import {Card_old, TypedCard} from "./card_old";
import {Color_old} from "./color_old";

// Deck
export interface Deck_old {
    /**
     * @returns the number of cards present in this deck
     */
    get size(): number

    /**
     * Deals the bottom most card (i.e. index 0) from this deck, removing this Card from the deck.
     * @returns a Card if deck has cards. Otherwise, returns undefined
     */
    deal(): Card_old | undefined

    /**
     * Shuffles the deck.
     * @argument shuffler The shuffler implementation to use for the shuffling operation.
     */
    shuffle(shuffler: Shuffler<Card_old>): void

    /**
     * Filters based on the provided predicate and returns a new Deck containing only the filtered cards.
     * @returns The filtered Deck
     */
    filter(pred: (card: Card_old) => boolean): Deck_old

    /**
     * @returns The top-most Card in the Deck.
     */
    top(): Card_old | undefined

    /**
     * Adds a Card to the end (top) of the Deck stack
     */
    push(card: Card_old): void

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
export function hasNumber(card: Card_old, number: TypedCard<'NUMBERED'>['number']): boolean {
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
export function hasColor(card: Card_old, color: Color_old): boolean {
    if(card.type  === 'NUMBERED' || card.type === 'DRAW' || card.type === 'REVERSE' || card.type === 'SKIP')
        return card.color === color;

    return false
}

/**
 * Creates a new Deck object from the specified memento.
 * @param memento A memento containing the serialized deck information.
 * @returns The
 * */
export function fromMemento(memento: DeckMemento): Deck_old {
    return new DeckImpl_old(memento.map(toCard))
}
