<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import GameFooter from '@/components/shared/GameFooter.vue'
import { useGameStore } from '@/stores/gameStore.ts'
import { GAME_NAME_MAX_LENGTH, validateCredentials, type CredentialErrors } from '@/models/GameSettings'
import type { GameCredentials } from '@/models/GameCredentials.ts'

const router = useRouter()
const gameStore = useGameStore()
const { pendingHost, settings, error: gameError } = storeToRefs(gameStore)

const form = reactive<GameCredentials>({
  name: pendingHost.value?.name ?? '',
  password: pendingHost.value?.password ?? '',
})
const fieldErrors = ref<CredentialErrors>({})

gameStore.clearError()

const message = computed(() => fieldErrors.value.name ?? fieldErrors.value.password ?? gameError.value ?? '')

watch(form, () => {
  fieldErrors.value = {}
  gameStore.clearError()
})

function isValid(): boolean {
  fieldErrors.value = validateCredentials(form)
  return Object.keys(fieldErrors.value).length === 0
}

async function join(): Promise<void> {
  if (!isValid()) {
    return
  }

  if (gameStore.joinGame(form) && settings.value !== null) {
    await router.push({ name: 'game', params: { name: settings.value.name } })
  }
}

async function host(): Promise<void> {
  if (!isValid()) {
    return
  }

  gameStore.prepareHost(form)
  await router.push({ name: 'host' })
}
</script>

<template>
  <main class="lobby" id="lobby-screen">
    <section class="modal modal--card" aria-labelledby="lobby-title">
      <h1 class="modal__title" id="lobby-title">A Game of UNO</h1>

      <p class="modal__intro">Join a game by entering the name of a hosted game and its password, or host your own game and invite your friends.</p>

      <form class="lobby-form" id="lobby-form" novalidate @submit.prevent="join">
        <!-- Game Name -->
        <input
          v-model.trim="form.name"
          class="field"
          id="game-name"
          name="gameName"
          type="text"
          placeholder="Game Name"
          autocomplete="off"
          :maxlength="GAME_NAME_MAX_LENGTH"
          :aria-invalid="fieldErrors.name ? 'true' : undefined"
          aria-describedby="form-error"
          required
        />

        <!-- Password input -->
        <input
          v-model="form.password"
          class="field"
          id="game-password"
          name="password"
          type="password"
          placeholder="Password"
          autocomplete="off"
          :aria-invalid="fieldErrors.password ? 'true' : undefined"
          aria-describedby="form-error"
          required
        />

        <!-- Buttons -->
        <button class="btn" type="submit">Join Game</button>
        <button class="btn" type="button" @click="host">Host Game</button>
      </form>

      <!-- Validation messages -->
      <p class="form-error" id="form-error" role="alert">{{ message }}</p>

      <GameFooter />
    </section>
  </main>
</template>

<style scoped></style>
