import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'
import {Card, Deck, DeckImpl} from "../../src/model/deck";

// Fix (or import) these types:
//type Card = any
//type Deck = any
type Round = any
type Game = any

//Fill out the empty functions
export function createInitialDeck(): Deck {
    return new DeckImpl()
}

export function createDeckFromMemento(cards: Record<string, string | number>[]): Deck {
    // TODO: NOT IMPLEMENTED
    return new DeckImpl()
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
    // TODO: NOT IMPLEMENTED
}

export function createRoundFromMemento(memento: any, shuffler: Shuffler<Card> = standardShuffler): Round {
    // TODO: NOT IMPLEMENTED
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
