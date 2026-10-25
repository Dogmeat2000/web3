<script setup lang="ts">
import type { Color } from '@domain/model/color.ts'

defineEmits<{ choose: [color: Color] }>()
</script>

<template>
  <div class="stage__overlay">
    <section class="modal modal--walnut" role="dialog">
      <h2 class="modal__title" id="color-title">Choose a Colour</h2>
      <div class="color-choices">
        <button class="color-choice color-choice--red" type="button" @click="$emit('choose', 'RED')">Red</button>
        <button class="color-choice color-choice--yellow" type="button" @click="$emit('choose', 'YELLOW')">Yellow</button>
        <button class="color-choice color-choice--green" type="button" @click="$emit('choose', 'GREEN')">Green</button>
        <button class="color-choice color-choice--blue" type="button" @click="$emit('choose', 'BLUE')">Blue</button>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
