import {Shuffler, standardShuffler} from "../utils/random_utils";

export const colors: Color[] = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
const validCardNumbers: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
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
    number: 2
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
    number: 4
}

// Deck
export interface Deck {
    size: number
    deal(): Card | undefined
    shuffle(shuffler: Shuffler<Card>): void
    filter(pred: (card: Card) => boolean): Deck
    toMemento(): void // TODO: NOT IMPLEMENTED
}

export function hasNumber(card: Card, number: TypedCard<'NUMBERED'>['number']): boolean {
    if(card.type  === 'NUMBERED' || card.type === 'DRAW' || card.type === 'WILD DRAW')
        return card.number === number;

    return false
}

export function hasColor(card: Card, color: Color): boolean {
    if(card.type  === 'NUMBERED' || card.type === 'DRAW' || card.type === 'REVERSE' || card.type === 'SKIP')
        return card.color === color;

    return false
}

export class DeckImpl implements Deck {
    private readonly cards: Card[] = []

    constructor(cards : Card[] = this.initializeDeck()) {
        this.cards = [...cards]
    }

    get size(): number {
        return this.cards.length
    }

    deal(): Card | undefined {
        return this.cards.pop()
    }

    shuffle(shuffler: Shuffler<Card>): void {
        shuffler(this.cards)
    }

    filter(pred: (card: Card) => boolean): Deck {
        return new DeckImpl(this.cards.filter(pred))
    }

    toMemento(): void {
        // TODO: NOT IMPLEMENTED
    }

    private initializeDeck(): Card[] {
        // Initialize cards:
        const redCards: Card[] = this.buildColoredCardStack('RED')
        const greenCards: Card[] = this.buildColoredCardStack('GREEN')
        const blueCards: Card[] = this.buildColoredCardStack('BLUE')
        const yellowCards: Card[] = this.buildColoredCardStack('YELLOW')
        const wildCards: Card[] = this.buildWildCardStack()

        return [...redCards, ...blueCards, ...yellowCards, ...greenCards, ...wildCards]
    }

    private buildColoredCardStack(color: Color): Card[] {
        const cards: Card[] = []

        // Create 19 numbered cards of this color:
        for (const number of validCardNumbers) {
            cards.push({ type: 'NUMBERED', color: color, number: number }) // UNO has one number 0 card pr. color.

            if(number != 0)
                cards.push({ type: 'NUMBERED', color: color, number: number }) // UNO has 2 of each 1-9 cards pr. color.
        }

        for (let i: number = 0; i < 2; i++) {
            // Create 2 reverse cards:
            cards.push({ type: 'REVERSE', color: color })

            // Create 2 skip cards:
            cards.push({ type: 'SKIP', color: color })

            // Create 2 draw cards:
            cards.push({ type: 'DRAW', color: color, number: 2})
        }

        return cards
    }

    private buildWildCardStack(): Card[] {
        const cards: Card[] = []

        // Create 4 wild draw cards:
        for (let i: number = 0; i < 4; i++) {
            cards.push({ type: 'WILD DRAW', number: 4 })
        }

        // Create 4 wild cards:
        for (let i: number = 0; i < 4; i++) {
            cards.push({ type: 'WILD' })
        }

        return cards
    }
}

new DeckImpl()

