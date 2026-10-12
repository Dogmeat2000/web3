import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { GameImpl } from '@domain/model/uno.impl.ts'
import HostPage from '../views/HostPage.vue'
import { useGameStore } from '@/stores/gameStore.ts'
import { hostGame, subscribeToGame } from '@/graphql/gameConnection.ts'
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

async function mountHost() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'lobby', component: { template: '<p>lobby</p>' } },
      { path: '/host', name: 'host', component: HostPage },
      { path: '/game/:name', name: 'game', component: { template: '<p>game</p>' } },
    ],
  })
  await router.push('/host')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useGameStore()
  store.prepareHost({ name: 'Friday Night', password: 'hunter2' })

  const wrapper = mount(HostPage, { global: { plugins: [pinia, router] } })
  const host = async () => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }
  const message = () => wrapper.find('#form-error').text()

  return { wrapper, router, store, host, message }
}

describe('HostPage', () => {
  beforeEach(() => {
    vi.mocked(hostGame).mockReset()
    vi.mocked(subscribeToGame).mockReset()
    vi.mocked(hostGame).mockResolvedValue(hostedOnServer)
  })

  it('opens the server connection when the game is hosted', async () => {
    const { router, store, host } = await mountHost()

    await host()

    expect(hostGame).toHaveBeenCalledWith({ name: 'Friday Night', password: 'hunter2', playerCount: 10, targetScore: 500 })
    expect(subscribeToGame).toHaveBeenCalledOnce()
    expect(store.localPlayerId).toBe(0)
    expect(store.game).not.toBeNull()
    expect(router.currentRoute.value.fullPath).toBe('/game/Friday%20Night')
  })

  it('stays on the host page when the server rejects the game', async () => {
    vi.mocked(hostGame).mockRejectedValueOnce(new Error('A game named "Friday Night" is already hosted.'))
    const { router, store, host, message } = await mountHost()

    await host()

    expect(message()).toBe('A game named "Friday Night" is already hosted.')
    expect(store.game).toBeNull()
    expect(subscribeToGame).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('host')
  })
})
