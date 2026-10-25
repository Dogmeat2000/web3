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