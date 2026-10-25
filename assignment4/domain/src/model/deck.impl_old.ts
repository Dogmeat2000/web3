import { Deck_old } from "./deck_old";
import { Shuffler } from "../utils/random_utils";
import { DeckMemento } from "./deck.memento";
import { Card_old, validCardNumbers } from "./card_old";
import { Color_old } from "./color_old";

export class DeckImpl_old implements Deck_old {
    private readonly _cards: Card_old[] = []

    constructor(cards : Card_old[] = this.initializeDeck()) {
        this._cards = [...cards]
    }

    get size(): number {
        return this._cards.length
    }

    deal(): Card_old | undefined {
        return this._cards.shift()
    }

    shuffle(shuffler: Shuffler<Card_old>): void {
        shuffler(this._cards)
    }

    filter(pred: (card: Card_old) => boolean): Deck_old {
        return new DeckImpl_old(this._cards.filter(pred))
    }

    top(): Card_old | undefined {
        return this._cards.at(-1);
    }

    push(card: Card_old): void {
        this._cards.push(card)
    }

    toMemento(): DeckMemento {
        return this._cards.map(card => ({...card}))
    }

    private initializeDeck(): Card_old[] {
        // Initialize _cards:
        const redCards: Card_old[] = this.buildColoredCardStack('RED')
        const greenCards: Card_old[] = this.buildColoredCardStack('GREEN')
        const blueCards: Card_old[] = this.buildColoredCardStack('BLUE')
        const yellowCards: Card_old[] = this.buildColoredCardStack('YELLOW')
        const wildCards: Card_old[] = this.buildWildCardStack()

        return [...redCards, ...greenCards, ...yellowCards, ...blueCards, ...wildCards]
    }

    private buildColoredCardStack(color: Color_old): Card_old[] {
        const cards: Card_old[] = []

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

    private buildWildCardStack(): Card_old[] {
        const cards: Card_old[] = []

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