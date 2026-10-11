import type { GameCredentials } from '@/models/GameCredentials.ts'

/**
 * All game settings needed to host a game.
 */
export interface GameSettings extends GameCredentials {
  playerCount: number
  targetScore: number
}

export const GAME_NAME_MAX_LENGTH = 30

/** One message per invalid field. An empty object means the credentials are valid. */
export type CredentialErrors = Partial<Record<keyof GameCredentials, string>>
export type SettingsErrors = Partial<Record<keyof GameSettings, string>>

/**
 * Validates the credentials provided during Game Setting configuration. Errors are returned
 */
export function validateCredentials({ name, password }: GameCredentials): CredentialErrors {
  const errors: CredentialErrors = {}

  const trimmedName: string = name.trim()
  if (trimmedName === '') {
    errors.name = 'Enter the name of a game.'
  } else if (trimmedName.length > GAME_NAME_MAX_LENGTH) {
    errors.name = `A game name can be at most ${GAME_NAME_MAX_LENGTH} characters.`
  }

  if (password === '') {
    errors.password = 'Enter the game password.'
  }

  return errors
}

/**
 * Validates the game settings provided during Host Game configuration. Errors are returned
 */
export function validateGameSettings(gameSettings: GameSettings): SettingsErrors {
  const errors: SettingsErrors = {}

  const trimmedName: string = gameSettings.name.trim()
  if (trimmedName === '') {
    errors.name = 'Name of game is missing.'
  } else if (trimmedName.length > GAME_NAME_MAX_LENGTH) {
    errors.name = `A game name can be at most ${GAME_NAME_MAX_LENGTH} characters.`
  }

  if (gameSettings.password === '') {
    errors.password = 'Password is missing'
  }

  if (gameSettings.playerCount < 2 || gameSettings.playerCount > 10) {
    errors.playerCount = 'Number of players must be between 2 and 10.'
  }

  if (gameSettings.targetScore < 1) {
    errors.targetScore = 'Target score must be above 0'
  }

  return errors
}
