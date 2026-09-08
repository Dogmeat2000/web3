import {Card, Color, Deck, validCardNumbers} from "./deck";
import {Shuffler} from "../utils/random_utils";
import {DeckMemento} from "./deck.memento";

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

    top(): Card | undefined {
        return this._cards.at(-1);
    }

    push(card: Card): void {
        this._cards.push(card)
    }

    toMemento(): DeckMemento {
        return this._cards.map(card => ({...card}))
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
            cards.push({ type: 'DRAW', color: color })
        }

        return cards
    }

    private buildWildCardStack(): Card[] {
        const cards: Card[] = []

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
}