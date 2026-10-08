import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import bodyParser from 'body-parser'
import http from 'http';
import {promises as fs} from 'fs'
import * as Resolver from './resolvers.js'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    try {
        const content = await fs.readFile(path.join(__dirname, 'schema.graphql'), 'utf8')
        const typeDefs = `#graphql
          ${content}`
        const resolvers = {
            Query: {
                searchBooks: Resolver.searchBooks,
                customerOrders: Resolver.customerOrders
            },
            Order: Resolver.orderFields,
            Mutation: {
                createOneClickOrder: Resolver.createOneClickOrder,
                applyPriceReduction: Resolver.applyPriceReduction
            }
        }

        const app = express()
        app.use('/graphql', bodyParser.json())
        app.use('/graphql', (_, res, next) => {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          res.header("Access-Control-Allow-Methods", "GET, POST, PATCH");
          next();
        })

        const staticPath = path.join(__dirname, '../static');
        app.use('/frontend', express.static(staticPath))

        const httpServer = http.createServer(app)
        const server = new ApolloServer({
            typeDefs,
            resolvers,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        })
        await server.start()

        app.use('/graphql', expressMiddleware(server))

        //startStandaloneServer starts a server with good defaults for test/development
        httpServer.listen({ port: 4000 }, () => {
            console.log(`GraphQL server ready on http://localhost:4000/graphql`);
            console.log(`Frontend Dashboard: http://localhost:4000/frontend/index.html`);
        })
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

startServer()
