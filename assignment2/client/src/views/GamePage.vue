<script setup lang="ts">
import PlayerAvatarCard from '@/components/game/PlayerAvatarCard.vue'
import { useGameStore } from '@/stores/gameStore.ts'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { getCardUrl } from '@/helpers/cardUrlHelper.ts'
import { useRouter } from 'vue-router'

const router = useRouter()
const gameStore = useGameStore()
const { game, localPlayerId, settings /*, error: gameError*/ } = storeToRefs(gameStore)

if (game.value === null) {
  router.replace({ name: 'lobby' })
}

const playerIds = computed(() => (game.value ? Array.from({ length: game.value.playerCount }, (_, id) => id) : []))
const seatingPriority = [3, 4, 5, 6, 7, 8, 9, 10, 1, 2]

//const gameStarted: boolean = false

function currentPlayerIsLocalPlayer(): boolean {
  if (game.value && game.value.currentRound()) return game.value!.currentRound()!.playerInTurn() === localPlayerId.value
  else return false
}

//function
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
            :isTurn="game.currentRound()!.playerInTurn() === playerId"
            :isNext="
              game.currentRound()!.playDirection() === 'counterclockwise'
                ? (game.currentRound()!.playerInTurn()! - 1 + game.playerCount) % game.playerCount === playerId
                : (game.currentRound()!.playerInTurn()! + 1 + game.playerCount) % game.playerCount === playerId
            "
            :hasSaidUno="game.currentRound()?.playerObj(playerId)?.hasSaidUno ?? false"
            :isLocalPlayer="settings!.joinedPlayers[playerId] === 'host'"
          />
          <!-- TODO: Find a smarter way to identify the local player when multiplayer support is implemented! -->
        </li>
      </ol>

      <!-- The table -->
      <p v-if="game!.currentRound() !== undefined" class="turn" role="status">
        Turn: <strong>{{ game!.player(game!.currentRound()!.playerInTurn()!) }}</strong>
      </p>
      <p v-else class="turn" role="status">Game is Over</p>

      <!-- Clicking the draw pile draws a card. -->
      <button class="pile pile--draw" type="button" :disabled="!currentPlayerIsLocalPlayer() || game!.currentRound()!.canPlayAny()">
        <img src="@/assets/cards/backs/01-quarters.svg" alt="" />
        <span class="pile__label">Draw</span>
      </button>

      <!-- The top card of the discard pile. -->
      <div class="pile pile--discard">
        <img v-if="game!.currentRound()!.drawPile().top()" :src="getCardUrl(game!.currentRound()!.discardPile().top()!)" alt="" />
        <span class="pile__label">Discard</span>
      </div>

      <button v-if="currentPlayerIsLocalPlayer()" class="say-uno" type="button">Say UNO</button>

      <!-- Your side of the table -->
      <p class="you-bar"><span>Your Hand</span></p>

      <p class="target-score">
        Target Score: <strong>{{ settings!.targetScore }}</strong> pts.
      </p>

      <ul v-if="game && localPlayerId >= 0 && game.currentRound()" class="hand" aria-label="Your hand" :style="{ '--cards': game.currentRound()!.playerHand(localPlayerId).length }">
        <li v-for="(card, index) in game.currentRound()!.playerHand(localPlayerId)" :key="index">
          <button class="hand__card" type="button" :disabled="!game.currentRound()!.canPlay(index) || game.currentRound()!.playerInTurn() !== localPlayerId">
            <img :src="getCardUrl(card)" alt="" />
          </button>
        </li>
      </ul>

      <!-- Choosing a colour after playing a Wild card. -->
      <!-- TODO Tie this into vue -->
      <div class="stage__overlay" hidden>
        <section class="modal modal--walnut" role="dialog" aria-modal="true" aria-labelledby="color-title">
          <h2 class="modal__title" id="color-title">Choose a Colour</h2>
          <div class="color-choices">
            <button class="color-choice color-choice--red" type="button">Red</button>
            <button class="color-choice color-choice--yellow" type="button">Yellow</button>
            <button class="color-choice color-choice--green" type="button">Green</button>
            <button class="color-choice color-choice--blue" type="button">Blue</button>
          </div>
        </section>
      </div>

      <!-- End of a round. -->
      <!-- TODO Tie this into vue -->
      <div class="stage__overlay" hidden>
        <section class="modal modal--card" role="dialog" aria-modal="true" aria-labelledby="round-title">
          <h2 class="modal__title" id="round-title">Round Winner</h2>
          <p class="winner">Player 3</p>

          <div class="scoreboard-wrap">
            <table class="scoreboard">
              <caption class="visually-hidden">
                Scores after this round
              </caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr class="scoreboard__row--winner">
                  <td>1</td>
                  <td>Player 3</td>
                  <td>275 <span class="scoreboard__gain">+87</span></td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Player 2</td>
                  <td>132</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Player 1 (you)</td>
                  <td>42</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Player 10</td>
                  <td>15</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Player 4</td>
                  <td>10</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button class="btn" type="button">Continue</button>
        </section>
      </div>

      <!-- End of the game. -->
      <!-- TODO Tie this into vue -->
      <div class="stage__overlay" hidden>
        <section class="modal modal--card" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
          <h2 class="modal__title" id="game-over-title">Game Over</h2>
          <p class="winner">Winner: Player 3</p>

          <div class="scoreboard-wrap">
            <table class="scoreboard">
              <caption class="visually-hidden">
                Final scores
              </caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr class="scoreboard__row--winner">
                  <td>1</td>
                  <td>Player 3</td>
                  <td>512</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Player 2</td>
                  <td>301</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Player 1 (you)</td>
                  <td>188</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Player 10</td>
                  <td>97</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Player 4</td>
                  <td>40</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button class="btn" type="button">Exit</button>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped></style>
