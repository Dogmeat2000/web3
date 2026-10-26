import {Shuffler} from "../utils/random_utils";

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
export function shuffleCards(cards: Card[], shuffler: Shuffler<Card>): Card[] {
    return shuffler(cards)
}


/**
 * Filters based on the provided predicate and returns a new Card array containing only the filtered cards.
 * @returns The filtered Cards
 */
export function filterCards(cards: Card[], pred: (card: Card) => boolean): Card[] {
    return [...cards.filter(pred)]
}

/**
 * @returns The top-most Card in the card Array (Deck), or undefined if collection has no cards.
 */
export function topCard(cards: Card[]): Card | undefined {
    return cards.at(-1);
}

/**
 * Adds a Card to the end (top) of the Card (Deck) stack.
 * Returns an array with the card added.
 */
export function pushCard(cards: Card[], newCard: Card): Card[] {
    return [...cards, newCard]
}

/**
 * Initializes a clean/new Uno Card deck.
 */
export function initializeDeck(): Card[] {
    return [
        ...buildColoredCardStack('RED'),
        ...buildColoredCardStack('GREEN'),
        ...buildColoredCardStack('BLUE'),
        ...buildColoredCardStack('YELLOW'),
        ...buildWildCardStack()
    ]
}

function buildColoredCardStack(color: Color): Card[] {
    return [
        // Create 1 x '0' Numbered card:
        { type: 'NUMBERED', color: color, number: 0 } as Card,

        // Create 2 x '1-9' Numbered cards:
        { type: 'NUMBERED', color: color, number: 1 } as Card,
        { type: 'NUMBERED', color: color, number: 1 } as Card,
        { type: 'NUMBERED', color: color, number: 2 } as Card,
        { type: 'NUMBERED', color: color, number: 2 } as Card,
        { type: 'NUMBERED', color: color, number: 3 } as Card,
        { type: 'NUMBERED', color: color, number: 3 } as Card,
        { type: 'NUMBERED', color: color, number: 4 } as Card,
        { type: 'NUMBERED', color: color, number: 4 } as Card,
        { type: 'NUMBERED', color: color, number: 5 } as Card,
        { type: 'NUMBERED', color: color, number: 5 } as Card,
        { type: 'NUMBERED', color: color, number: 6 } as Card,
        { type: 'NUMBERED', color: color, number: 6 } as Card,
        { type: 'NUMBERED', color: color, number: 7 } as Card,
        { type: 'NUMBERED', color: color, number: 7 } as Card,
        { type: 'NUMBERED', color: color, number: 8 } as Card,
        { type: 'NUMBERED', color: color, number: 8 } as Card,
        { type: 'NUMBERED', color: color, number: 9 } as Card,
        { type: 'NUMBERED', color: color, number: 9 } as Card,

        // Create 2 reverse cards:
        { type: 'REVERSE', color: color } as Card,
        { type: 'REVERSE', color: color } as Card,

        // Create 2 skip cards:
        { type: 'SKIP', color: color } as Card,
        { type: 'SKIP', color: color } as Card,

        // Create 2 draw cards:
        { type: 'DRAW', color: color },
        { type: 'DRAW', color: color }
    ]
}

function buildWildCardStack(): Card[] {
    return [
        //Create 4 wild draw _cards:
        { type: 'WILD DRAW' } as Card,
        { type: 'WILD DRAW' } as Card,
        { type: 'WILD DRAW' } as Card,
        { type: 'WILD DRAW' } as Card,

        // Create 4 wild _cards:
        { type: 'WILD' } as Card,
        { type: 'WILD' } as Card,
        { type: 'WILD' } as Card,
        { type: 'WILD' } as Card
    ]
}
