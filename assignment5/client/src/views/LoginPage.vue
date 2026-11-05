<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import GameFooter from '@/components/shared/GameFooter.vue'
import { PLAYER_NAME_MAX_LENGTH, usePlayerStore } from '@/stores/playerStore.ts'

const router = useRouter()
const playerStore = usePlayerStore()

const playerName = ref<string>(playerStore.playerName)
const message = ref<string>('')

watch(playerName, (): void => {
  message.value = ''
})

async function login(): Promise<void> {
  if (playerName.value === '') {
    message.value = 'Please enter a name'
    return
  }

  playerStore.playerName = playerName.value.toLowerCase()
  await router.push({ name: 'lobby' })
}
</script>

<template>
  <main class="login" id="login-screen">
    <section class="modal modal--card">
      <h1 class="modal__title" id="login-title">A Game of UNO</h1>

      <p class="modal__intro">Choose a name to use in the game.</p>

      <form class="login-form" id="login-form" novalidate @submit.prevent="login">
        <!-- Player Name -->
        <input
          v-model.trim="playerName"
          class="field"
          id="player-name"
          name="playerName"
          type="text"
          placeholder="Your Name"
          autocomplete="off"
          :maxlength="PLAYER_NAME_MAX_LENGTH"
          :aria-invalid="message ? 'true' : undefined"
          aria-describedby="form-error"
          required
        />

        <!-- Buttons -->
        <button class="btn" type="submit">Continue</button>
      </form>

      <!-- Validation messages -->
      <p class="form-error" id="form-error" role="alert">{{ message }}</p>

      <GameFooter />
    </section>
  </main>
</template>

<style scoped></style>
