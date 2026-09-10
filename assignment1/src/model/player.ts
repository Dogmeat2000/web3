import { PlayerHand, PlayerHandImpl } from "./playerHand";

export interface Player {
    readonly playerId: number
    readonly playerName: string
    readonly hand: PlayerHand
    hasSaidUno: boolean
    hasDrawnCardInTurn: boolean
}

export class PlayerImpl implements Player {
    private readonly _playerId: number
    private readonly _playerName: string
    private readonly _hand: PlayerHand
    private _hasSaidUno: boolean
    private _hasDrawnCardInTurn: boolean

    constructor(playerId: number, playerName: string, playerHand: PlayerHand = new PlayerHandImpl([]), hasSaidUno: boolean = false, hasDrawnCardInTurn: boolean = false) {
        this._playerId = playerId
        this._playerName = playerName
        this._hand = playerHand
        this._hasSaidUno = hasSaidUno
        this._hasDrawnCardInTurn = hasDrawnCardInTurn
    }

    get playerId(): number  {
        return this._playerId
    }

    get playerName(): string {
        return this._playerName
    }

    get hand(): PlayerHand {
        return this._hand
    }

    set hasSaidUno(bool: boolean) {
        this._hasSaidUno = bool
    }

    get hasSaidUno(): boolean {
        return this._hasSaidUno
    }

    set hasDrawnCardInTurn(bool: boolean) {
        this._hasDrawnCardInTurn = bool
    }

    get hasDrawnCardInTurn(): boolean {
        return this._hasDrawnCardInTurn
    }
}