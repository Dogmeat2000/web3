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
 * Shuffles the cards in a Deck using the provided shuffler, returning the shuffled deck.
 */
export function shuffleCards(cards: Card[], shuffler: Shuffler<Card>): Card[] {
    return shuffler(cards)
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
