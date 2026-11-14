import { GameStore, StoredGame } from "./game-store.ts";
import * as ServerModel from "./server-model.ts";

/**
 * Pipe step function, that returns the record one version newer.
 */
function nextVersion(record: StoredGame): StoredGame {
    return { ...record, version: record.version + 1 }
}


/**
 * Returns the game operations on the specified store.
 */
export function createGameApi(store: GameStore, randomness: ServerModel.Randomness): GameApi {
    async function fetchGame(name: string, password: string): Promise<StoredGame> {
        const record: StoredGame | undefined = await store.find(name)

        if (record === undefined || record.password !== password) {
            throw new Error('No game matches that name and password.')
        }

        return record
    }

    // The sandwich model: read the game, change it with a pure function, write the result.
    async function update(name: string, password: string, change: (record: StoredGame) => StoredGame): Promise<StoredGame> {
        const record: StoredGame = await fetchGame(name, password)
        const changed: StoredGame = _.flow([change, nextVersion])(record)

        await store.update(changed)
        return changed
    }

    async function draw(name: string, password: string, playerId: number): Promise<StoredGame> {
        return update(name, password, (record: StoredGame): StoredGame => ServerModel.draw(randomness, playerId, record))
    }

    async function startGame(name: string, password: string): Promise<StoredGame> {
        return update(name, password, ServerModel.startGame)
    }

    // hostGame, joinGame, play, sayUno and catchUno follow the same pattern.

    return { fetchGame, hostGame, joinGame, startGame, play, draw, sayUno, catchUno }
}
