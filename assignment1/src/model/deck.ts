import { Shuffler } from "../utils/random_utils";

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
    /**
     * @returns the number of cards present in this deck
     */
    get size(): number

    /**
     * Deals the bottom most card (i.e. index 0) from this deck, removing this Card from the deck.
     * @returns a Card if deck has cards. Otherwise, returns undefined
     */
    deal(): Card | undefined

    /**
     * Shuffles the deck.
     * @argument shuffler The shuffler implementation to use for the shuffling operation.
     */
    shuffle(shuffler: Shuffler<Card>): void

    /**
     * Filters based on the provided predicate and returns a new Deck containing only the filtered cards.
     * @returns The filtered Deck
     */
    filter(pred: (card: Card) => boolean): Deck

    /**
     * TODO Expand descriptions
     * @returns The top-most Card in the Deck.
     */
    top(): Card

    /**
     * Adds a Card to the end (top) of the Deck stack
     */
    push(card: Card): void

    /**
     * Removes the top/last Card from the Array
     */
    //pop(): Card | undefined

    /**
     * TODO Expand descriptions
     */
    toMemento(): void // TODO: NOT IMPLEMENTED
}

/**
 * TODO Expand descriptions
 */
export function hasNumber(card: Card, number: TypedCard<'NUMBERED'>['number']): boolean {
    if(card.type  === 'NUMBERED' || card.type === 'DRAW' || card.type === 'WILD DRAW')
        return card.number === number;

    return false
}

/**
 * TODO Expand descriptions
 */
export function hasColor(card: Card, color: Color): boolean {
    if(card.type  === 'NUMBERED' || card.type === 'DRAW' || card.type === 'REVERSE' || card.type === 'SKIP')
        return card.color === color;

    return false
}

export class DeckImpl implements Deck {
    private readonly _cards: Card[] = []

    constructor(cards : Card[] = this.initializeDeck()) {
        this._cards = [...cards]
    }

    get size(): number {
        return this._cards.length
    }

    deal(): Card | undefined {
        return this._cards.shift()
    }

    shuffle(shuffler: Shuffler<Card>): void {
        shuffler(this._cards)
    }

    filter(pred: (card: Card) => boolean): Deck {
        return new DeckImpl(this._cards.filter(pred))
    }

    top(): Card {
        return this._cards[this.size-1];
    }

    /*pop(): Card | undefined {
        return this._cards.pop();
    }*/

    push(card: Card): void {
        this._cards.push(card)
    }

    toMemento(): void {
        // TODO: NOT IMPLEMENTED
    }

    private initializeDeck(): Card[] {
        // Initialize _cards:
        const redCards: Card[] = this.buildColoredCardStack('RED')
        const greenCards: Card[] = this.buildColoredCardStack('GREEN')
        const blueCards: Card[] = this.buildColoredCardStack('BLUE')
        const yellowCards: Card[] = this.buildColoredCardStack('YELLOW')
        const wildCards: Card[] = this.buildWildCardStack()

        return [...redCards, ...greenCards, ...yellowCards, ...blueCards, ...wildCards]
    }

    private buildColoredCardStack(color: Color): Card[] {
        const cards: Card[] = []

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
            cards.push({ type: 'DRAW', color: color, number: 2})
        }

        return cards
    }

    private buildWildCardStack(): Card[] {
        const cards: Card[] = []

        // Create 4 wild draw _cards:
        for (let i: number = 0; i < 4; i++) {
            cards.push({ type: 'WILD DRAW', number: 4 })
        }

        // Create 4 wild _cards:
        for (let i: number = 0; i < 4; i++) {
            cards.push({ type: 'WILD' })
        }

        return cards
    }
}

new DeckImpl()

