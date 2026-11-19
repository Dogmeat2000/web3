import type { GameStore, StoredGame } from './game-store.ts'

/**
 * This is just a simple In-Memory-Storage for games
 * that are created and played while the server is running.
 */
export class MemoryStore implements GameStore {
    private readonly games: Map<string, StoredGame> = new Map<string, StoredGame>()


    async find(name: string): Promise<StoredGame | undefined> {
        const game: StoredGame | undefined = this.games.get(name.trim().toLowerCase())

        return game === undefined ? undefined : structuredClone(game)
    }

    async add(game: StoredGame): Promise<void> {
        const key: string = game.name.trim().toLowerCase()

        if (this.games.has(key)) {
            throw new Error(`A game named "${game.name}" is already hosted.`)
        }

        this.games.set(key, structuredClone(game))
    }

    async update(game: StoredGame): Promise<void> {
        const key: string = game.name.trim().toLowerCase()

        const stored: StoredGame | undefined = this.games.get(key)

        if (stored === undefined) {
            throw new Error(`No game named "${game.name}" is hosted.`)
        }

        if (stored.version !== game.version - 1) {
            throw new Error(`"${game.name}" was changed by someone else at the same moment. Try again.`)
        }

        this.games.set(key, structuredClone(game))
    }
}
