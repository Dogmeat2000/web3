import { describe, it, expect } from 'vitest'
import { h, markRaw } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { GameImpl } from '@domain/model/uno.impl'
import LobbyPage from '../LobbyPage.vue'
import { useGameStore } from '@/stores/gameStore.ts'

/** Puts a game in the store, as the host page will once it exists. */
function hostInStore(store: ReturnType<typeof useGameStore>) {
  store.settings = { name: 'Friday Night', password: 'hunter2', playerCount: 4, targetScore: 500 }
  store.game = markRaw(new GameImpl(['You', 'Bot 1', 'Bot 2', 'Bot 3'], 500))
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

    expect(router.currentRoute.value.fullPath).toBe('/game/Friday%20Night')
  })

  it('Join Game shows why it could not find the game and stays in the lobby', async () => {
    const { router, store, fill, clickJoin, message } = await mountLobby()
    hostInStore(store)

    await fill('Friday Night', 'wrong')
    await clickJoin()

    expect(message()).toBe('No game matches that name and password.')
    expect(router.currentRoute.value.name).toBe('lobby')
  })
})
