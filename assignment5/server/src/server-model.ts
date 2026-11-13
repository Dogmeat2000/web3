import { randomUUID } from 'node:crypto'
import type { Round } from '@domain/model/round.ts'
import type { Color } from '@domain/model/color.ts'
import { GameImpl } from '@domain/model/uno.impl.ts'
import { toGame } from '@domain/model/uno.memento.ts'
import type { GameStatus } from '@domain/model/uno.dto.ts'
import { standardRandomizer, standardShuffler } from '@domain/utils/random_utils.ts'
import type { GameStore, StoredGame } from './game-store.ts'
import {Game} from "@domain/model/uno.ts";

/** Default names of all players. These are use if player for some reason has no custom name (i.e. for bots) */
const playerNames: string[] = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6', 'Player7', 'Player8', 'Player9', 'Player10']

/** A stored game that is being played, together with the domain Game and Round rebuilt from it. */
type LoadedGame = { record: StoredGame, game: Game, round: Round }

function requireTurn(round: Round, playerId: number): void {
    if (round.playerInTurn() !== playerId) {
        throw new Error("It is not that player's turn.")
    }
}

/**
 * Returns the name a person chose for themselves, in lower case and without spaces around it.
 */
function enforceLowerCasePlayerName(playerName: string): string {
    const lowerCasePlayerName: string = playerName.trim().toLowerCase()

    if (lowerCasePlayerName === '') {
        throw new Error('Please enter a name')
    }

    return lowerCasePlayerName
}

/**
 * The primary server model responsible for serving the game from the server store.
 */
export class ServerModel {
    private readonly store: GameStore

    constructor(store: GameStore) {
        this.store = store
    }

    /**
     * Loads the game with this name and password.
     */
    async fetchGame(name: string, password: string, needed?: GameStatus): Promise<StoredGame> {
        const record: StoredGame | undefined = await this.store.find(name)
        if (record === undefined || record.password !== password) {
            throw new Error('No game matches that name and password.')
        }

        if (needed !== undefined && record.status !== needed) {
            throw new Error(`"${record.name}" is ${record.status.toLowerCase()}.`)
        }

        return record
    }

    /**
     * Creates a new game and places the host in it, under the name the host chose. Other players can join until it is started.
     */
    async hostGame(name: string, password: string, playerCount: number, targetScore: number, playerName: string): Promise<StoredGame> {
        const trimmedGameName: string = name.trim()
        if (trimmedGameName === '') {
            throw new Error('Enter the name of a game.')
        }

        if (password === '') {
            throw new Error('Enter the game password.')
        }

        if (playerCount < 2 || playerCount > 10) {
            throw new Error('Number of players must be between 2 and 10.')
        }

        if (targetScore < 1) {
            throw new Error('Target score must be above 0')
        }

        const hostName: string = enforceLowerCasePlayerName(playerName)
        const existing: StoredGame | undefined = await this.store.find(trimmedGameName)

        if (existing !== undefined) {
            throw new Error(`A game named "${trimmedGameName}" is already hosted.`)
        }

        // The host is always the first player.
        const game = new GameImpl([hostName, ...playerNames.slice(1, playerCount)], targetScore)
        const record: StoredGame = {
            ...game.toMemento(),
            id: randomUUID(),
            name: trimmedGameName,
            password,
            joinedPlayers: [hostName],
            status: 'PENDING',
            version: 0,
            namedColor: null,
            lastRound: null,
        }

        await this.store.add(record)

        return record
    }

    /**
     * Allows other players to join a hosted AND pending game.
     */
    async joinGame(name: string, password: string, playerName: string): Promise<StoredGame> {
        const record: StoredGame = await this.fetchGame(name, password, 'PENDING')
        const joiningName: string = enforceLowerCasePlayerName(playerName)

        if (record.joinedPlayers.length >= record.players.length) {
            throw new Error(`"${record.name}" is already full.`)
        }

        // A name can only be used once in a game.
        if (record.joinedPlayers.includes(joiningName)) {
            throw new Error(`A player named "${joiningName}" has already joined "${record.name}".`)
        }

        const playerId: number = record.joinedPlayers.length
        record.joinedPlayers.push(joiningName)
        record.players[playerId] = joiningName

        if (record.currentRound !== undefined) {
            record.currentRound.players[playerId] = joiningName
        }

        return this.save(record)
    }

    /**
     * Starts a game, locking it so other human players cannot join it.
     */
    async startGame(name: string, password: string): Promise<StoredGame> {
        const record: StoredGame = await this.fetchGame(name, password, 'PENDING')

        record.status = 'ACTIVE'
        return this.save(record)
    }

    /**
     * Attempts to play a move by the player given with the specified playerId.
     */
    async play(name: string, password: string, playerId: number, cardIndex: number, namedColor?: Color): Promise<StoredGame> {
        const { record, game, round }: LoadedGame = await this.loadActiveGame(name, password)
        requireTurn(round, playerId)

        if (!round.canPlay(cardIndex)) {
            throw new Error('That card cannot be played.')
        }

        round.play(cardIndex, namedColor)
        record.namedColor = namedColor === undefined ? null : { playerId, color: namedColor }

        // The game has already started the next round by now, but `round` is still the one that was just played.
        if (round.hasEnded()) {
            record.namedColor = null
            record.lastRound = { roundsPlayed: (record.lastRound?.roundsPlayed ?? 0) + 1, winner: round.winner()!, addedScore: round.score() ?? 0 }
        }

        return this.saveGame(record, game)
    }

    /**
     * Attempts to draw a card by the player given with the specified playerId.
     */
    async draw(name: string, password: string, playerId: number): Promise<StoredGame> {
        const { record, game, round }: LoadedGame = await this.loadActiveGame(name, password)
        requireTurn(round, playerId)

        round.draw()

        return this.saveGame(record, game)
    }

    /**
     * Attempts to 'Say Uno' by the player given with the specified playerId.
     */
    async sayUno(name: string, password: string, playerId: number): Promise<StoredGame> {
        const { record, game, round }: LoadedGame = await this.loadActiveGame(name, password)

        round.sayUno(playerId)

        return this.saveGame(record, game)
    }

    /**
     * Lets a player call out whoever forgot to say UNO.
     */
    async catchUno(name: string, password: string, playerId: number): Promise<StoredGame> {
        const { record, game, round }: LoadedGame = await this.loadActiveGame(name, password)

        // Strategy here is just to accuse everyone, since the domain ensures only the previous player can successfully be accused.
        for (let accusedPlayerId: number = 0; accusedPlayerId < round.playerCount; accusedPlayerId++) {
            if (accusedPlayerId !== playerId && round.catchUnoFailure({ accuser: playerId, accused: accusedPlayerId })) {
                break
            }
        }

        return this.saveGame(record, game)
    }

    /**
     * Loads a game that is being played, and rebuilds it as a domain Game with its current Round.
     */
    private async loadActiveGame(name: string, password: string): Promise<LoadedGame> {
        const record: StoredGame = await this.fetchGame(name, password, 'ACTIVE')
        const game: Game = toGame(record, standardShuffler, standardRandomizer)
        const round: Round | undefined = game.currentRound()

        if (round === undefined) {
            throw new Error(`"${record.name}" has no round to play.`)
        }

        return { record, game, round }
    }

    /**
     * Saves a game after a move. Returns the stored game after saving completes.
     */
    private async saveGame(record: StoredGame, game: Game): Promise<StoredGame> {
        if (game.winner() !== undefined) {
            record.status = 'FINISHED'
        }

        // The record is the game's memento with the hosting fields added
        return this.save({ ...record, ...game.toMemento() })
    }

    private async save(record: StoredGame): Promise<StoredGame> {
        record.version++
        await this.store.update(record)
        return record
    }
}
