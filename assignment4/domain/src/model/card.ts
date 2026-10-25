import {Color} from "./color";

export const validColors: Color[] = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const
export const validCardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

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