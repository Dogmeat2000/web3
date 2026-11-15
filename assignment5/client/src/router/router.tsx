import { createBrowserRouter } from 'react-router'
import Login from '../views/LoginPage.tsx'
import Lobby from '../views/LobbyPage.tsx'
import Host from '../views/HostPage.tsx'
import Game from '../views/GamePage.tsx'

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/lobby', element: <Lobby /> },
  { path: '/host', element: <Host /> },
  { path: '/game/:name', element: <Game /> },
])

export default router
