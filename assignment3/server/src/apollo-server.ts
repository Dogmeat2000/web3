import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { useServer } from 'graphql-ws/use/ws'
import { WebSocketServer } from 'ws'
import { PubSub } from 'graphql-subscriptions'

import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createGameResolvers } from './resolvers.ts'
import type { GameStore } from './game-store.ts'
import { MemoryStore } from './memory-store.ts'
import { ServerModel } from './server-model.ts'
import {GraphQLSchema} from "graphql/type";

const __filename: string = fileURLToPath(import.meta.url)
const __dirname: string = path.dirname(__filename)

async function startServer(store: GameStore): Promise<void> {
    const port: number = Number(process.env.PORT ?? 4000)
    const model = new ServerModel(store)
    const pubsub = new PubSub()

    try {
        const content: string = await fs.readFile(path.join(__dirname, 'schema.graphql'), 'utf8')
        const schema: GraphQLSchema = makeExecutableSchema({ typeDefs: content, resolvers: createGameResolvers(model, pubsub) })

        const app = express()
        const httpServer = http.createServer(app)

        const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' })
        const serverCleanup = useServer({ schema }, wsServer)

        const server = new ApolloServer({
            schema,
            plugins: [
                ApolloServerPluginDrainHttpServer({ httpServer }),
                {
                    async serverWillStart() {
                        return {
                            async drainServer(): Promise<void> {
                                await serverCleanup.dispose()
                            },
                        }
                    },
                },
            ],
        })
        await server.start()

        app.use('/graphql', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            if (req.method === 'OPTIONS') {
                res.sendStatus(204)
                return
            }
            next()
        })
        app.use('/graphql', bodyParser.json())
        app.use('/graphql', expressMiddleware(server))

        httpServer.listen({ port }, () => {
            console.log(`GraphQL server ready on http://localhost:${port}/graphql`)
            console.log(`Subscriptions ready on ws://localhost:${port}/graphql`)
        })
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

// Games are kept in this process for now. A database store can be passed in here instead.
startServer(new MemoryStore())
