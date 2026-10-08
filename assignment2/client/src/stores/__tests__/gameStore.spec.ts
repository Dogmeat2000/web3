import { describe, it, expect, beforeEach } from 'vitest'
import { markRaw } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { GameImpl } from '@domain/model/uno.impl'
import { useGameStore } from '../gameStore.ts'

/** Puts a game in the store, as the host page will once it exists. */
function hostInStore(store: ReturnType<typeof useGameStore>, name = 'Friday Night', password = 'hunter2') {
  const game = markRaw(new GameImpl(['You', 'Bot 1', 'Bot 2', 'Bot 3'], 500))
  store.settings = { name, password, playerCount: 4, targetScore: 500 }
  store.game = game
  return game
}

describe('game store', () => {
  // A fresh Pinia per test, so no test sees another's game.
  beforeEach(() => setActivePinia(createPinia()))

  it('prepareHost keeps the trimmed name and the password for the host page', () => {
    const store = useGameStore()

    store.prepareHost({ name: '  Friday Night ', password: ' hunter2' })

    expect(store.pendingHost).toEqual({ name: 'Friday Night', password: ' hunter2' })
  })

  describe('joinGame', () => {
    it('finds the hosted game by name, whatever the case', () => {
      const store = useGameStore()
      hostInStore(store)

      expect(store.joinGame({ name: ' friday night', password: 'hunter2' })).toBe(true)
      expect(store.error).toBeNull()
    })

    it('refuses a wrong password, or when nothing is hosted, with the same message', () => {
      const store = useGameStore()

      expect(store.joinGame({ name: 'Friday Night', password: 'hunter2' })).toBe(false)
      expect(store.error).toBe('No game matches that name and password.')

      hostInStore(store)
      expect(store.joinGame({ name: 'Friday Night', password: 'wrong' })).toBe(false)
      expect(store.error).toBe('No game matches that name and password.')
    })

    it('refuses a game the domain model says has a winner', () => {
      const store = useGameStore()
      const game = hostInStore(store)
      // Give "You" the target score; a game with a winner has no current round.
      game.modifyGameState({ 0: 'You', 1: 'Bot 1', 2: 'Bot 2', 3: 'Bot 3' }, { 0: 500, 1: 0, 2: 0, 3: 0 }, 500, undefined)

      expect(store.joinGame({ name: 'Friday Night', password: 'hunter2' })).toBe(false)
      expect(store.error).toBe('"Friday Night" has already finished. Host a new game to play again.')
    })
  })
})
