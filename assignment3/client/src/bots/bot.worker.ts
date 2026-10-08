import { type Card, validColors } from '@domain/model/card'
import type { Color } from '@domain/model/color.ts'

onmessage = (event: MessageEvent<{ hand: Card[]; playable: number[] }>) => {
  const { hand, playable } = event.data

  setTimeout(() => {
    // Bot Logic: Draw card if there are no playable cards.
    if (playable.length === 0) {
      postMessage({ type: 'draw' })
      return
    }

    const cardIndex = playable[Math.floor(Math.random() * playable.length)]!

    // Bot Logic: Check if selected card is a Wild card. If so, we need to select a color as well.
    const isWild = !('color' in hand[cardIndex]!)

    postMessage({ type: 'play', cardIndex, namedColor: isWild ? bestColor(hand) : undefined })
  }, 2000)
}

/**
 * The color the bot holds most cards of.
 */
function bestColor(hand: Card[]): Color {
  let best: Color = 'RED'
  let bestCount: number = -1
  for (const color of validColors) {
    const count: number = hand.filter((card) => 'color' in card && card.color === color).length

    if (count > bestCount) {
      best = color
      bestCount = count
    }
  }
  return best
}
