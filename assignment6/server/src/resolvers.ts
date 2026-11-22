import { type PubSub } from 'graphql-subscriptions'
import type { Color } from '@domain/model/deck.ts'
import type { GameCredentials, GameSettings, PublicGame } from '@domain/model/uno.dto.ts'
import type { StoredGame } from './game-store.ts'
import { GameApi } from "./game-api.ts";

const GAME_UPDATED = 'GAME_UPDATED'

type GameUpdate = { gameUpdated: PublicGame }
type PlayerPositionArgs = GameCredentials & { playerId: number }


/** Converts a StoredGame into a format where the password is no longer included, making this safe for sharing with clients. */
function toPublicGame(game: StoredGame): PublicGame {
    const { password, ...publicGame } = game
    return publicGame
}

/** Returns the PubSub event of the provided game, so an update only reaches the players in that game. */
function gameTrigger(gameId: string): string {
    return `${GAME_UPDATED}.${gameId}`
}

export function createGameResolvers(model: GameApi, pubsub: PubSub) {

    async function publish(change: Promise<StoredGame>): Promise<PublicGame> {
        const game: PublicGame = toPublicGame(await change)
        const update: GameUpdate = { gameUpdated: game }
        await pubsub.publish(gameTrigger(game.id), update)
        return game
    }

    return {
        Query: {
            game: async (_: unknown, args: GameCredentials): Promise<PublicGame> => toPublicGame(await model.fetchGame(args.name, args.password)),
        },

        Mutation: {
            hostGame: (_: unknown, args: GameSettings & { hostPlayerName: string }): Promise<PublicGame> =>
                publish(
                    model.hostGame(
                        args.name,
                        args.password,
                        args.playerCount,
                        args.targetScore,
                        args.hostPlayerName
                    )
                ),

            joinGame: (_: unknown, args: GameCredentials & { playerName: string }): Promise<PublicGame> =>
                publish(
                    model.joinGame(
                        args.name,
                        args.password,
                        args.playerName
                    )
                ),

            startGame: (_: unknown, args: GameCredentials): Promise<PublicGame> => publish(model.startGame(args.name, args.password)),

            play: (_: unknown, args: PlayerPositionArgs & { cardIndex: number; namedColor?: Color | null }): Promise<PublicGame> =>
                publish(
                    model.play(
                        args.name,
                        args.password,
                        args.playerId,
                        args.cardIndex,
                        args.namedColor ?? undefined
                    )
                ),

            draw: (_: unknown, args: PlayerPositionArgs): Promise<PublicGame> => publish(model.draw(args.name, args.password, args.playerId)),

            sayUno: (_: unknown, args: PlayerPositionArgs): Promise<PublicGame> => publish(model.sayUno(args.name, args.password, args.playerId)),

            catchUno: (_: unknown, args: PlayerPositionArgs): Promise<PublicGame> => publish(model.catchUno(args.name, args.password, args.playerId)),
        },

        Subscription: {
            gameUpdated: {
                subscribe: async (_: unknown, args: GameCredentials) => {
                    const watched: StoredGame = await model.fetchGame(args.name, args.password)
                    return pubsub.asyncIterableIterator<GameUpdate>([gameTrigger(watched.id)])
                },
            },
        },
    }
}
