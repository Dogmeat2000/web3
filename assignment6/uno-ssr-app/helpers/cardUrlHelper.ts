import { type Card } from '@domain/model/deck'

/**
 * Returns the proper .svg URL associated with each card type, for display in the client.
 */
export function getCardUrl(card: Card): string {
  switch (card.type) {
    case 'WILD':
      return '/cards/wild.svg'

    case 'WILD DRAW':
      return '/cards/wild-draw-four.svg'

    case 'REVERSE':
    case 'SKIP':
      return `/cards/${card.color.toLowerCase()}-${card.type.toLowerCase()}.svg`

    case 'DRAW':
      return `/cards/${card.color.toLowerCase()}-draw-two.svg`

    case 'NUMBERED':
      return `/cards/${card.color.toLowerCase()}-${card.number}.svg`
  }
}
