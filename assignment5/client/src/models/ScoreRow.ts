/**
 * One player's line on the scoreboard.
 */
export interface ScoreRow {
  playerId: number
  name: string
  score: number
  isLocalPlayer: boolean
}
