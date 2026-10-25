<script setup lang="ts">
import type { ScoreRow } from '@/models/ScoreRow.ts'

defineProps<{
  title: string
  headline: string
  buttonLabel: string

  /** Sorted, with the highest score first. */
  rows: ScoreRow[]
  winnerId: number

  /** Points the winner just gained. Leave out to hide it. */
  gained?: number
}>()

defineEmits<{ close: [] }>()
</script>

<template>
  <div class="stage__overlay">
    <section class="modal modal--card" role="dialog" aria-modal="true">
      <h2 class="modal__title">{{ title }}</h2>
      <p class="winner">{{ headline }}</p>

      <div class="scoreboard-wrap">
        <table class="scoreboard">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Player</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="row.playerId" :class="{ 'scoreboard__row--winner': row.playerId === winnerId }">
              <td>{{ index + 1 }}</td>
              <td>
                {{ row.name }}<template v-if="row.isLocalPlayer"> <b> (you)</b></template>
              </td>
              <td>
                {{ row.score }}
                <span v-if="gained !== undefined && row.playerId === winnerId" class="scoreboard__gain">+{{ gained }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button class="btn" type="button" @click="$emit('close')">{{ buttonLabel }}</button>
    </section>
  </div>
</template>

<style scoped></style>
