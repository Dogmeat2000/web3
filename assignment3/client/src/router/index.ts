import { createRouter, createWebHistory } from 'vue-router'
import LobbyPage from '@/views/LobbyPage.vue'
import HostPage from '@/views/HostPage.vue'
import GamePage from '@/views/GamePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: LobbyPage,
    },
    {
      path: '/host',
      name: 'host',
      component: HostPage,
    },
    {
      path: '/game/:name',
      name: 'game',
      component: GamePage,
    },
  ],
})

export default router
