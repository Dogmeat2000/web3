import { onUnmounted, watch, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/gameStore.ts'
import type { Card } from '@domain/model/card.ts'
import type { Color } from '@domain/model/color.ts'
import type { Round } from '@domain/model/round.ts'
import type { PublicGame } from '@domain/model/uno.dto.ts'

type Action = { type: 'draw' } | { type: 'play'; cardIndex: number; namedColor?: Color }

/**
 * Plays bots in place of players on the game creator (hosts) browser.
 *
 * @param paused The bots take a break for as long as this is true.
 */
export function useBots(paused: Ref<boolean>): void {
  const gameStore = useGameStore()
  const { game, hostedGame, localPlayerId } = storeToRefs(gameStore)
  const workers = new Map<number, Worker>()
  let running: boolean = true
  let playing: boolean = false

  /**
   * Spawns a worker for each position in the game not filed by a human player, when the host starts the game.
   */
  function startWorkers(): void {
    const currentGame: PublicGame | null = hostedGame.value

    // There must be workers, game must be active and this script must be run in the hosts browser (i.e. playerId = 0).
    if (workers.size > 0 || currentGame?.status !== 'ACTIVE' || localPlayerId.value !== 0) {
      return
    }

    // The people who joined sit in the first player positions. Bots are only created for the un-filled positions.
    // TODO: I might consider randomly assigning the character a new joining player receives, to increase the fun/challenge a bit.
    for (let playerId = currentGame.joinedPlayers.length; playerId < currentGame.playerCount; playerId++) {
      workers.set(playerId, new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' }))
    }
  }

  function askBot(worker: Worker, hand: Card[], playable: number[]): Promise<Action> {
    return new Promise((resolve): void => {
      worker.onmessage = (event: MessageEvent<Action>): void => resolve(event.data)
      worker.postMessage({ hand, playable })
    })
  }

  /**
   * Plays for the bots, for as long as one of them is in turn.
   */
  async function play(): Promise<void> {
    if (playing) {
      return
    }
    playing = true

    try {
      while (running && !paused.value) {
        const round: Round | undefined = game.value?.currentRound()
        const playerId: number | undefined = round?.playerInTurn()
        const worker: Worker | undefined = playerId === undefined ? undefined : workers.get(playerId)

        if (!round || playerId === undefined || !worker) {
          // It's a human players turn, or the game is over.
          break
        }

        const hand: Card[] = round.playerHand(playerId)
        const playable: number[] = hand.map((_: Card, index: number): number => index).filter((index: number): boolean => round.canPlay(index))
        const action: Action = await askBot(worker, hand, playable)

        // Make sure nothing changed in the round (i.e. player caught another player), that could invalidate this bot's decision:
        const current: Round | undefined = game.value?.currentRound()
        if (!running || current?.playerInTurn() !== playerId || JSON.stringify(current.playerHand(playerId)) !== JSON.stringify(hand)) {
          continue
        }

        if (Math.floor(Math.random() * 100) > 40) {
          // Strategy here is just to accuse everyone, since the domain ensures only the previous player can successfully be accused.
          // 60% Chance of catching a player who didn't say UNO
          await gameStore.catchUno(playerId)
        }

        if (action.type === 'draw') {
          await gameStore.drawCard(playerId)
        } else {
          if (hand.length === 2 && Math.floor(Math.random() * 100) > 20) {
            // 80% Chance of saying Uno
            await gameStore.sayUno(playerId)
          }
          await gameStore.playCard(action.cardIndex, action.namedColor, playerId)
        }
      }
    } finally {
      playing = false
    }
  }

  watch(
    [game, paused],
    (): void => {
      startWorkers()
      void play()
    },
    { immediate: true },
  )

  onUnmounted((): void => {
    running = false
    workers.forEach((worker: Worker): void => worker.terminate())
    workers.clear()
  })
}
