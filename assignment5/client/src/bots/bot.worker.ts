import { type Card, type Color, VALID_COLORS } from '@domain/model/deck.ts'
import type { Player } from '@domain/model/player.ts'
import * as Round from '@domain/model/round.ts'
import type { PublicGame } from '@domain/model/uno.dto.ts'
import { standardShuffler } from '@domain/utils/random_utils.ts'
import type { BotAction } from '@/thunks/PlayBotsThunk.ts'

/** Chance that a bot accuses other players of forgetting to say UNO at the start of their turn. */
const CATCH_UNO_CHANCE: number = 0.6

/** Chance that a bot remembers to say UNO before it plays its second-to-last card. */
const SAY_UNO_CHANCE: number = 0.8

/** How long a bot thinks before it answers, in milliseconds. */
const THINKING_MS: number = 2000

/**
 * The color the bot holds most cards of.
 */
function bestColor(hand: readonly Card[]): Color {
  let best: Color = 'RED'
  let bestCount: number = -1
  for (const color of VALID_COLORS) {
    const count: number = hand.filter((card: Card): boolean => 'color' in card && card.color === color).length

    if (count > bestCount) {
      best = color
      bestCount = count
    }
  }
  return best
}

/**
 * Returns the decision of the bot in turn, for the provided game.
 */
function decide(game: PublicGame): BotAction {
  const round: Round.Round = { ...game.currentRound!, shuffler: standardShuffler }
  // Bot Logic: Read the hand from the list of players:
  const { hand }: Player = round.players[round.activePlayer!.playerId]!

  // Bot Logic: Find the cards on the hand that can legally be played.
  const playable: number[] = hand.map((_card: Card, cardIndex: number): number => cardIndex).filter((cardIndex: number): boolean => Round.canPlay(cardIndex, round))
  const catchUno: boolean = Math.random() < CATCH_UNO_CHANCE

  // Bot Logic: Draw card if there are no playable cards.
  if (playable.length === 0) {
    return { type: 'draw', catchUno, sayUno: false, version: game.version }
  }

  const cardIndex: number = playable[Math.floor(Math.random() * playable.length)]!
  const card: Card = hand[cardIndex]!

  // Bot Logic: Check if selected card is a Wild card. If so, we need to select a color as well.
  const isWild: boolean = card.type === 'WILD' || card.type === 'WILD DRAW'

  // Bot Logic: Say UNO when the card played leaves one card on the hand.
  const sayUno: boolean = hand.length === 2 && Math.random() < SAY_UNO_CHANCE

  return { type: 'play', cardIndex, namedColor: isWild ? bestColor(hand) : undefined, catchUno, sayUno, version: game.version }
}

/**
 * Decides the action a bot should take in a round.
 * It is run only through the host's browser.
 */
onmessage = (event: MessageEvent<PublicGame>): void => {
  setTimeout((): void => postMessage(decide(event.data)), THINKING_MS)
}
