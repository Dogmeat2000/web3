import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'
import { Card, Deck, fromMemento} from "../../src/model/deck";
import { DeckImpl } from "../../src/model/deck.impl";
import { Round } from "../../src/model/round";
import { RoundImpl } from "../../src/model/round.impl";
import {toRound} from "../../src/model/round.memento";

// Fix (or import) these types:
type Game = any

export function createInitialDeck(): Deck {
    return new DeckImpl()
}

export function createDeckFromMemento(cards: Record<string, string | number>[]): Deck {
    return fromMemento(cards)
}

export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export function createRound({
    players, 
    dealer, 
    shuffler = standardShuffler,
    cardsPerPlayer = 7
  }: HandConfig): Round {
    return new RoundImpl(players, dealer, shuffler, cardsPerPlayer)
}

export function createRoundFromMemento(memento: any, shuffler: Shuffler<Card> = standardShuffler): Round {
    return toRound(memento, shuffler)
}

export type GameConfig = {
  players: string[]
  targetScore: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
  cardsPerPlayer: number
}

export function createGame(props: Partial<GameConfig>): Game {
    // TODO: NOT IMPLEMENTED
}

export function createGameFromMemento(memento: any, randomizer: Randomizer = standardRandomizer, shuffler: Shuffler<Card> = standardShuffler): Game {
    // TODO: NOT IMPLEMENTED
}
