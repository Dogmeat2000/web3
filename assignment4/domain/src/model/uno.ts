import {checkForWinner, createRound, hasEnded, Round, score} from "./round";
import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from "../utils/random_utils";
import { Card } from "./deck";
import {Player} from "./player";

export type Game = {
    playerNames: string[],
    currentRound: Round | undefined,
    targetScore: number,
    scores: number[],
    cardsPerPlayer: number,
    randomizer: Randomizer,
    shuffler: Shuffler<Card>,
    winner?: Player
}

/**
 * Creates a new game, based on the provided arguments.
 */
export function createGame(players: string[] = ['A', 'B'],
                           targetScore: number = 500,
                           randomizer: Randomizer = standardRandomizer,
                           shuffler: Shuffler<Card> = standardShuffler,
                           cardsPerPlayer: number = 7): Game {
    // Game Rule: Players must be between 2 and 10:
    if(players.length < 2 || players.length > 10) {
        throw new Error("Invalid number of players. Must be between 2 and 10 players")
    }

    // Game Logic: targetScore must be a positive number:
    if(targetScore <= 0) {
        throw new Error("Invalid target score. Must be larger than 0.")
    }

    // Game logic: Players must be dealt min. 1 card:
    if(cardsPerPlayer < 1) {
        throw new Error("Invalid cardsPerPlayer. Must be larger than 0.")
    }

    return {
        playerNames: players,
        currentRound: createRound(players, randomizer(players.length), shuffler, cardsPerPlayer, true),
        targetScore: targetScore,
        scores: players.map(() => 0),
        cardsPerPlayer: cardsPerPlayer,
        randomizer: randomizer,
        shuffler: shuffler
    }
}

export function play(move: (round: Round) => Round, game: Game): Game {
    const round: Round = move(game.currentRound!)

    if(!hasEnded(round)){
        return {
            ...game,
            currentRound: round
        }
    }

    // Game Rule: The winner of the round gets the score of the round.
    const roundWinnerId: number = game.playerNames.indexOf(checkForWinner(round)!.playerName)
    const scores: number[] = game.scores.map((playerScore: number, playerId: number): number => playerId === roundWinnerId ? playerScore + score(round)! : playerScore)

    // Game Rule: The game ends when a player reaches the target score.
    if(scores[roundWinnerId] >= game.targetScore) {
        return { ...game, scores, winner: game.currentRound!.players[roundWinnerId], currentRound: undefined }
    }

    // Game Rule: Otherwise, a new round starts.
    const nextDealer: number = (round.dealer.playerId + 1) % game.playerNames.length
    return {
        ...game,
        scores,
        currentRound: createRound(game.playerNames, nextDealer, game.shuffler, game.cardsPerPlayer)
    }
}