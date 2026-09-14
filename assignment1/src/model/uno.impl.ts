import { Game } from "./uno";
import { Round } from "./round";
import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from "../utils/random_utils";
import { Card } from "./deck";
import { RoundImpl } from "./round.impl";
import { GameMemento } from "./uno.memento";

export class GameImpl implements Game {
    playerCount: number;
    targetScore: number;

    private _currentRound: Round | undefined
    private _players: Record<number, string> = {}
    private _scores: Record<number, number> = {}
    private readonly _randomizer: Randomizer
    private readonly _shuffler: Shuffler<Card>
    private readonly _cardsPerPlayer: number


    constructor(players: string[] = ['A', 'B'], targetScore: number = 500, randomizer: Randomizer = standardRandomizer, shuffler: Shuffler<Card> = standardShuffler, cardsPerPlayer: number = 7){
        // Game Rule: Players must be between 2 and 10:
        if(players.length < 2 || players.length > 10)
            throw new Error("Invalid number of players. Must be between 2 and 10 players")

        // Game Logic: targetScore must be a positive number:
        if(targetScore <= 0)
            throw new Error("Invalid target score. Must be larger than 0.")

        // Game logic: Players must be dealt min. 1 card:
        if(cardsPerPlayer < 1)
            throw new Error("Invalid cardsPerPlayer. Must be larger than 0.")

        for (let i = 0; i < players.length; i++) {
            this._players[i] = players[i]
            this._scores[i] = 0
        }

        this.playerCount = players.length
        this.targetScore = targetScore
        this._randomizer = randomizer
        this._shuffler = shuffler
        this._cardsPerPlayer = cardsPerPlayer

        this._currentRound = this.createNewRound()
    }

    currentRound(): Round | undefined {
        // Game Logic: There is no current round if game has a winner.
        if(this.winner() !== undefined)
            return undefined

        // Game Logic: Current round is always the Round at the end of the playedRounds array.
        return this._currentRound;
    }

    player(playerId: number): string {
        if(playerId >= 0 && playerId < this.playerCount)
            return this._players[playerId]
        else
            throw new Error("PlayerId is invalid")
    }

    score(playerId: number): number | undefined {
        if(playerId >= 0 && playerId < this.playerCount)
            return this._scores[playerId]
        return undefined;
    }

    toMemento(): GameMemento {
        return {
            players: Object.values(this._players),
            currentRound: this._currentRound?.toMemento(),
            targetScore: this.targetScore,
            scores: Object.values(this._scores),
            cardsPerPlayer: this._cardsPerPlayer
        }
    }

    winner(): number | undefined {
        let winner: number | undefined = undefined
        let winnerCount: number = 0

        for (const [key] of Object.entries(this._players)) {
            const playerId: number = Number(key)
            if(this._scores[playerId] >= this.targetScore){
                winner = playerId
                winnerCount++
            }
        }

        if(winnerCount > 1)
            throw new Error("Game state is invalid. Game cannot have multiple winners.")

        return winner;
    }

    modifyGameState(players: Record<number, string>, scores: Record<number, number>, targetScore: number, currentRound: Round | undefined): void {
        const oldPlayers: Record<number, string> = players
        const oldScores: Record<number, number> = scores
        const oldTargetScore: number = targetScore


        // Validate modified scores
        for (const score of Object.values(scores)) {
            if(score < 0) {
                this.rollbackModifications(oldPlayers, oldScores)
                throw new Error("Invalid score provided. Score cannot be negative.")
            }
        }

        if(Object.values(scores).length !== Object.values(players).length){
            this.rollbackModifications(oldPlayers, oldScores)
            throw new Error("Invalid scored. A score must be provided for every player.")
        }

        this._players = players
        this._scores = scores
        this.targetScore = targetScore

        if(this.winner() === undefined && currentRound === undefined){
            this.rollbackModifications(oldPlayers, oldScores, oldTargetScore)
            throw new Error("Invalid modification. Unfinished game cannot have undefined CurrentRound.")
        }

        this._currentRound = currentRound

        // Re-apply callback
        if(currentRound !== undefined) {
            currentRound.onEnd((event) => this.handleRoundEnd(currentRound, event))
        }
    }

    private createNewRound(): Round {
        const round: Round = new RoundImpl(Object.values(this._players), this._randomizer(this.playerCount), this._shuffler, this._cardsPerPlayer, true)

        round.onEnd((event) => this.handleRoundEnd(round, event))

        return round
    }

    private handleRoundEnd(round: Round, event: { winner: number }): void {
        this._scores[event.winner] += round.score() ?? 0

        // Game Logic: Only start another round, if no winner for the game now exists
        if(this.winner() === undefined) {
            this._currentRound = this.createNewRound()
        } else {
            this._currentRound = undefined
        }
    }

    private rollbackModifications(players?: Record<number, string>, scores?: Record<number, number>, targetScore?: number, currentRound?: Round | undefined): void {
        if(players !== undefined)
            this._players = players

        if(scores !== undefined)
            this._scores = scores

        if(targetScore !== undefined)
            this.targetScore = targetScore

        if(currentRound !== undefined)
            this._currentRound = currentRound
    }
}