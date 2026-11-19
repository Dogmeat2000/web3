import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

// The browser uses the page's own address, which next.config.ts forwards to the GraphQL server.
// The Next.js server, which renders the pages, calls the GraphQL server directly.
const httpUrl: string =
  typeof window === 'undefined' ? `http://localhost:${process.env.GRAPHQL_PORT ?? 4000}/graphql` : `${window.location.origin}/graphql`
const wsUrl: string = httpUrl.replace('http', 'ws') // http becomes ws, and https becomes wss

const httpLink = new HttpLink({
  uri: httpUrl,
})

// lazy: the websocket stays closed until the first subscription, which only client components start
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    lazy: true,
    retryAttempts: 0,
  }),
)

const splitLink = ApolloLink.split(
  ({ query }: ApolloLink.Operation): boolean => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  httpLink,
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
