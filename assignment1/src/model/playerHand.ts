import { Card } from "./deck";

export interface PlayerHand {
    readonly cards: Card[]
    addCard(card: Card): void
    removeCard(card: Card): void
}

export class PlayerHandImpl implements PlayerHand {
    private readonly _cards: Card[] = []

    constructor(cards: Card[]) {
        this._cards = [...cards]
    }

    get cards(): Card[] {
        return this._cards
    }

    addCard(card: Card): void {
        this._cards.push(card)
    }

    removeCard(card: Card): void {
        let deletedItems: Card[] = []
        if (this._cards.length > 0)
            deletedItems = this._cards.splice(this._cards.indexOf(card), 1)

        if (deletedItems.length === 0)
            throw new Error(`Cannot remove card ${card}. No cards found on hand.`)
    }
}