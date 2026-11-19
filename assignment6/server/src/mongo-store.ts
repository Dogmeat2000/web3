import { MongoClient, type Collection } from 'mongodb'
import type { GameStore, StoredGame } from './game-store.ts'

/**
 * Defines how long before created games are removed.
 */
const GAME_LIFETIME_HOURS: number = 24

/**
 * MongoDB Database document for each persisted game.
 */
type GameDocument = StoredGame & {
    /** The name of the game in lower case. */
    _id: string,
    expiresAt: Date
}

function toDocument(game: StoredGame): GameDocument {
    const expiresAt: Date = new Date(Date.now() + GAME_LIFETIME_HOURS * 60 * 60 * 1000)

    return { ...game, _id: game.name.trim().toLowerCase(), expiresAt }
}

/**
 * This is the MongoDB store integration.
 */
export class MongoStore implements GameStore {
    private readonly games: Collection<GameDocument>

    constructor(games: Collection<GameDocument>) {
        this.games = games
    }

    async find(name: string): Promise<StoredGame | undefined> {
        const document: GameDocument | null = await this.games.findOne({ _id: name.trim().toLowerCase() })

        if (document === null) {
            return undefined
        }

        const { _id, expiresAt, ...game } = document
        return game
    }

    async add(game: StoredGame): Promise<void> {
        await this.games.insertOne(toDocument(game))
    }

    async update(game: StoredGame): Promise<void> {
        const document: GameDocument = toDocument(game)

        // The game in the DB must be exactly one version older than this one.
        const result = await this.games.replaceOne({ _id: document._id, version: game.version - 1 }, document)

        if (result.matchedCount === 0) {
            throw new Error(`"${game.name}" was changed by someone else at the same moment, or is no longer hosted. Try again.`)
        }
    }
}

/**
 * Connects to the MongoDB server.
 */
async function connectMongoStore(connectionString: string, databaseName: string): Promise<MongoStore> {
    const client: MongoClient = new MongoClient(connectionString, { ignoreUndefined: true })
    await client.connect()

    const games: Collection<GameDocument> = client.db(databaseName).collection<GameDocument>('games')

    // Remove any already expired games upon first connection/reconnect
    await games.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

    return new MongoStore(games)
}

export default connectMongoStore
