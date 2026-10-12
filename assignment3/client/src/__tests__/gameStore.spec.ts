import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { GameImpl } from '@domain/model/uno.impl.ts'
import { useGameStore } from '../stores/gameStore.ts'
import { catchUno, draw, fetchGame, hostGame, joinGame, play, sayUno, startGame, subscribeToGame } from '@/graphql/gameConnection.ts'
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

/** A game as the server sends it, dealt for the named players. */
function served(players: string[], changes: Partial<PublicGame> = {}): PublicGame {
  return {
    ...new GameImpl(players, 500).toMemento(),
    id: 'game-1',
    name: 'Friday Night',
    joinedPlayers: ['host'],
    status: 'PENDING',
    version: 0,
    namedColor: null,
    lastRound: null,
    ...changes,
  }
}

const hostSettings = { name: 'Friday Night', password: 'hunter2', playerCount: 4, targetScore: 500 }
const credentials = { name: 'Friday Night', password: 'hunter2' }

describe('game store', () => {
  // A fresh Pinia per test, so no test sees another's game.
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('prepareHost keeps the trimmed name and the password for the host page', () => {
    const store = useGameStore()

    store.prepareHost({ name: '  Friday Night ', password: ' hunter2' })

    expect(store.pendingHost).toEqual({ name: 'Friday Night', password: ' hunter2' })
  })

  it('hostNewGame asks the server to deal, seats this browser as the host, and listens for updates', async () => {
    vi.mocked(hostGame).mockResolvedValueOnce(served(['Player1', 'Player2', 'Player3', 'Player4']))
    const store = useGameStore()

    await expect(store.hostNewGame(hostSettings)).resolves.toBe(true)

    expect(hostGame).toHaveBeenCalledWith(hostSettings)
    expect(subscribeToGame).toHaveBeenCalledWith(hostSettings, expect.any(Function))
    expect(store.hostedGame).toMatchObject({ name: 'Friday Night', joinedPlayers: ['host'], status: 'PENDING' })
    expect(store.password).toBe('hunter2')
    expect(store.localPlayerId).toBe(0)
    expect(store.game?.player(3)).toBe('Player4')
  })

  it('hostNewGame keeps the server error and holds no game when it is refused', async () => {
    vi.mocked(hostGame).mockRejectedValueOnce(new Error('A game named "Friday Night" is already hosted.'))
    const store = useGameStore()

    await expect(store.hostNewGame(hostSettings)).resolves.toBe(false)

    expect(store.error).toBe('A game named "Friday Night" is already hosted.')
    expect(store.hostedGame).toBeNull()
    expect(store.game).toBeNull()
    expect(subscribeToGame).not.toHaveBeenCalled()
  })

  describe('connectJoinAttempt', () => {
    it('keeps the server error when no game matches the name and password', async () => {
      vi.mocked(fetchGame).mockRejectedValueOnce(new Error('No game matches that name and password.'))
      const store = useGameStore()

      await expect(store.connectJoinAttempt({ name: 'Friday Night', password: 'nope' })).resolves.toBe(false)

      expect(store.error).toBe('No game matches that name and password.')
      expect(joinGame).not.toHaveBeenCalled()
      expect(subscribeToGame).not.toHaveBeenCalled()
    })

    it('takes the next seat, rebuilds the game from the memento the server served, and listens for updates', async () => {
      const joined = served(['Player1', 'Player2'], { version: 1, joinedPlayers: ['host', 'player'] })
      vi.mocked(fetchGame).mockResolvedValueOnce(served(['Player1', 'Player2']))
      vi.mocked(joinGame).mockResolvedValueOnce(joined)
      const store = useGameStore()

      await expect(store.connectJoinAttempt(credentials)).resolves.toBe(true)

      expect(joinGame).toHaveBeenCalledWith(credentials)
      expect(subscribeToGame).toHaveBeenCalledWith(credentials, expect.any(Function))
      expect(store.localPlayerId).toBe(1)
      expect(store.password).toBe('hunter2')
      expect(store.game?.player(0)).toBe('Player1')
      expect(store.game?.player(1)).toBe('Player2')
      expect(store.game?.currentRound()?.playerHand(0)).toEqual(joined.currentRound?.hands[0])
    })

    it('holds no game and does not listen when the game can be found but not joined', async () => {
      vi.mocked(fetchGame).mockResolvedValueOnce(served(['Player1', 'Player2'], { status: 'ACTIVE' }))
      vi.mocked(joinGame).mockRejectedValueOnce(new Error('"Friday Night" is active.'))
      const store = useGameStore()

      await expect(store.connectJoinAttempt(credentials)).resolves.toBe(false)

      expect(store.error).toBe('"Friday Night" is active.')
      expect(store.hostedGame).toBeNull()
      expect(subscribeToGame).not.toHaveBeenCalled()
    })

    it('keeps its seat, without joining again, when this browser already holds the game', async () => {
      const players = ['Player1', 'Player2', 'Player3', 'Player4']
      vi.mocked(hostGame).mockResolvedValueOnce(served(players))
      vi.mocked(fetchGame).mockResolvedValueOnce(served(players, { version: 2, joinedPlayers: ['host', 'player', 'player'] }))
      const store = useGameStore()
      await store.hostNewGame(hostSettings)

      await expect(store.connectJoinAttempt(credentials)).resolves.toBe(true)

      expect(joinGame).not.toHaveBeenCalled()
      expect(store.localPlayerId).toBe(0)
      expect(store.hostedGame?.joinedPlayers).toHaveLength(3)
    })
  })

  describe('games from the server', () => {
    /** A store that joined a game at version 3, and the function the subscription delivers updates with. */
    async function joinAndListen() {
      let push: (game: PublicGame) => void = () => {}
      vi.mocked(fetchGame).mockResolvedValueOnce(served(['Player1', 'Player2'], { version: 2 }))
      vi.mocked(joinGame).mockResolvedValueOnce(served(['Player1', 'Player2'], { version: 3, joinedPlayers: ['host', 'player'] }))
      vi.mocked(subscribeToGame).mockImplementationOnce((_credentials, gameListener) => {
        push = gameListener
      })
      const store = useGameStore()
      await store.connectJoinAttempt(credentials)
      return { store, push: (game: PublicGame) => push(game) }
    }

    it('shows a newer game from the subscription, and drops an older one that arrives late', async () => {
      const { store, push } = await joinAndListen()
      const shown = store.game

      push(served(['Old', 'Reply'], { version: 2 }))
      expect(store.game).toBe(shown)

      push(served(['Ann', 'Bo'], { version: 4, status: 'ACTIVE' }))
      expect(store.game?.player(0)).toBe('Ann')
      expect(store.game?.player(1)).toBe('Bo')
      expect(store.hostedGame?.status).toBe('ACTIVE')
    })

    it('shows another game whatever its version, because versions only compare within one game', async () => {
      const { store, push } = await joinAndListen()

      push(served(['Cy', 'Di'], { id: 'game-2', version: 0 }))

      expect(store.game?.player(0)).toBe('Cy')
    })

    it('knows who has said UNO in the rebuilt game, because the memento carries it', async () => {
      const { store, push } = await joinAndListen()
      const played = new GameImpl(['Player1', 'Player2', 'Player3'], 500)
      played.currentRound()!.playerObj(1)!.hasSaidUno = true

      push(served(['Player1', 'Player2', 'Player3'], { version: 4, ...played.toMemento() }))

      const round = store.game!.currentRound()!
      expect([0, 1, 2].map((id) => round.playerObj(id)!.hasSaidUno)).toEqual([false, true, false])
    })
  })

  it('startGame closes joining', async () => {
    const players = ['Player1', 'Player2', 'Player3', 'Player4']
    vi.mocked(hostGame).mockResolvedValueOnce(served(players))
    vi.mocked(startGame).mockResolvedValueOnce(served(players, { version: 1, status: 'ACTIVE' }))
    const store = useGameStore()
    await store.hostNewGame(hostSettings)

    await expect(store.startGame()).resolves.toBe(true)

    expect(startGame).toHaveBeenCalledWith(credentials)
    expect(store.hostedGame?.status).toBe('ACTIVE')
  })

  describe('moves', () => {
    const players = ['Player1', 'Player2', 'Player3', 'Player4']

    /** A store that hosts a started game, with this browser in seat 0. */
    async function hostStarted() {
      vi.mocked(hostGame).mockResolvedValueOnce(served(players, { version: 1, status: 'ACTIVE' }))
      const store = useGameStore()
      await store.hostNewGame(hostSettings)
      return store
    }

    it('playCard sends the move for the local seat and shows the game the server answers with', async () => {
      const store = await hostStarted()
      vi.mocked(play).mockResolvedValueOnce(served(['Ann', 'Bo', 'Cy', 'Di'], { version: 2, status: 'ACTIVE' }))

      await expect(store.playCard(3)).resolves.toBe(true)

      expect(play).toHaveBeenCalledWith(credentials, 0, 3, undefined)
      expect(store.game?.player(0)).toBe('Ann')
    })

    it('playCard can name a color, and can move for a bot seat', async () => {
      const store = await hostStarted()
      vi.mocked(play).mockResolvedValueOnce(served(players, { version: 2, status: 'ACTIVE' }))

      await store.playCard(0, 'BLUE', 2)

      expect(play).toHaveBeenCalledWith(credentials, 2, 0, 'BLUE')
    })

    it('drawCard, sayUno and catchUno send the seat that acts', async () => {
      const store = await hostStarted()
      vi.mocked(draw).mockResolvedValueOnce(served(players, { version: 2, status: 'ACTIVE' }))
      vi.mocked(sayUno).mockResolvedValueOnce(served(players, { version: 3, status: 'ACTIVE' }))
      vi.mocked(catchUno).mockResolvedValueOnce(served(players, { version: 4, status: 'ACTIVE' }))

      await store.drawCard()
      await store.sayUno(1)
      await store.catchUno()

      expect(draw).toHaveBeenCalledWith(credentials, 0)
      expect(sayUno).toHaveBeenCalledWith(credentials, 1)
      expect(catchUno).toHaveBeenCalledWith(credentials, 0)
    })

    it('a move the server refuses leaves the game as it was and keeps the reason', async () => {
      const store = await hostStarted()
      const before = store.game
      vi.mocked(draw).mockRejectedValueOnce(new Error("It is not that player's turn."))

      await expect(store.drawCard()).resolves.toBe(false)

      expect(store.game).toBe(before)
      expect(store.error).toBe("It is not that player's turn.")
    })
  })
})
