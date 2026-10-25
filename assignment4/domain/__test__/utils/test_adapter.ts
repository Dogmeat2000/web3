import { Shuffler, standardShuffler } from './random_utils'
import * as deck from '../../src/model/deck_old'
import * as round from '../../src/model/round_old'
import * as uno from '../../src/model/uno'

export function createInitialDeck(): deck.Deck_old {
  return deck.createInitialDeck()
}

export type RoundProps = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<deck.Card>
  cardsPerPlayer?: number
}

export function createRound({
    players, 
    dealer, 
    shuffler = standardShuffler,
    cardsPerPlayer = 7
  }: RoundProps): round.Round_old {
  return round.createRound(players, dealer, shuffler, cardsPerPlayer)
}

export function createGame(props: Partial<uno.Props>): uno.Game {
  return uno.createGame(props)
}
