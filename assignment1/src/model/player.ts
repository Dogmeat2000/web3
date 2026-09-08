import { PlayerHand, PlayerHandImpl } from "./playerHand";

export interface Player {
    readonly playerId: number
    readonly playerName: string
    readonly hand: PlayerHand
    readonly hasSaidUno: boolean
}

export class PlayerImpl implements Player {
    private readonly _playerId: number
    private readonly _playerName: string
    private readonly _hand: PlayerHand
    private _hasSaidUno: boolean = false

    constructor(playerId: number, playerName: string) {
        this._playerId = playerId
        this._playerName = playerName
        this._hand = new PlayerHandImpl([])
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
}