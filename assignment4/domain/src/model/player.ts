import { Card } from "./deck";

export type Player = {
    readonly playerId: number
    readonly playerName: string
    readonly hand: Card[]
    readonly hasSaidUno: boolean
    readonly hasDrawnCardInTurn: boolean
}