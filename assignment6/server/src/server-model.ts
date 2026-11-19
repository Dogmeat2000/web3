import * as Round from '@domain/model/round.ts'
import * as Uno from '@domain/model/uno.ts'
import { Card, Color} from '@domain/model/deck.ts'
import { Randomizer, Shuffler } from '@domain/utils/random_utils.ts'
import type { GameData, GameStatus, RoundData } from '@domain/model/uno.dto.ts'
import type { StoredGame } from './game-store.ts'
import _ from 'lodash/fp.js'
import { Player } from "@domain/model/player.ts";

/** Default names of all players. These are use if player for some reason has no custom name (i.e. for bots) */
const defaultPlayerNames: string[] = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8', 'player9', 'player10']

/** The shuffler and randomizer a game is played with. */
export type Randomness = {
    readonly shuffler: Shuffler<Card>,
    readonly randomizer: Randomizer
}

// Primary Game Server Model functions
/**
 * Creates a new game and places the host in it, under the name the host chose. Other players can join until it is started.
 */
export function createServerGame(id: string, gameName: string, password: string, playerCount: number, targetScore: number, hostPlayerName: string, randomness: Randomness): StoredGame {
    validatePlayerCount(playerCount)

    // The host is always the first player.
    const newGame: Uno.Game = Uno.createGame(
        [enforceLowerCasePlayerName(hostPlayerName), ...defaultPlayerNames.slice(1, playerCount)],
        validateTargetScore(targetScore),
        randomness.randomizer,
        randomness.shuffler)

    return {
        ...toGameData(newGame),
        id: id,
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
 * Returns the pending game with the specified player added under the name they chose.
 */
export function joinServerGame(playerName: string, record: StoredGame): StoredGame {
    const pending: StoredGame = requireStatus('PENDING')(record)
    const joiningName: string = enforceLowerCasePlayerName(playerName)

    if (pending.joinedPlayers.length >= pending.playerNames.length) {
        throw new Error(`"${pending.name}" is already full.`)
    }

    // A name can only be used once in a game.
    if (pending.joinedPlayers.includes(joiningName)) {
        throw new Error(`A player named "${joiningName}" has already joined "${pending.name}".`)
    }

    const playerId: number = pending.joinedPlayers.length

    return {
        ...pending,
        joinedPlayers: [...pending.joinedPlayers, joiningName],
        playerNames: _.set(playerId, joiningName, pending.playerNames),
        currentRound: pending.currentRound === undefined ? undefined : renamePlayer(playerId, joiningName, pending.currentRound)
    }
}

/**
 * Starts a game, locking it so other human players cannot join it.
 */
export function startServerGame(record: StoredGame): StoredGame {
    return _.flow([
        requireStatus('PENDING'),
        start
    ])(record)
}

/**
 * Returns the stored game after the specified player plays a card.
 */
export function play(randomness: Randomness, playerId: number, cardIndex: number, namedColor: Color | undefined, record: StoredGame): StoredGame {
    const checkedGame: StoredGame = _.flow([
        requireStatus('ACTIVE'),
        requireTurn(playerId)
    ])(record)

    const playedRound: Round.Round = Round.play(cardIndex, toGame(randomness, checkedGame).currentRound!, namedColor)

    return _.flow([
        applyMove(randomness, (): Round.Round => playedRound),
        recordPlay(playerId, namedColor, playedRound),
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
    return (round: Round.Round): Round.Round =>
        _.reject(_.matches({ playerId: accusingPlayerId }), round.players)
        .reduce((currentRound: Round.Round, player: Player): Round.Round =>
            Round.catchUnoFailure({ accuser: accusingPlayerId, accused: player.playerId }, currentRound), round)
}

/**
 * Returns the converted Game domain data into store friendly GameData types.
 */
function toGameData(game: Uno.Game): GameData {
    return {
        ..._.omit(['randomizer', 'shuffler', 'currentRound'], game),
        currentRound: game.currentRound === undefined ? undefined : toRoundData(game.currentRound)
    }
}

/**
 * Returns the converted Round domain data into store friendly RoundData types.
 */
function toRoundData(round: Round.Round): RoundData {
    return _.omit(['shuffler'], round)
}

/**
 * Returns the converted the domain game of a stored game, with the shuffler and randomizer put back.
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
 * Returns the trimmed name. Throws an error if name is empty.
 */
function enforceTrimmedGameName(name: string): string {
    const trimmedName: string = name.trim()

    if (trimmedName === '') {
        throw new Error('Enter the name of a game.')
    }

    return trimmedName
}

/**
 * Returns the password after verification. Throws an error if password is empty.
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

/**
 * Returns the record as started.
 */
function start(record: StoredGame): StoredGame {
    return { ...record, status: 'ACTIVE' }
}

/**
 * Returns the round with the specified player renamed, in the dealer and active player copies too.
 */
function renamePlayer(playerId: number, playerName: string, round: RoundData): RoundData {
    const rename = (player: Player): Player => player.playerId === playerId ? { ...player, playerName } : player

    return {
        ...round,
        players: round.players.map(rename),
        dealer: rename(round.dealer),
        activePlayer: round.activePlayer === undefined ? undefined : rename(round.activePlayer)
    }
}