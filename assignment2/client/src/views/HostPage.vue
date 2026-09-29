<script setup lang="ts">
import GameFooter from '@/components/shared/GameFooter.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore.ts'
import { storeToRefs } from 'pinia'
import { type GameSettings, type SettingsErrors, validateGameSettings } from '@/models/GameSettings.ts'

const playerCounts = Array.from([2, 3, 4, 5, 6, 7, 8, 9, 10])

const router = useRouter()
const gameStore = useGameStore()
const { pendingHost, settings, error: gameError } = storeToRefs(gameStore)

const form = reactive<GameSettings>({
  name: pendingHost.value?.name ?? '',
  password: pendingHost.value?.password ?? '',
  playerCount: 4,
  targetScore: 500,
})

const fieldErrors = ref<SettingsErrors>({})

if (pendingHost.value === null) {
  router.replace({ name: 'lobby' })
}

gameStore.clearError()

const message = computed(() => fieldErrors.value.name ?? fieldErrors.value.password ?? gameError.value ?? '')

watch(form, () => {
  fieldErrors.value = {}
  gameStore.clearError()
})

function isValid(): boolean {
  fieldErrors.value = validateGameSettings(form)
  return Object.keys(fieldErrors.value).length === 0
}

async function host(): Promise<void> {
  if (!isValid()) {
    return
  }

  if (settings.value !== null) {
    gameStore.createGame()
    await router.push({ name: 'game', params: { name: settings.value.name } })
  }
}
</script>

<template>
  <main class="host" id="host-screen">
    <section class="modal modal--card" aria-labelledby="host-title">
      <RouterLink :to="{ name: 'lobby' }" class="modal__close" aria-label="Back to lobby"> × </RouterLink>

      <h1 class="modal__title" id="host-title">Host New Game</h1>

      <!-- Display selected game name and password -->
      <dl v-if="pendingHost" class="summary">
        <dt>Game Name</dt>
        <dd>{{ pendingHost.name }}</dd>

        <dt>Password</dt>
        <dd>{{ pendingHost.password }}</dd>
      </dl>

      <form class="host-form" id="host-form" novalidate @submit.prevent="host">
        <!-- Select Number of Players -->
        <label for="player-count">
          <b>Number of Players</b><br />
          2 - 10 players allowed.
        </label>
        <select id="player-count" v-model="form.playerCount" class="field">
          <option v-for="count in playerCounts" :key="count" :value="count">
            {{ count }}
          </option>
        </select>

        <!-- Select Target score -->
        <label for="target-score">
          <b>Target Score</b><br />
          How many points it takes for a player to win the game.
        </label>
        <input
          v-model="form.targetScore"
          class="field"
          id="target-score"
          name="targetScore"
          type="number"
          min="0"
          step="10"
          placeholder="Target Score"
          autocomplete="off"
          :aria-invalid="fieldErrors.targetScore ? 'true' : undefined"
          aria-describedby="form-error"
          required
        />

        <!-- Buttons -->
        <button class="btn" type="submit">Host Game</button>
      </form>

      <!-- Validation messages -->
      <p class="form-error" id="form-error" role="alert">{{ message }}</p>

      <GameFooter />
    </section>
  </main>
</template>

<style scoped></style>
