import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { Game } from '@domain/model/uno'
import type { Color } from '@domain/model/color.ts'
import type { GameCredentials, GameSettings, PublicGame } from '@domain/model/uno.dto.ts'
import { toGame } from '@domain/model/uno.memento.ts'
import { standardRandomizer, standardShuffler } from '@domain/utils/random_utils.ts'
import {
  catchUno as sendCatchUno,
  draw as sendDraw,
  fetchGame,
  hostGame,
  joinGame,
  play as sendPlay,
  sayUno as sendSayUno,
  startGame as sendStart,
  subscribeToGame,
  unsubscribeFromGame,
} from '@/graphql/gameConnection.ts'

/**
 * The game this browser is playing. The server owns the game and its rules.
 */
export const useGameStore = defineStore('game', () => {
  // State:
  /**
   * Name and password carried from the lobby to the host page, which adds the other game settings.
   */
  const pendingHost = ref<GameCredentials | null>(null)

  /**
   * The game this browser hosts or has joined. `null` until then.
   * This holds both game configuration and the game itself as a Memento.
   */
  const hostedGame = shallowRef<PublicGame | null>(null)

  /** The password of that game. The server never sends it back, so it is kept from the lobby. */
  const password = ref<string>('')

  /** ID of the local player in this browser. -1 until set. */
  const localPlayerId = ref<number>(-1)

  /** Error message. Populated when an error occurs. */
  const error = ref<string | null>(null)

  /**
   * The currently played game, read from the received PublicGame but converted from its Memento form into an actual domain model object.
   */
  const currentGame = computed<Game | null>((): Game | null => {
    if (hostedGame.value === null) {
      return null
    }

    return toGame(hostedGame.value, standardShuffler, standardRandomizer)
  })

  /**
   * Refreshes the currently shown game, when new game information is received from the server.
   * Since both this browser as requests, as well as server message, go through this, we need to check which information
   * is the most recent and drop out-dated information.
   */
  function refreshGame(update: PublicGame): void {
    const shownGame: PublicGame | null = hostedGame.value
    if (shownGame !== null && shownGame.id === update.id && update.version <= shownGame.version) {
      return
    }

    hostedGame.value = update
  }

  /**
   * Sends one request to the server and refreshes the game based on the received answer.
   * A request the server refuses does not throw: the reason is kept in `error`, and the answer is `null`.
   */
  async function request(send: () => Promise<PublicGame>): Promise<PublicGame | null> {
    error.value = null
    try {
      const answer: PublicGame = await send()
      refreshGame(answer)
      return answer
    } catch (err) {
      error.value = errorText(err)
      return null
    }
  }

  // Actions:
  /**
   * Action run on "Host Game" from the Lobby. It keeps the name and password for use on the host page.
   */
  function prepareHost(credentials: GameCredentials): void {
    pendingHost.value = { name: credentials.name.trim(), password: credentials.password }
  }

  /**
   * Action run on "Host Game" from the Host Game menu. Sets up the new game.
   * Returns a promise that resolves to true if the game was successfully created/hosted. Otherwise, false.
   */
  async function hostNewGame(settings: GameSettings): Promise<boolean> {
    unsubscribeFromGame()
    hostedGame.value = null

    if ((await request((): Promise<PublicGame> => hostGame(settings))) === null) {
      return false
    }

    subscribeToGame(settings, refreshGame)
    password.value = settings.password
    localPlayerId.value = 0
    pendingHost.value = null

    return true
  }

  /**
   * Action run on "Join Game" from the lobby. It loads the named game and listens.
   */
  async function connectToGame(credentials: GameCredentials): Promise<boolean> {
    const currentGame: PublicGame | null = hostedGame.value // If player already joined a game, that game will be stored here, so re-joining the same game doesn't give the player a new position.

    const joinedGame: PublicGame | null = await request(async (): Promise<PublicGame> => {
      const foundGame: PublicGame = await fetchGame(credentials)
      return foundGame.id === currentGame?.id ? foundGame : joinGame(credentials)
    })

    if (joinedGame === null) {
      return false
    }

    subscribeToGame(credentials, refreshGame)
    password.value = credentials.password
    if (joinedGame.id !== currentGame?.id) {
      localPlayerId.value = joinedGame.joinedPlayers.length - 1
    }

    return true
  }

  /**
   *  Starts the game.
   *  This locks the game, so new players can't join and lets bots play as the remaining non-human players.
   */
  async function startGame(): Promise<boolean> {
    if (hostedGame.value?.status !== 'PENDING' || localPlayerId.value !== 0) {
      return false
    }

    const started: PublicGame | null = await sendGameAction(sendStart)
    return started?.status === 'ACTIVE'
  }

  /**
   * Sends an action for the currently played/active game. The server answers with the updated game.
   * This is a helper function for the async functions below
   */
  async function sendGameAction(send: (credentials: GameCredentials) => Promise<PublicGame>): Promise<PublicGame | null> {
    if (hostedGame.value === null) {
      return null
    }

    const credentials = { name: hostedGame.value.name, password: password.value }
    return request((): Promise<PublicGame> => send(credentials))
  }

  /**
   * Attempts to play a card from a player's hand, sharing this with the server.
   * @param cardIndex Index position of the card to play, in that player's hand.
   * @param namedColor The color the player names. Required for WILD and WILD DRAW cards, and not allowed with any other card.
   * @param playerId The ID (i.e. index) of the player that plays the card. This is the local player, or one of its bots.
   * @returns A promise that resolves to true if the server accepted the card. Otherwise, false, and the reason is kept in the `error` variable.
   */
  async function playCard(cardIndex: number, namedColor?: Color, playerId: number = localPlayerId.value): Promise<boolean> {
    return (await sendGameAction((credentials: GameCredentials): Promise<PublicGame> => sendPlay(credentials, playerId, cardIndex, namedColor))) !== null
  }

  /**
   * Attempts to draw from the draw pile, sharing this with the server.
   * @param playerId The ID (i.e. index) of the player that draws. This is the local player, or one of its bots.
   * @returns A promise that resolves to true if the server accepted the draw. Otherwise, false, and the reason is kept in the `error` variable.
   */
  async function drawCard(playerId: number = localPlayerId.value): Promise<boolean> {
    return (await sendGameAction((credentials: GameCredentials): Promise<PublicGame> => sendDraw(credentials, playerId))) !== null
  }

  /**
   * Attempts to say 'UNO' for a player, sharing this with the server.
   * @param playerId The ID (i.e. index) of the player that says 'UNO'. This is the local player, or one of its bots.
   * @returns A promise that resolves to true if the server accepted it. Otherwise, false, and the reason is kept in the `error` variable.
   */
  async function sayUno(playerId: number = localPlayerId.value): Promise<boolean> {
    return (await sendGameAction((credentials: GameCredentials): Promise<PublicGame> => sendSayUno(credentials, playerId))) !== null
  }

  /**
   * Attempts to call out whoever forgot to say 'UNO', sharing this with the server.
   * @param playerId The ID (i.e. index) of the player that makes the accusation. This is the local player, or one of its bots.
   * @returns A promise that resolves to true if the server handled the call. Otherwise, false, and the reason is kept in the `error` variable.
   */
  async function catchUno(playerId: number = localPlayerId.value): Promise<boolean> {
    return (await sendGameAction((credentials: GameCredentials): Promise<PublicGame> => sendCatchUno(credentials, playerId))) !== null
  }

  function clearError(): void {
    error.value = null
  }

  return {
    pendingHost,
    hostedGame: hostedGame,
    password,
    localPlayerId,
    error,
    game: currentGame,
    prepareHost,
    hostNewGame,
    connectJoinAttempt: connectToGame,
    startGame,
    playCard,
    drawCard,
    sayUno,
    catchUno,
    clearError,
  }
})

function errorText(err: unknown): string {
  if (!(err instanceof Error) || err.message === '' || err.message.startsWith('Socket closed') || /fetch|network|ECONNREFUSED/i.test(err.message)) {
    return 'Could not connect to the game server.'
  }
  return err.message
}
