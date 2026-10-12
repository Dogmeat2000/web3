import { gql } from '@apollo/client'
import { apolloClient } from '@/graphql/apolloClient.ts'
import type { Color } from '@domain/model/color.ts'
import type { GameCredentials, GameSettings, PublicGame } from '@domain/model/uno.dto.ts'

const cardFields = `type color number`

const gameFields = `
  id
  name
  joinedPlayers
  status
  version
  namedColor { playerId color }
  lastRound { roundsPlayed winner addedScore }
  players
  targetScore
  scores
  cardsPerPlayer
  currentRound {
    players
    hands { ${cardFields} }
    drawPile { ${cardFields} }
    discardPile { ${cardFields} }
    currentColor
    currentDirection
    dealer
    playerInTurn
    saidUno
    hasDrawn
  }
`

let subscription: { unsubscribe(): void } | null = null

/**
 * Attempts to fetch the game with the specified credentials from the server.
 */
export async function fetchGame({ name, password }: GameCredentials): Promise<PublicGame> {
  const query = gql`query Game($name: String!, $password: String!) {
    game(name: $name, password: $password) { ${gameFields} }
  }`
  const { data } = await apolloClient.query({ query, variables: { name, password }, fetchPolicy: 'network-only' })
  return (data as { game: PublicGame }).game
}

/**
 * Attempts to create a new game on the server, with the calling player as the host/creator.
 */
export async function hostGame({ name, password, playerCount, targetScore }: GameSettings): Promise<PublicGame> {
  const mutation = gql`mutation HostGame($name: String!, $password: String!, $playerCount: Int!, $targetScore: Int!) {
    hostGame(name: $name, password: $password, playerCount: $playerCount, targetScore: $targetScore) { ${gameFields} }
  }`
  const { data } = await apolloClient.mutate({ mutation, variables: { name, password, playerCount, targetScore } })
  return (data as { hostGame: PublicGame }).hostGame
}

/**
 * Attempts to join the game with the specified credentials on the server.
 */
export async function joinGame({ name, password }: GameCredentials): Promise<PublicGame> {
  const mutation = gql`mutation JoinGame($name: String!, $password: String!) {
    joinGame(name: $name, password: $password) { ${gameFields} }
  }`
  const { data } = await apolloClient.mutate({ mutation, variables: { name, password } })
  return (data as { joinGame: PublicGame }).joinGame
}

/**
 * Attempts to start a public game on the server, locking it so more players cannot join.
 */
export async function startGame({ name, password }: GameCredentials): Promise<PublicGame> {
  const mutation = gql`mutation StartGame($name: String!, $password: String!) {
    startGame(name: $name, password: $password) { ${gameFields} }
  }`
  const { data } = await apolloClient.mutate({ mutation, variables: { name, password } })
  return (data as { startGame: PublicGame }).startGame
}

/**
 * Attempts to play a card on the server game.
 */
export async function play({ name, password }: GameCredentials, playerId: number, cardIndex: number, namedColor?: Color): Promise<PublicGame> {
  const mutation = gql`mutation Play($name: String!, $password: String!, $playerId: Int!, $cardIndex: Int!, $namedColor: Color) {
    play(name: $name, password: $password, playerId: $playerId, cardIndex: $cardIndex, namedColor: $namedColor) { ${gameFields} }
  }`
  const { data } = await apolloClient.mutate({ mutation, variables: { name, password, playerId, cardIndex, namedColor } })
  return (data as { play: PublicGame }).play
}

/**
 * Attempts to draw a card on the server game.
 */
export async function draw({ name, password }: GameCredentials, playerId: number): Promise<PublicGame> {
  const mutation = gql`mutation Draw($name: String!, $password: String!, $playerId: Int!) {
    draw(name: $name, password: $password, playerId: $playerId) { ${gameFields} }
  }`
  const { data } = await apolloClient.mutate({ mutation, variables: { name, password, playerId } })
  return (data as { draw: PublicGame }).draw
}

/**
 * Attempts to Say Uno for a player on the server game.
 */
export async function sayUno({ name, password }: GameCredentials, playerId: number): Promise<PublicGame> {
  const mutation = gql`mutation SayUno($name: String!, $password: String!, $playerId: Int!) {
    sayUno(name: $name, password: $password, playerId: $playerId) { ${gameFields} }
  }`
  const { data } = await apolloClient.mutate({ mutation, variables: { name, password, playerId } })
  return (data as { sayUno: PublicGame }).sayUno
}

/**
 * Attempts to call out whoever forgot to say UNO, in a server game.
 */
export async function catchUno({ name, password }: GameCredentials, playerId: number): Promise<PublicGame> {
  const mutation = gql`mutation CatchUno($name: String!, $password: String!, $playerId: Int!) {
    catchUno(name: $name, password: $password, playerId: $playerId) { ${gameFields} }
  }`
  const { data } = await apolloClient.mutate({ mutation, variables: { name, password, playerId } })
  return (data as { catchUno: PublicGame }).catchUno
}

/**
 * Subscribes to the updates the server pushes for one game.
 * `gameListener` is called with each updated game.
 */
export function subscribeToGame({ name, password }: GameCredentials, gameListener: (game: PublicGame) => void): void {
  unsubscribeFromGame()

  const query = gql`subscription GameUpdated($name: String!, $password: String!) {
    gameUpdated(name: $name, password: $password) { ${gameFields} }
  }`
  const gameObservable = apolloClient.subscribe({ query, variables: { name, password } })

  subscription = gameObservable.subscribe({
    next({ data, error }): void {
      if (data) {
        gameListener((data as { gameUpdated: PublicGame }).gameUpdated)
      } else {
        console.error(error)
      }
    },
    error(err: unknown): void {
      console.error(err)
    },
  })
}

/**
 * Ends the subscription, so no more updates arrive.
 */
export function unsubscribeFromGame(): void {
  subscription?.unsubscribe()
  subscription = null
}
