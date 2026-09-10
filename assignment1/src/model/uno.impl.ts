import { Game } from "./uno";
import { Round } from "./round";
import {Randomizer, Shuffler, standardRandomizer, standardShuffler} from "../utils/random_utils";
import { Card } from "./deck";
import { RoundImpl } from "./round.impl";
import { GameMemento } from "./uno.memento";
import { Player, PlayerImpl } from "./player";

export class GameImpl implements Game {
    readonly playerCount: number;
    readonly targetScore: number;

    private _playedRounds: Round[] = [] // Current round will always be at the end of the Array (i.e. -1)
    private _players: Player[] = []


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
            this._players.push(new PlayerImpl(i, players[i]))
        }

        const firstRound = new RoundImpl(players, randomizer(players.length), shuffler, cardsPerPlayer, true)
        this._playedRounds.push(firstRound)

        this.playerCount = firstRound.playerCount
        this.targetScore = targetScore
    }

    currentRound(): Round | undefined {
        // Game Logic: There is no current round if game has a winner.
        if(this.winner() !== undefined)
            return undefined

        // Game Logic: Current round is always the Round at the end of the playedRounds array.
        return this._playedRounds.at(-1)!;
    }

    player(playerId: number): string {
        if(playerId >= 0 && playerId < this.playerCount)
            return this._players[playerId].playerName
        else
            throw new Error("PlayerId is invalid")
    }

    score(playerId: number): number {
        //TODO: NOT IMPLEMENTED
        return 0;
    }

    toMemento(): GameMemento {
        //TODO: NOT IMPLEMENTED
        return undefined;
    }

    winner(): number | undefined {
        //TODO: NOT IMPLEMENTED
        return undefined;
    }
}