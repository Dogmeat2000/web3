import * as Round from '@domain/model/round.ts'
import { Card, Color} from '@domain/model/deck.ts'
import * as Uno from '@domain/model/uno.ts'
import type { GameData, GameStatus, RoundData } from '@domain/model/uno.dto.ts'
import { Randomizer, Shuffler } from '@domain/utils/random_utils.ts'
import type { StoredGame } from './game-store.ts'
import _ from 'lodash/fp.js'
import {Player} from "@domain/model/player.ts";
import {randomUUID} from "node:crypto";
import {Game} from "@domain/model/uno.ts";

/** Default names of all players. These are use if player for some reason has no custom name (i.e. for bots) */
const defaultPlayerNames: string[] = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8', 'player9', 'player10']

/** The shuffler and randomizer a game is played with. */
export type Randomness = {
    readonly shuffler: Shuffler<Card>,
    readonly randomizer: Randomizer
}

/** A stored game that is being played, together with the domain Game and Round rebuilt from it. */
type LoadedGame = { record: StoredGame, game: Uno.Game, round: Round.Round }

/**
 * Returns the name a person chose for themselves, in lower case and without spaces around it.
 */
/*function enforceLowerCasePlayerName(playerName: string): string {
    const lowerCasePlayerName: string = playerName.trim().toLowerCase()

    if (lowerCasePlayerName === '') {
        throw new Error('Please enter a name')
    }

    return lowerCasePlayerName
}*/

/**
 * The primary server model responsible for serving the game from the server store.
 */
//export class ServerModel {
    /*private readonly store: GameStore

    constructor(store: GameStore) {
        this.store = store
    }*/

    /**
     * Allows other players to join a hosted AND pending game.
     */
    /*async joinGame(name: string, password: string, playerName: string): Promise<StoredGame> {
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
    }*/

    /**
     * Starts a game, locking it so other human players cannot join it.
     */
    /*async startGame(name: string, password: string): Promise<StoredGame> {
        const record: StoredGame = await this.fetchGame(name, password, 'PENDING')

        record.status = 'ACTIVE'
        return this.save(record)
    }*/
//}

// Primary Game Server Model functions
/**
 * Creates a new game and places the host in it, under the name the host chose. Other players can join until it is started.
 */
export function createServerGame(gameName: string, password: string, playerCount: number, targetScore: number, hostPlayerName: string, randomness: Randomness): StoredGame {
    // The host is always the first player.
    const newGame: Game = Uno.createGame(
        [enforceLowerCasePlayerName(hostPlayerName), ...defaultPlayerNames.slice(1, playerCount)],
        validateTargetScore(targetScore),
        randomness.randomizer,
        randomness.shuffler)

    return {
        ...newGame,
        id: randomUUID(),
        name: enforceTrimmedGameName(gameName),
        password: requireGamePassword(password),
        joinedPlayers: [newGame.playerNames[0]],
        status: 'PENDING',
        version: 0,
        namedColor: null,
        lastRound: null,
    }
}


/**
 * Returns the stored game after the specified player plays a card.
 */
export function play(randomness: Randomness, playerId: number, cardIndex: number, record: StoredGame, namedColor?: Color): StoredGame {
    const checkedGame: StoredGame = _.flow([
        requireStatus('ACTIVE'),
        requireTurn(playerId)
    ])(record)

    const playedRound: Round.Round = Round.play(cardIndex, toGame(randomness, checkedGame).currentRound!, namedColor)

    return _.flow([
        applyMove(randomness, (): Round.Round => playedRound),
        finishIfWon
    ])(checkedGame)
}

/**
 * Returns the stored game after the specified player draws.
 */
export function draw(randomness: Randomness, playerId: number, record: StoredGame): StoredGame {
    return _.flow([
        requireStatus('ACTIVE'),
        requireTurn(playerId),
        applyMove(randomness, Round.draw)
    ])(record)
}

/**
 * Attempts to apply the effects of 'Say Uno' by the player given with the specified playerId.
 */
export function sayUno(randomness: Randomness, playerId: number, record: StoredGame): StoredGame {
    return _.flow([
        requireStatus('ACTIVE'),
        applyMove(randomness, (round: Round.Round): Round.Round => Round.sayUno(playerId, round))
    ])(record)
}

/**
 * Returns the stored game after the specified player calls out whoever forgot to say UNO.
 */
export function catchUno(randomness: Randomness, playerId: number, record: StoredGame): StoredGame {
    return _.flow([
        requireStatus('ACTIVE'),
        applyMove(randomness, accusePlayers(playerId))
    ])(record)
}


// Pipeline functions
/**
 * Pipe step function, to verify that the provided playerId corresponds with the currently active player. Throws an error if not.
 */
function requireTurn(playerId: number): (record: StoredGame) => StoredGame {
    return (record: StoredGame): StoredGame => {
        if (record.currentRound?.activePlayer?.playerId !== playerId) {
            throw new Error("It is not that player's turn.")
        }

        return record
    }
}

/**
 * Pipe step function, to verify that the game has the provided status. Throws an error if not.
 */
function requireStatus(status: GameStatus): (record: StoredGame) => StoredGame {
    return (record: StoredGame): StoredGame => {
        if (record.status !== status) {
            throw new Error(`"${record.name}" is ${record.status.toLowerCase()}.`)
        }

        return record
    }
}

/**
 * Pipe step function, that plays the move on the stored game's current round.
 */
function applyMove(randomness: Randomness, move: (round: Round.Round) => Round.Round): (record: StoredGame) => StoredGame {
    return (record: StoredGame): StoredGame => ({ ...record, ...toGameData(Uno.play(move, toGame(randomness, record))) })
}

/**
 * Pipe step function, accuse everyone of having forgot to say Uno, since the domain ensures only the previous player can successfully be accused.
 */
function accusePlayers(accusingPlayerId: number): (round: Round.Round) => Round.Round {
    return (round: Round.Round): Round.Round => round.players
        .filter((player: Player): boolean => player.playerId !== accusingPlayerId)
        .reduce((currentRound: Round.Round, player: Player): Round.Round =>
            Round.catchUnoFailure({ accuser: accusingPlayerId, accused: player.playerId }, currentRound), round)
}

/**
 * Pipe step function, that converts Game domain data into store friendly GameData types.
 */
function toGameData(game: Uno.Game): GameData {
    const { randomizer, shuffler, currentRound, ...gameData } = game

    return { ...gameData, currentRound: currentRound === undefined ? undefined : toRoundData(currentRound) }
}

/**
 * Pipe step function, that converts Round domain data into store friendly RoundData types.
 */
function toRoundData(round: Round.Round): RoundData {
    const { shuffler, ...roundData } = round

    return roundData
}

/**
 * Pipe step function, that converts the domain game of a stored game, with the shuffler and randomizer put back.
 */
function toGame(randomness: Randomness, record: StoredGame): Uno.Game {
    return {
        playerNames: record.playerNames,
        currentRound: record.currentRound === undefined ? undefined : { ...record.currentRound, shuffler: randomness.shuffler },
        targetScore: record.targetScore,
        scores: record.scores,
        cardsPerPlayer: record.cardsPerPlayer,
        randomizer: randomness.randomizer,
        shuffler: randomness.shuffler,
        winner: record.winner
    }
}

/**
 * Pipe step function, that returns a trimmed name. Throws an error if name is empty.
 */
function enforceTrimmedGameName(name: string): string {
    const trimmedName: string = name.trim()

    if (trimmedName === '') {
        throw new Error('Enter the name of a game.')
    }

    return trimmedName
}

/**
 * Pipe step function, that verifies and returns a games password. Throws an error if password is empty.
 */
function requireGamePassword(password: string): string {
    if (password === '') {
        throw new Error('Enter the game password.')
    }

    return password
}

/**
 * Pipe step function, that verifies and returns a player count. Throws an error if player count is invalid.
 */
function validatePlayerCount(playerCount: number): number {
    if (playerCount < 2 || playerCount > 10) {
        throw new Error('Number of players must be between 2 and 10.')
    }

    return playerCount
}

/**
 * Pipe step function, that verifies and returns the target score. Throws an error if target score is invalid.
 */
function validateTargetScore(targetScore: number): number {
    if (targetScore < 1) {
        throw new Error('Target score must be above 0')
    }

    return targetScore
}

/**
 * Pipe step function, that enforces trimmed lowercase player names in Stored Games. Throws an error if name is empty.
 */
function enforceLowerCasePlayerName(playerName: string): string {
    const lowerCasePlayerName: string = playerName.trim().toLowerCase()

    if (lowerCasePlayerName === '') {
        throw new Error('Please enter a name')
    }

    return lowerCasePlayerName
}

/**
 * Returns a pipe step that stores the named color, or the result of the played round once it has ended.
 */
function recordPlay(playerId: number, namedColor: Color | undefined, playedRound: Round.Round): (record: StoredGame) => StoredGame {
    return (record: StoredGame): StoredGame => {
        if(!Round.hasEnded(playedRound)){
            return { ...record, namedColor: namedColor === undefined ? null : { playerId, color: namedColor } }
        } else {
            return {
                ...record,
                namedColor: null,
                lastRound: {
                roundsPlayed: (record.lastRound?.roundsPlayed ?? 0) + 1,
                    winner: Round.checkForWinner(playedRound)!.playerId,
                    addedScore: Round.score(playedRound) ?? 0
            }
            }
        }
    }
}

/**
 * Returns the record as finished when its game has a winner.
 */
function finishIfWon(record: StoredGame): StoredGame {
    return record.winner === undefined ? record : { ...record, status: 'FINISHED' }
}