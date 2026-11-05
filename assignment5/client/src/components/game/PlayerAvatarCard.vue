<script setup lang="ts">
import { computed } from 'vue'
import { validColors } from '@domain/model/card.ts'
import type { Color } from '@domain/model/color.ts'

const props = defineProps<{
  playerId: number
  playerName: string
  cardCount: number
  score: number
  isTurn: boolean
  isNext: boolean
  isLocalPlayer: boolean
  isBot: boolean
  hasSaidUno: boolean
  hasSaidThisColor: Color | undefined
}>()

const avatar = computed(() => new URL(`../../assets/images/Profile${props.playerId + 1}.webp`, import.meta.url).href)
const playerClasses = computed(() => ({ 'player--you': props.isLocalPlayer, 'player--turn': props.isTurn, 'player--next': props.isNext }))
</script>

<template>
  <!-- Display player avatar -->
  <p class="seat__score">Score: {{ score }}</p>

  <article class="player" :class="playerClasses">
    <!-- Display player avatar -->
    <img class="player__avatar" :src="avatar" alt="" />

    <!-- Display player name -->
    <h2 class="player__name">{{ playerName }}</h2>

    <!-- Show type of player -->
    <p v-if="isBot" class="player__kind">Bot</p>
    <p v-else-if="isLocalPlayer">You</p>
    <p v-else>Human</p>

    <!-- Show number of cards remaining -->
    <p class="player__cards"><img src="@/assets/cards/backs/01-quarters.svg" alt="" />{{ cardCount }}</p>

    <!-- Indicate if it is this players turn -->
    <p v-if="isTurn" class="player__tag">Playing</p>
    <p v-else-if="isNext" class="player__tag">Next</p>

    <!-- Indicate if player has said Uno -->
    <p class="player__uno" :hidden="!hasSaidUno">UNO!</p>

    <!-- Indicate which color, this player has said (if playing a WILD card) -->
    <p v-if="hasSaidThisColor" class="player__uno">{{ hasSaidThisColor }}</p>
  </article>
</template>

<style scoped></style>
