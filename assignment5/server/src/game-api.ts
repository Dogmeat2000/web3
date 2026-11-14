import { GameStore, StoredGame } from "./game-store.ts";
import * as ServerModel from "./server-model.ts";
import _ from 'lodash/fp.js'
import { Color } from "@domain/model/deck.ts";
import {randomUUID} from "node:crypto";

/** The game operations the resolvers call; each one reads and writes the store. */
export type GameApi = {
    readonly fetchGame: (name: string, password: string) => Promise<StoredGame>,
    readonly hostGame: (name: string, password: string, playerCount: number, targetScore: number, playerName: string) => Promise<StoredGame>,
    readonly joinGame: (name: string, password: string, playerName: string) => Promise<StoredGame>,
    readonly startGame: (name: string, password: string) => Promise<StoredGame>,
    readonly play: (name: string, password: string, playerId: number, cardIndex: number, namedColor?: Color) => Promise<StoredGame>,
    readonly draw: (name: string, password: string, playerId: number) => Promise<StoredGame>,
    readonly sayUno: (name: string, password: string, playerId: number) => Promise<StoredGame>,
    readonly catchUno: (name: string, password: string, playerId: number) => Promise<StoredGame>
}

// API functions:
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

    async function hostGame(name: string, password: string, playerCount: number, targetScore: number, playerName: string): Promise<StoredGame> {
        const record: StoredGame | undefined = await store.find(name.trim())

        if (record !== undefined) {
            throw new Error(`A game named "${name}" is already hosted.`)
        }

        const newGameRecord: StoredGame = ServerModel.createServerGame(randomUUID(), name, password, playerCount, targetScore, playerName, randomness)
        await store.add(newGameRecord)
        return newGameRecord
    }

    async function joinGame(name: string, password: string, playerName: string): Promise<StoredGame> {
        return update(name, password, (record: StoredGame): StoredGame => ServerModel.joinServerGame(playerName, record))
    }

    async function startGame(name: string, password: string): Promise<StoredGame> {
        return update(name, password, ServerModel.startServerGame)
    }

    async function play(name: string, password: string, playerId: number, cardIndex: number, namedColor?: Color): Promise<StoredGame> {
        return update(name, password, (record: StoredGame): StoredGame => ServerModel.play(randomness, playerId, cardIndex, namedColor, record))
    }

    async function draw(name: string, password: string, playerId: number): Promise<StoredGame> {
        return update(name, password, (record: StoredGame): StoredGame => ServerModel.draw(randomness, playerId, record))
    }

    async function sayUno(name: string, password: string, playerId: number): Promise<StoredGame> {
        return update(name, password, (record: StoredGame): StoredGame => ServerModel.sayUno(randomness, playerId, record))
    }

    async function catchUno(name: string, password: string, playerId: number): Promise<StoredGame> {
        return update(name, password, (record: StoredGame): StoredGame => ServerModel.catchUno(randomness, playerId, record))
    }

    // The sandwich model: read the game, change it with a pure function, write the result.
    async function update(name: string, password: string, change: (record: StoredGame) => StoredGame): Promise<StoredGame> {
        const record: StoredGame = await fetchGame(name, password)
        const changed: StoredGame = _.flow([change, nextVersion])(record)

        await store.update(changed)
        return changed
    }

    return { fetchGame, hostGame, joinGame, startGame, play, draw, sayUno, catchUno }
}

// Piped functions:
/**
 * Pipe step function, that returns the record one version newer.
 */
function nextVersion(record: StoredGame): StoredGame {
    return { ...record, version: record.version + 1 }
}
