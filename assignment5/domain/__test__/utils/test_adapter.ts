import { Randomizer, Shuffler, standardShuffler } from '../../src/utils/random_utils'
import * as deck from '../../src/model/deck'
import * as round from '../../src/model/round'
import * as uno from '../../src/model/uno'
import { Card } from "../../src/model/deck";

export function createInitialDeck(): Card[] {
  return deck.initializeDeck()
}

export type RoundProps = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<deck.Card>
  cardsPerPlayer?: number
}

export type Props = {
    players: string[],
    targetScore: number,
    randomizer: Randomizer,
    shuffler: Shuffler<Card>,
    cardsPerPlayer: number
}

export function createRound({
    players, 
    dealer, 
    shuffler = standardShuffler,
    cardsPerPlayer = 7
  }: RoundProps): round.Round {
  return round.createRound(players, dealer, shuffler, cardsPerPlayer)
}

export function createGame({ players, targetScore, randomizer, shuffler, cardsPerPlayer }: Partial<Props>): uno.Game {
  return uno.createGame(players, targetScore, randomizer, shuffler, cardsPerPlayer)
}
