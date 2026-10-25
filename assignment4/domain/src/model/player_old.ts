import { PlayerHand_old, PlayerHandImpl } from "./playerHand_old";

export interface Player_old {
    readonly playerId: number
    readonly playerName: string
    readonly hand: PlayerHand_old
    hasSaidUno: boolean
    hasDrawnCardInTurn: boolean
}

export class PlayerImpl implements Player_old {
    private readonly _playerId: number
    private readonly _playerName: string
    private readonly _hand: PlayerHand_old
    private _hasSaidUno: boolean
    private _hasDrawnCardInTurn: boolean

    constructor(playerId: number, playerName: string, playerHand: PlayerHand_old = new PlayerHandImpl([]), hasSaidUno: boolean = false, hasDrawnCardInTurn: boolean = false) {
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

    get hand(): PlayerHand_old {
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