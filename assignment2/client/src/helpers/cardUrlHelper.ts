import { type Card } from '@domain/model/card.ts'

export function getCardUrl(card: Card): string {
  switch (card.type) {
    case 'WILD':
      return new URL(`../assets/cards/wild.svg`, import.meta.url).href

    case 'WILD DRAW':
      return new URL(`../assets/cards/wild-draw-four.svg`, import.meta.url).href

    case 'REVERSE':
    case 'SKIP':
      return new URL(`../assets/cards/${card.color.toLowerCase()}-${card.type.toLowerCase()}.svg`, import.meta.url).href

    case 'DRAW':
      return new URL(`../assets/cards/${card.color.toLowerCase()}-draw-two.svg`, import.meta.url).href

    case 'NUMBERED':
      return new URL(`../assets/cards/${card.color.toLowerCase()}-${card.number}.svg`, import.meta.url).href
  }
}
