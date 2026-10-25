import { Card_old } from "./card_old";

export interface PlayerHand_old {
    readonly cards: Card_old[]
    addCard(card: Card_old): void
    removeCard(card: Card_old): void
}

export class PlayerHandImpl implements PlayerHand_old {
    private readonly _cards: Card_old[] = []

    constructor(cards: Card_old[]) {
        this._cards = [...cards]
    }

    get cards(): Card_old[] {
        return this._cards
    }

    addCard(card: Card_old): void {
        this._cards.push(card)
    }

    removeCard(card: Card_old): void {
        let deletedItems: Card_old[] = []
        if (this._cards.length > 0)
            deletedItems = this._cards.splice(this._cards.indexOf(card), 1)

        if (deletedItems.length === 0)
            throw new Error(`Cannot remove card ${card}. No cards found on hand.`)
    }
}