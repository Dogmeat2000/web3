<script setup lang="ts">
import type { Card } from '@domain/model/card.ts'
import { getCardUrl } from '@/helpers/cardUrlHelper.ts'

defineProps<{
  cards: Card[]

  /** One entry per card: whether it can be played right now. */
  playable: boolean[]
}>()

defineEmits<{ play: [cardIndex: number] }>()
</script>

<template>
  <ul class="hand" aria-label="Your hand" :style="{ '--cards': cards.length }">
    <li v-for="(card, index) in cards" :key="index">
      <button class="hand__card" type="button" :disabled="!playable[index]" @click="$emit('play', index)">
        <img :src="getCardUrl(card)" alt="" />
      </button>
    </li>
  </ul>
</template>

<style scoped></style>
