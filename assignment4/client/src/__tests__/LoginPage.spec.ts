import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import { usePlayerStore } from '@/stores/playerStore.ts'

/** Mounts the login page with a real store and a real router kept in memory. */
async function mountLogin(chosenEarlier: string = '') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'login', component: LoginPage },
      { path: '/lobby', name: 'lobby', component: { render: () => h('p', 'lobby page') } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  const store = usePlayerStore()
  store.playerName = chosenEarlier
  const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } })

  const fill = async (playerName: string) => {
    await wrapper.find('#player-name').setValue(playerName)
  }
  const submit = async () => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }
  const message = () => wrapper.find('#form-error').text()

  return { wrapper, router, store, fill, submit, message }
}

describe('LoginPage', () => {
  it('asks for a name before letting the player in', async () => {
    const { wrapper, router, store, submit, message } = await mountLogin()

    await submit()

    expect(message()).toBe('Please enter a name')
    expect(wrapper.find('#player-name').attributes('aria-invalid')).toBe('true')
    expect(store.playerName).toBe('')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('does not take spaces for a name', async () => {
    const { router, store, fill, submit, message } = await mountLogin()

    await fill('   ')
    await submit()

    expect(message()).toBe('Please enter a name')
    expect(store.playerName).toBe('')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('clears the message as soon as the player edits the name', async () => {
    const { wrapper, fill, submit, message } = await mountLogin()
    await submit()

    await fill('A')

    expect(message()).toBe('')
    expect(wrapper.find('#player-name').attributes('aria-invalid')).toBeUndefined()
  })

  it('keeps the chosen name in lower case, without the spaces around it, and opens the lobby', async () => {
    const { router, store, fill, submit } = await mountLogin()

    await fill('  Anna ')
    await submit()

    expect(store.playerName).toBe('anna')
    expect(router.currentRoute.value.name).toBe('lobby')
  })

  it('shows the name chosen earlier, so the player can change it', async () => {
    const { wrapper, store, fill, submit } = await mountLogin('anna')

    expect((wrapper.find('#player-name').element as HTMLInputElement).value).toBe('anna')

    await fill('BO')
    await submit()

    expect(store.playerName).toBe('bo')
  })
})
