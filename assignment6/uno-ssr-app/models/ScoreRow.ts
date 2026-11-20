/**
 * One player's line on the scoreboard.
 */
export type ScoreRow = {
  playerId: number
  name: string
  score: number
  isLocalPlayer: boolean
}
