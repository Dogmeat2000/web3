import {Color_old} from "./color_old";

export const validColors: Color_old[] = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const
export const validCardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export type Type = Card_old["type"]
export type TypedCard<T extends Type> = Extract<Card_old, { type: T }>

// Generic Card Type
export type Card_old = NumberedCard | DrawCard | ReverseCard | SkipCard | WildCard | WildDrawCard

// Concrete Card Types
type NumberedCard = {
    type: 'NUMBERED'
    color: Color_old
    number: typeof validCardNumbers[number]
}

type DrawCard = {
    type: 'DRAW'
    color: Color_old
}

type ReverseCard = {
    type: 'REVERSE'
    color: Color_old
}

type SkipCard = {
    type: 'SKIP'
    color: Color_old
}

type WildCard = {
    type: 'WILD'
}

type WildDrawCard = {
    type: 'WILD DRAW'
}