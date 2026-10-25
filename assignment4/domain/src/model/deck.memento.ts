import { Card, TypedCard, validCardNumbers, validColors} from "./card";
import { Color } from "./color";

export type CardMemento = Record<string, string | number>
export type DeckMemento = CardMemento[]

/**
 * Converts a memento version of a card into an actual Card type
 */
export function toCard(data: CardMemento): Card {
    switch (data.type) {
        case 'NUMBERED':
            return { type: 'NUMBERED', color: readColor(data), number: readNumber(data) }
        case 'DRAW':
            return { type: 'DRAW', color: readColor(data) }
        case 'SKIP':
            return { type: 'SKIP', color: readColor(data) }
        case 'REVERSE':
            return { type: 'REVERSE', color: readColor(data) }
        case 'WILD':
            return { type: 'WILD' }
        case 'WILD DRAW':
            return { type: 'WILD DRAW' }
        default:
            throw new Error(`Invalid card type: ${data.type}`)
    }
}


function readColor(data: CardMemento): Color {
    const color = data.color
    if(typeof color !== 'string' || !validColors.includes(color as Color)) {
        throw new Error(`Invalid or missing color: ${color}`)
    }
    return color as Color
}


function readNumber(data: CardMemento): TypedCard<'NUMBERED'>['number'] {
    const number = data.number
    if(typeof number !== 'number' || !(validCardNumbers as readonly number[]).includes(number)) {
        throw new Error(`Invalid or missing number: ${number}`)
    }
    return number as TypedCard<'NUMBERED'>['number']
}