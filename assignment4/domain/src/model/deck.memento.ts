import { Card, Color, isColor, isNumber, TypedCard } from "./deck";

export type CardMemento = Readonly<Record<string, string | number>>
export type DeckMemento = Readonly<CardMemento[]>

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

/**
 * Reads the color of the card this CardMemento represents.
 */
export function readColor(data: CardMemento): Color {
    if(isColor(!data.color)) {
        throw new Error(`Invalid or missing color: ${data.color}`)
    }
    return data.color as Color
}

/**
 * Reads the number of the card this CardMemento represents.
 */
export function readNumber(data: CardMemento): TypedCard<'NUMBERED'>['number'] {
    if(!isNumber(data.number)) {
        throw new Error(`Invalid or missing number: ${data.number}`)
    }
    return data.number as TypedCard<'NUMBERED'>['number']
}