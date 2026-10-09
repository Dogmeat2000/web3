import { ref, shallowRef, triggerRef } from 'vue'
import { defineStore } from 'pinia'
import type { Game } from '@domain/model/uno'
import { type GameSettings } from '@/models/GameSettings'
import type { GameCredentials } from '@/models/GameCredentials.ts'
import { GameImpl } from '@domain/model/uno.impl.ts'

/**
 * The store containing the game information about the game played in the local browser.
 * TODO: Migrate this to a server at a later date
 */
export const useGameStore = defineStore('game', () => {
  // State:
  /**
   * Name and password carried from the lobby to the host page, which adds the other game settings.
   */
  const pendingHost = ref<GameCredentials | null>(null)

  /**
   * What the current game was hosted with. `null` until a game is hosted.
   */
  const settings = ref<GameSettings | null>(null)

  /**
   * The domain model's game. `null` until a game is hosted.
   */
  const game = shallowRef<Game | null>(null) // `shallowRef` means Vue only reacts when the whole game is replaced.

  /** Why the last action failed, worded for the player. */
  const error = ref<string | null>(null)

  /** Default names of all players */
  const playerNames: string[] = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6', 'Player7', 'Player8', 'Player9', 'Player10']

  /** ID of the local player in this browser */
  const localPlayerId = ref<number>(-1)

  // Actions:
  /**
   * Action run on "Host Game" from the Lobby. It keeps the name and password for the host page.
   */
  function prepareHost(credentials: GameCredentials): void {
    pendingHost.value = { name: credentials.name.trim(), password: credentials.password }
  }

  /**
   * Action run on "Join Game" from the lobby. It joins to a game hosted in this browser, if the name and password match.
   * TODO: Implement this fully as part of Assignment3
   */
  function joinGame({ name, password }: GameCredentials): boolean {
    error.value = null

    // TODO: Fetch server for game details

    const current = settings.value

    if (game.value === null || current === null || !sameName(current.name, name) || current.password !== password) {
      error.value = 'No game matches that name and password.'
      return false
    }

    if (game.value.winner() !== undefined) {
      error.value = `"${current.name}" has already finished. Host a new game to play again.`
      return false
    }

    return true
  }

  /**
   * Action run on "Host Game" from the Host Game menu. It creates a new game hosted in this browser, based on the current settings in this store.
   */
  function createGame(newSettings: GameSettings): boolean {
    error.value = null

    try {
      game.value = new GameImpl(playerNames.slice(0, newSettings.playerCount), newSettings.targetScore)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      return false
    }

    settings.value = { ...newSettings, name: newSettings.name.trim() }
    pendingHost.value = null

    // TODO: Transmit game to server for creation
    return true
  }

  function clearError(): void {
    error.value = null
  }

  return { pendingHost, settings, localPlayerId, game, error, prepareHost, joinGame, createGame, clearError }
})

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
