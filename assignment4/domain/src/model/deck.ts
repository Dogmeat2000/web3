import {DeckMemento} from "./deck.memento";
import {Shuffler} from "../utils/random_utils";
import {Deck_old} from "./deck_old";

export const VALID_CARD_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export const VALID_COLORS = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const;

export type Color = typeof VALID_COLORS[number];
export type CardNumber = typeof VALID_CARD_NUMBERS[number];
export type Type = Readonly<Card["type"]>
export type TypedCard<T extends Type> = Readonly<Extract<Card, { readonly type: T }>>

// Generic Card Type
export type Card = Readonly<NumberedCard> |
    Readonly<DrawCard> |
    Readonly<ReverseCard> |
    Readonly<SkipCard> |
    Readonly<WildCard> |
    Readonly<WildDrawCard>

// Concrete Card Types
type NumberedCard = {
    readonly type: 'NUMBERED'
    readonly color: Color
    readonly number: typeof VALID_CARD_NUMBERS[number]
}

type DrawCard = {
    readonly type: 'DRAW'
    readonly color: Color
}

type ReverseCard = {
    readonly type: 'REVERSE'
    readonly color: Color
}

type SkipCard = {
    readonly type: 'SKIP'
    readonly color: Color
}

type WildCard = {
    readonly type: 'WILD'
}

type WildDrawCard = {
    readonly type: 'WILD DRAW'
}

// Pure Functions
/**
 * Checks if the provided value is a Color. Returns true if so. Otherwise, returns false.
 */
export function isColor(value: unknown): value is Color {
    return typeof value === 'string' && (VALID_COLORS as readonly string[]).includes(value);
}

/**
 * Checks if the provided value is a valid Card Number. Returns true if so. Otherwise, returns false.
 */
export function isNumber(value: unknown): value is CardNumber {
    return typeof value === 'number' && (VALID_CARD_NUMBERS as readonly number[]).includes(value);
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
 * Deals the first element of the Deck, returning the dealt card as well as the Deck with the dealt card removed.
 */
export function dealFromDeck(cards: Card[]): { dealtCard: Card, dealtDeck: Card[] } | undefined {
    if(cards.length > 0) {
        return { dealtCard: cards[0], dealtDeck: cards.slice(1)}
    }
    return undefined
}

/**
 * Shuffles the cards in a Deck using the provided shuffler, returning the shuffled deck.
 */
export function shuffle(cards: Card[], shuffler: Shuffler<Card>): Card[] {
    return shuffler(cards)
}

// TODO: Continue from here
filter(pred: (card: Card_old) => boolean): Deck_old {
    return new DeckImpl_old(this._cards.filter(pred))
}

top(): Card_old | undefined {
    return this._cards.at(-1);
}

push(card: Card_old): void {
    this._cards.push(card)
}

toMemento(): DeckMemento {
    return this._cards.map(card => ({...card}))
}

private initializeDeck(): Card_old[] {
    // Initialize _cards:
    const redCards: Card_old[] = this.buildColoredCardStack('RED')
    const greenCards: Card_old[] = this.buildColoredCardStack('GREEN')
    const blueCards: Card_old[] = this.buildColoredCardStack('BLUE')
    const yellowCards: Card_old[] = this.buildColoredCardStack('YELLOW')
    const wildCards: Card_old[] = this.buildWildCardStack()

    return [...redCards, ...greenCards, ...yellowCards, ...blueCards, ...wildCards]
}

private buildColoredCardStack(color: Color_old): Card_old[] {
    const cards: Card_old[] = []

    // Create 19 numbered _cards of this color:
    for (const number of validCardNumbers) {
        cards.push({ type: 'NUMBERED', color: color, number: number }) // UNO has one number 0 card pr. color.

        if(number != 0)
            cards.push({ type: 'NUMBERED', color: color, number: number }) // UNO has 2 of each 1-9 _cards pr. color.
    }

    for (let i: number = 0; i < 2; i++) {
        // Create 2 reverse _cards:
        cards.push({ type: 'REVERSE', color: color })

        // Create 2 skip _cards:
        cards.push({ type: 'SKIP', color: color })

        // Create 2 draw _cards:
        cards.push({ type: 'DRAW', color: color })
    }

    return cards
}

private buildWildCardStack(): Card_old[] {
    const cards: Card_old[] = []

    // Create 4 wild draw _cards:
    for (let i: number = 0; i < 4; i++) {
        cards.push({ type: 'WILD DRAW' })
    }

    // Create 4 wild _cards:
    for (let i: number = 0; i < 4; i++) {
        cards.push({ type: 'WILD' })
    }

    return cards
}



// TODO: FINISH REWRITING THIS!
/**
 * Creates a new Deck object from the specified memento.
 * @param memento A memento containing the serialized deck information.
 * @returns The converted Memento as a Deck type.
 * *//*
export function fromMemento(memento: DeckMemento): Deck {
    return new DeckImpl_old(memento.map(toCard))
}*/