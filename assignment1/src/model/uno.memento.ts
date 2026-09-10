import { RoundMemento, toRound } from "./round.memento";
import { Card } from "./deck";
import { Round } from "./round";
import { Game } from "./uno";
import { Randomizer, Shuffler } from "../utils/random_utils";
import { GameImpl } from "./uno.impl";

export type GameMemento = {
    players: string[],
    currentRound: RoundMemento | undefined,
    targetScore: number,
    scores: number[],
    cardsPerPlayer: number
}

/**
 * Converts a memento version of a Gamed into an actual Game type
 * @param data The serialized data to convert into a proper Game type.
 * @param shuffler The shuffler to use for shuffling decks in this Game.
 * @param randomizer The randomizer used to select new dealers in each Round of the game.
 */
export function toGame(data: GameMemento, shuffler: Shuffler<Card>, randomizer: Randomizer): Game {
    const playerNames: Record<number, string> = readPlayerNames(data)
    const currentRound: Round | undefined = data.currentRound ? toRound(data.currentRound, shuffler) : undefined
    const targetScore: number = data.targetScore
    const scores: Record<number, number> = readPlayerScores(data)

    const convertedGame: Game = new GameImpl(Object.values(playerNames), targetScore, randomizer)
    convertedGame.modifyGameState(playerNames, scores, targetScore, currentRound)
    return convertedGame
}

function readPlayerNames(data: GameMemento): Record<number, string> {
    const names: Record<number, string> = {}

    for (let i = 0; i < data.players.length; i++) {
        names[i] = data.players[i]
    }

    return names
}

function readPlayerScores(data: GameMemento): Record<number, number> {
    const scores: Record<number, number> = {}

    for (let i = 0; i < data.scores.length; i++) {
        scores[i] = data.scores[i]
    }

    return scores
}