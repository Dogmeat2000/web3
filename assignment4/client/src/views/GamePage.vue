<script setup lang="ts">
import ColorPicker from '@/components/game/ColorPicker.vue'
import PlayerAvatarCard from '@/components/game/PlayerAvatarCard.vue'
import PlayerHand from '@/components/game/PlayerHand.vue'
import ScoreBoard from '@/components/game/ScoreBoard.vue'
import { useBots } from '@/bots/useBots.ts'
import { useGameStore } from '@/stores/gameStore.ts'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getCardUrl } from '@/helpers/cardUrlHelper.ts'
import { useRouter } from 'vue-router'
import type { Color } from '@domain/model/color.ts'
import type { ScoreRow } from '@/models/ScoreRow.ts'

const router = useRouter()
const gameStore = useGameStore()
const { game, hostedGame, password, localPlayerId, error: gameError } = storeToRefs(gameStore)
const seatingPriority = [3, 4, 5, 6, 7, 8, 9, 10, 1, 2] //TODO: Consider re-structuring this, so humans are assigned a random place amongst the valid positions.
const pendingWild = ref<number | null>(null) // index of a Wild card waiting for a color
const dismissedRoundScores = ref(hostedGame.value?.lastRound?.roundsPlayed ?? 0) // Rounds whose scoreboard was closed, or that ended before this screen opened.

if (game.value === null) {
  router.replace({ name: 'lobby' })
}

// For debugging: Console log errors from server/domain.
watch(gameError, (message) => {
  if (message !== null) {
    console.error(message)
  }
})

// The server sends a whole new game after every move, so everything the screen shows is computed from it.
const status = computed(() => hostedGame.value?.status)
const round = computed(() => game.value?.currentRound())
const winner = computed(() => game.value?.winner())
const playerIds = computed(() => (game.value ? Array.from({ length: game.value.playerCount }, (_, id) => id) : []))
const isHost = computed(() => localPlayerId.value === 0)
const isMyTurn = computed(() => status.value === 'ACTIVE' && round.value?.playerInTurn() === localPlayerId.value)
const canDraw = computed(() => isMyTurn.value && !round.value!.canPlayAny())
const topCard = computed(() => round.value?.discardPile().top())
const hand = computed(() => round.value?.playerHand(localPlayerId.value) ?? [])
const playable = computed(() => hand.value.map((_, index) => isMyTurn.value && round.value!.canPlay(index)))

/**
 * The player who gets the turn after the current one, or undefined when no round is being played.
 */
const nextPlayerId = computed(() => {
  const playerInTurn = round.value?.playerInTurn()
  if (!round.value || playerInTurn === undefined) {
    return undefined
  }

  const step = round.value.playDirection() === 'counterclockwise' ? -1 : 1
  return (playerInTurn + step + round.value.playerCount) % round.value.playerCount
})

// The round that just ended. Its scoreboard is shown in every browser, until it is closed there.
const roundResult = computed(() => {
  const lastRound = hostedGame.value?.lastRound ?? null
  return lastRound !== null && lastRound.roundsPlayed > dismissedRoundScores.value ? lastRound : null
})

// All players, with the highest score first.
const scoreRows = computed<ScoreRow[]>(() =>
  playerIds.value.map((id) => ({ playerId: id, name: game.value!.player(id), score: game.value!.score(id) ?? 0, isLocalPlayer: id === localPlayerId.value })).sort((a, b) => b.score - a.score),
)

// Bots run on the host player's browser. They are paused between rounds.
useBots(computed(() => roundResult.value !== null))

// Click handlers
function onCardPlay(cardIndex: number): void {
  if ('color' in hand.value[cardIndex]!) {
    void gameStore.playCard(cardIndex)
  } else {
    pendingWild.value = cardIndex // opens the color modal
  }
}

function onColorChoose(namedColor: Color): void {
  void gameStore.playCard(pendingWild.value!, namedColor)
  pendingWild.value = null
}

function onContinueClick(): void {
  dismissedRoundScores.value = hostedGame.value?.lastRound?.roundsPlayed ?? 0
}

async function onExitClick(): Promise<void> {
  await router.push({ name: 'lobby' })
}
</script>

<template>
  <main class="stage-frame" id="game-screen">
    <div v-if="game && hostedGame" class="stage">
      <!-- Game name and password, for inviting friends -->
      <dl class="game-info">
        <dt>Game</dt>
        <dd>{{ hostedGame.name }}</dd>
        <dt>Password</dt>
        <dd>{{ password }}</dd>
      </dl>

      <!-- Players around the table -->
      <ol class="seats" aria-label="Players">
        <li v-for="playerId in playerIds" :key="playerId" class="seat" :class="`seat--${seatingPriority[playerId]}`">
          <PlayerAvatarCard
            :playerId="playerId"
            :playerName="game.player(playerId)"
            :cardCount="round?.playerHand(playerId).length ?? 0"
            :score="game.score(playerId) ?? 0"
            :isBot="hostedGame.joinedPlayers[playerId] === undefined"
            :isTurn="round?.playerInTurn() === playerId"
            :isNext="nextPlayerId === playerId"
            :hasSaidUno="round?.playerObj(playerId)?.hasSaidUno ?? false"
            :isLocalPlayer="playerId === localPlayerId"
            :hasSaidThisColor="hostedGame.namedColor?.playerId === playerId ? hostedGame.namedColor.color : undefined"
          />
        </li>
      </ol>

      <!-- The table -->
      <p v-if="status === 'PENDING'" class="turn" role="status">Waiting for Host to start Game</p>
      <p v-else-if="round" class="turn" role="status">
        Turn: <strong>{{ game.player(round.playerInTurn()!) }}</strong>
      </p>
      <p v-else class="turn" role="status">Game is Over</p>

      <!-- Clicking the draw pile draws a card. -->
      <button class="pile pile--draw" type="button" :disabled="!canDraw" @click="gameStore.drawCard()">
        <img src="@/assets/cards/backs/01-quarters.svg" alt="" />
        <span class="pile__label">Draw</span>
      </button>

      <!-- The top card of the discard pile. -->
      <div class="pile pile--discard">
        <img v-if="topCard" :src="getCardUrl(topCard)" alt="" />
        <span class="pile__label">Discard</span>
      </div>

      <!-- Start Game button is shown to the host -->
      <div v-if="isHost && status === 'PENDING'" class="start-game">
        <button class="say-uno say-uno--start" type="button" @click="gameStore.startGame()">Start Game</button>
        <p class="start-game__note">Starting locks this game. No one else can join.</p>
      </div>

      <!-- Player button to say 'UNO' with-->
      <button v-if="isMyTurn" class="say-uno" type="button" @click="gameStore.sayUno()">Say UNO</button>

      <!-- Player button to catch someone who forgot to say 'UNO' -->
      <button v-if="status === 'ACTIVE' && round" class="say-uno say-uno--catch" type="button" @click="gameStore.catchUno()">Catch!</button>

      <!-- Local Players side of the table -->
      <p class="you-bar"><span>Your Hand</span></p>

      <p class="target-score">
        Target Score: <strong>{{ hostedGame.targetScore }}</strong> pts.
      </p>

      <!-- Show the Local Players' cards -->
      <PlayerHand v-if="round" :cards="hand" :playable="playable" @play="onCardPlay" />

      <!-- Choosing a colour after playing a Wild card. -->
      <ColorPicker v-if="pendingWild !== null" @choose="onColorChoose" />

      <!-- End of a round. -->
      <ScoreBoard
        v-if="roundResult && winner === undefined"
        title="Round Winner"
        :headline="game.player(roundResult.winner)"
        buttonLabel="Play Next Round"
        :rows="scoreRows"
        :winnerId="roundResult.winner"
        :gained="roundResult.addedScore"
        @close="onContinueClick"
      />

      <!-- End of the game. -->
      <ScoreBoard v-if="winner !== undefined" title="Game Over" :headline="`Winner: ${game.player(winner)}`" buttonLabel="Exit" :rows="scoreRows" :winnerId="winner" @close="onExitClick" />
    </div>
  </main>
</template>

<style scoped></style>
