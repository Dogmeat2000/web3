import type { PublicGame } from '@domain/model/uno.dto.ts'

/**
 * Describes the data that is stored about a game. This is not the live game,
 * but what is expected to be found/persistence in the database.
 */
export interface StoredGame extends PublicGame {
    password: string
}

/**
 * Defines the store and associated methods, used to store a Game on the server.
 */
export interface GameStore {
    /**
     * Find any game with the provided name.
     * Returns a Promise that resolves with either the found game, or undefined if none could be found.
     */
    find(name: string): Promise<StoredGame | undefined>

    /**
     * Used to add a new game to the store.
     * Fails if any game with this name already exists.
     */
    add(game: StoredGame): Promise<void>

    /**
     * Updates any game with the specified name, if such exists in the store.
     */
    update(game: StoredGame): Promise<void>
}
