import { describe, it, expect, vi, beforeEach } from 'vitest'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { GameImpl } from '@domain/model/uno.impl.ts'
import LobbyPage from '../views/LobbyPage.vue'
import { useGameStore } from '@/stores/gameStore.ts'
import { fetchGame, joinGame, subscribeToGame } from '@/graphql/gameConnection.ts'
import type { PublicGame } from '@domain/model/uno.dto.ts'

vi.mock('@/graphql/gameConnection.ts', () => ({
  fetchGame: vi.fn(),
  hostGame: vi.fn(),
  joinGame: vi.fn(),
  subscribeToGame: vi.fn(),
  startGame: vi.fn(),
  play: vi.fn(),
  draw: vi.fn(),
  sayUno: vi.fn(),
  catchUno: vi.fn(),
  unsubscribeFromGame: vi.fn(),
}))

const hostedOnServer: PublicGame = {
  ...new GameImpl(['Player1', 'Player2', 'Player3', 'Player4'], 500).toMemento(),
  id: 'Friday Night',
  name: 'Friday Night',
  joinedPlayers: ['host'],
  status: 'PENDING',
  version: 0,
  namedColor: null,
  lastRound: null,
}

/** Puts a game in the store, as hosting one from this browser does. */
function hostInStore(store: ReturnType<typeof useGameStore>) {
  store.hostedGame = hostedOnServer
  store.password = 'hunter2'
  store.localPlayerId = 0
}

/** Mounts the lobby with a real store and a real router kept in memory. */
async function mountLobby() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'lobby', component: LobbyPage },
      { path: '/host', name: 'host', component: { render: () => h('p', 'host page') } },
      { path: '/game/:name', name: 'game', component: { render: () => h('p', 'game page') } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(LobbyPage, { global: { plugins: [pinia, router] } })

  const fill = async (name: string, password: string) => {
    await wrapper.find('#game-name').setValue(name)
    await wrapper.find('#game-password').setValue(password)
  }
  const clickJoin = async () => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }
  const clickHost = async () => {
    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()
  }
  const message = () => wrapper.find('#form-error').text()

  return { wrapper, router, store: useGameStore(), fill, clickJoin, clickHost, message }
}

describe('LobbyPage', () => {
  beforeEach(() => {
    vi.mocked(fetchGame).mockReset()
    vi.mocked(joinGame).mockReset()
    vi.mocked(subscribeToGame).mockReset()
    vi.mocked(fetchGame).mockResolvedValue(hostedOnServer)
    vi.mocked(joinGame).mockResolvedValue({ ...hostedOnServer, version: 1, joinedPlayers: ['host', 'player'] })
  })

  it('asks for a game name first', async () => {
    const { wrapper, router, clickJoin, message } = await mountLobby()

    await clickJoin()

    expect(message()).toBe('Enter the name of a game.')
    expect(wrapper.find('#game-name').attributes('aria-invalid')).toBe('true')
    expect(router.currentRoute.value.name).toBe('lobby')
  })

  it('asks for the password once the name is filled in', async () => {
    const { fill, clickJoin, message } = await mountLobby()

    await fill('Friday Night', '')
    await clickJoin()

    expect(message()).toBe('Enter the game password.')
  })

  it('clears the message as soon as the player edits the form', async () => {
    const { wrapper, clickJoin, message } = await mountLobby()
    await clickJoin()

    await wrapper.find('#game-name').setValue('F')

    expect(message()).toBe('')
    expect(wrapper.find('#game-name').attributes('aria-invalid')).toBeUndefined()
  })

  it('Host Game carries the name and password to the host page', async () => {
    const { router, store, fill, clickHost } = await mountLobby()

    await fill('  Friday Night ', 'hunter2')
    await clickHost()

    expect(router.currentRoute.value.name).toBe('host')
    expect(store.pendingHost).toEqual({ name: 'Friday Night', password: 'hunter2' })
  })

  it('Join Game returns to the game hosted in this browser', async () => {
    const { router, store, fill, clickJoin } = await mountLobby()
    hostInStore(store)

    await fill('friday night', 'hunter2')
    await clickJoin()

    expect(fetchGame).toHaveBeenCalledWith({ name: 'friday night', password: 'hunter2' })
    expect(joinGame).not.toHaveBeenCalled()
    expect(store.localPlayerId).toBe(0)
    expect(router.currentRoute.value.fullPath).toBe('/game/Friday%20Night')
  })

  it('Join Game enters the deal the server served', async () => {
    const { router, store, fill, clickJoin } = await mountLobby()

    await fill('Friday Night', 'hunter2')
    await clickJoin()

    expect(joinGame).toHaveBeenCalledWith({ name: 'Friday Night', password: 'hunter2' })
    expect(store.game?.player(0)).toBe('Player1')
    expect(store.localPlayerId).toBe(1)
    expect(router.currentRoute.value.fullPath).toBe('/game/Friday%20Night')
  })

  it('Join Game stays in the lobby when the server rejects the attempt', async () => {
    vi.mocked(fetchGame).mockRejectedValueOnce(new Error('No game matches that name and password.'))
    const { router, fill, clickJoin, message } = await mountLobby()

    await fill('Friday Night', 'hunter2')
    await clickJoin()

    expect(message()).toBe('No game matches that name and password.')
    expect(router.currentRoute.value.name).toBe('lobby')
  })

  it('Join Game keeps the game held here when the server refuses the attempt', async () => {
    vi.mocked(fetchGame).mockRejectedValueOnce(new Error('No game matches that name and password.'))
    const { router, store, fill, clickJoin, message } = await mountLobby()
    hostInStore(store)

    await fill('Friday Night', 'wrong')
    await clickJoin()

    expect(store.hostedGame).toBe(hostedOnServer)
    expect(subscribeToGame).not.toHaveBeenCalled()
    expect(message()).toBe('No game matches that name and password.')
    expect(router.currentRoute.value.name).toBe('lobby')
  })
})
