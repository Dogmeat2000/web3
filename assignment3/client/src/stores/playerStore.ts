import { ref } from 'vue'
import { defineStore } from 'pinia'

/** This max length ensures the name can be fully shown on the player avatars in game */
export const PLAYER_NAME_MAX_LENGTH = 12

/**
 * Store to handle the identity of the player using this local browser
 */
export const usePlayerStore = defineStore('player', () => {
  const playerName = ref<string>('')

  return { playerName }
})
