<script setup lang="ts">
  import Footer from '../components/shared/Footer.vue'

</script>

<template>
  <main class="lobby" id="lobby-screen">
    <section class="modal modal--card" aria-labelledby="lobby-title">
      <h1 class="modal__title" id="lobby-title">A Game of UNO</h1>

      <p class="modal__intro">
        Join a game by entering the name of a hosted game and its password, or host your own game
        and invite your friends.
      </p>

      <form class="lobby-form" id="lobby-form" novalidate>
        <label class="visually-hidden" for="game-name">Game name</label>
        <input
          class="field"
          id="game-name"
          name="gameName"
          type="text"
          placeholder="Game Name"
          autocomplete="off"
          required
        />

        <label class="visually-hidden" for="game-password">Password</label>
        <input
          class="field"
          id="game-password"
          name="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          required
        />

        <button class="btn" type="submit" name="action" value="join">Join Game</button>
        <button class="btn" type="submit" name="action" value="host">Host Game</button>
      </form>

      <!-- Validation messages are written here; screen readers announce changes -->
      <p class="form-error" id="form-error" role="alert" aria-live="assertive"></p>

      <Footer />
    </section>
  </main>
</template>

<style scoped></style>
