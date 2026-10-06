<script setup lang="ts">
import PlayerAvatarCard from '@/components/game/PlayerAvatarCard.vue'
import ScoreBoard from '@/components/game/ScoreBoard.vue'
import { useGameStore } from '@/stores/gameStore.ts'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, triggerRef } from 'vue'
import { getCardUrl } from '@/helpers/cardUrlHelper.ts'
import { useRouter } from 'vue-router'
import type { Color } from '@domain/model/color.ts'
import { type Card } from '@domain/model/card.ts'
import type { ScoreRow } from '@/models/ScoreRow.ts'

type Action = { type: 'draw' } | { type: 'play'; cardIndex: number; namedColor?: Color }

const router = useRouter()
const gameStore = useGameStore()
const { game, localPlayerId, settings /*, error: gameError*/ } = storeToRefs(gameStore)
const playerIds = computed(() => (game.value ? Array.from({ length: game.value.playerCount }, (_, id) => id) : []))
const seatingPriority = [3, 4, 5, 6, 7, 8, 9, 10, 1, 2]
const workers = new Map<number, Worker>()
let running = true
let resolveHuman: ((action: Action) => void) | null = null
const pendingWild = ref<number | null>(null) // index of a Wild waiting for a color
const chosenWildColor = new Map<number, Color | undefined>() // Key/Value pair, number is playerId and any color that player might have said after playing a Wild card.
const roundResult = ref<{ winner: number; gained: number } | null>(null) // Set when a round ends. Shows the scoreboard until it is closed.
let resolveContinue: (() => void) | null = null

// All players, with the highest score first.
const scoreRows = computed<ScoreRow[]>(() =>
  playerIds.value.map((id) => ({ playerId: id, name: game.value!.player(id), score: game.value!.score(id) ?? 0, isLocalPlayer: id === localPlayerId.value })).sort((a, b) => b.score - a.score),
)

if (game.value === null) {
  router.replace({ name: 'lobby' })
}

/**
 * Responsible for controlling/looping through the game.
 */
async function gameLoop(): Promise<void> {
  while (running) {
    const round = game.value?.currentRound()
    const playerId = round?.playerInTurn()
    if (!round || playerId === undefined) {
      // Game Over
      break
    }

    // Checks if current player is a bot, or not.
    const worker = workers.get(playerId)
    const isBot = worker !== undefined

    const hand = round.playerHand(playerId)
    const playable = hand.map((_, index) => index).filter((index) => round.canPlay(index))

    // Wait for either bot or human to make a move
    const action = worker ? await askBot(worker, hand, playable) : await waitForHuman()

    if (!running) {
      // Game is over
      break
    }

    try {
      if (action.type === 'draw') {
        round.draw()
      } else {
        if (isBot && hand.length === 2 && Math.floor(Math.random() * 100) > 20) {
          // 80% Chance of saying Uno
          round.sayUno(playerId)
        }
        round.play(action.cardIndex, action.namedColor)
        chosenWildColor.clear()

        if (action.namedColor !== undefined) {
          chosenWildColor.set(playerId, action.namedColor)
        }
      }
    } catch (e) {
      console.warn(e) // illegal move: the same player is asked again
    }
    triggerRef(game)

    if (round.hasEnded()) {
      chosenWildColor.clear()
      roundResult.value = { winner: round.winner()!, gained: round.score() ?? 0 }

      if (game.value!.winner() !== undefined) {
        // Game Over
        break
      }

      await waitForContinue()
    }
  }
}

function askBot(worker: Worker, hand: Card[], playable: number[]): Promise<Action> {
  return new Promise((resolve) => {
    worker.onmessage = (event: MessageEvent<Action>) => resolve(event.data)
    worker.postMessage({ hand, playable })
  })
}

function waitForHuman(): Promise<Action> {
  return new Promise((resolve) => (resolveHuman = resolve))
}

function waitForContinue(): Promise<void> {
  return new Promise((resolve) => (resolveContinue = resolve))
}

function startBots(): void {
  for (let playerId = 0; playerId < game.value!.playerCount; playerId++) {
    if (playerId === localPlayerId.value) {
      continue
    }

    workers.set(playerId, new Worker(new URL('../bots/bot.worker.ts', import.meta.url), { type: 'module' }))
  }
}

/**
 * The player who gets the turn after the current one, or undefined when no round is being played.
 */
function nextPlayerId(): number | undefined {
  const round = game.value?.currentRound()
  const playerInTurn = round?.playerInTurn()
  if (!round || playerInTurn === undefined) {
    return undefined
  }

  const step = round.playDirection() === 'counterclockwise' ? -1 : 1
  return (playerInTurn + step + round.playerCount) % round.playerCount
}

function currentPlayerIsLocalPlayer(): boolean {
  if (game.value && game.value.currentRound()) {
    return game.value!.currentRound()!.playerInTurn() === localPlayerId.value
  } else {
    return false
  }
}

// Click handlers
function onCardClick(cardIndex: number): void {
  const card = game.value!.currentRound()!.playerHand(localPlayerId.value)[cardIndex]!
  if ('color' in card) {
    resolveHuman?.({ type: 'play', cardIndex })
  } else {
    pendingWild.value = cardIndex // opens the color modal
  }
}

function onColorClick(namedColor: Color): void {
  resolveHuman?.({ type: 'play', cardIndex: pendingWild.value!, namedColor })
  pendingWild.value = null
}

function onDrawClick(): void {
  resolveHuman?.({ type: 'draw' })
}

function onContinueClick(): void {
  roundResult.value = null
  resolveContinue?.()
}

async function onExitClick(): Promise<void> {
  await router.push({ name: 'lobby' })
}

onMounted(() => {
  startBots()
  gameLoop()
})

onUnmounted(() => {
  running = false
  workers.forEach((worker) => worker.terminate())
  workers.clear()
})
</script>

<template>
  <main class="stage-frame" id="game-screen">
    <div class="stage">
      <!-- Game name and password, for inviting friends -->
      <dl class="game-info">
        <dt>Game</dt>
        <dd>{{ settings!.name }}</dd>
        <dt>Password</dt>
        <dd>{{ settings!.password }}</dd>
      </dl>

      <!-- Players around the table -->
      <ol v-if="game" class="seats" aria-label="Players">
        <li v-for="playerId in playerIds" :key="playerId" class="seat" :class="`seat--${seatingPriority[playerId]}`">
          <PlayerAvatarCard
            :playerId="playerId"
            :playerName="game.player(playerId)"
            :cardCount="game.currentRound()?.playerObj(playerId)?.hand.cards.length ?? 0"
            :score="game.score(playerId) ?? 0"
            :isBot="settings!.joinedPlayers[playerId] === undefined"
            :isTurn="game.currentRound()?.playerInTurn() === playerId"
            :isNext="nextPlayerId() === playerId"
            :hasSaidUno="game.currentRound()?.playerObj(playerId)?.hasSaidUno ?? false"
            :isLocalPlayer="settings!.joinedPlayers[playerId] === 'host'"
            :hasSaidThisColor="chosenWildColor.get(playerId)"
          />
          <!-- TODO: Find a smarter way to identify the local player when multiplayer support is implemented in Assignment 3! -->
        </li>
      </ol>

      <!-- The table -->
      <p v-if="game!.currentRound() !== undefined" class="turn" role="status">
        Turn: <strong>{{ game!.player(game!.currentRound()!.playerInTurn()!) }}</strong>
      </p>
      <p v-else class="turn" role="status">Game is Over</p>

      <!-- Clicking the draw pile draws a card. -->
      <button class="pile pile--draw" type="button" :disabled="!currentPlayerIsLocalPlayer() || game!.currentRound()!.canPlayAny()" @click="onDrawClick">
        <img src="@/assets/cards/backs/01-quarters.svg" alt="" />
        <span class="pile__label">Draw</span>
      </button>

      <!-- The top card of the discard pile. -->
      <div class="pile pile--discard">
        <img v-if="game!.currentRound()?.discardPile().top()" :src="getCardUrl(game!.currentRound()!.discardPile().top()!)" alt="" />
        <span class="pile__label">Discard</span>
      </div>

      <button v-if="currentPlayerIsLocalPlayer()" class="say-uno" type="button">Say UNO</button>

      <!-- Your side of the table -->
      <p class="you-bar"><span>Your Hand</span></p>

      <p class="target-score">
        Target Score: <strong>{{ settings!.targetScore }}</strong> pts.
      </p>

      <!-- Local Players on hand cards -->
      <ul v-if="game && localPlayerId >= 0 && game.currentRound()" class="hand" aria-label="Your hand" :style="{ '--cards': game.currentRound()!.playerHand(localPlayerId).length }">
        <li v-for="(card, index) in game.currentRound()!.playerHand(localPlayerId)" :key="index">
          <button class="hand__card" type="button" :disabled="!game.currentRound()!.canPlay(index) || game.currentRound()!.playerInTurn() !== localPlayerId" @click="onCardClick(index)">
            <img :src="getCardUrl(card)" alt="" />
          </button>
        </li>
      </ul>

      <!-- Choosing a colour after playing a Wild card. -->
      <div v-if="pendingWild !== null" class="stage__overlay">
        <section class="modal modal--walnut" role="dialog">
          <h2 class="modal__title" id="color-title">Choose a Colour</h2>
          <div class="color-choices">
            <button class="color-choice color-choice--red" type="button" @click="onColorClick('RED')">Red</button>
            <button class="color-choice color-choice--yellow" type="button" @click="onColorClick('YELLOW')">Yellow</button>
            <button class="color-choice color-choice--green" type="button" @click="onColorClick('GREEN')">Green</button>
            <button class="color-choice color-choice--blue" type="button" @click="onColorClick('BLUE')">Blue</button>
          </div>
        </section>
      </div>

      <!-- End of a round. -->
      <ScoreBoard
        v-if="roundResult && game!.winner() === undefined"
        title="Round Winner"
        :headline="game!.player(roundResult.winner)"
        buttonLabel="Play Next Round"
        :rows="scoreRows"
        :winnerId="roundResult.winner"
        :gained="roundResult.gained"
        @close="onContinueClick"
      />

      <!-- End of the game. -->
      <ScoreBoard
        v-if="game!.winner() !== undefined"
        title="Game Over"
        :headline="`Winner: ${game!.player(game!.winner()!)}`"
        buttonLabel="Exit"
        :rows="scoreRows"
        :winnerId="game!.winner()!"
        @close="onExitClick"
      />
    </div>
  </main>
</template>

<style scoped></style>
