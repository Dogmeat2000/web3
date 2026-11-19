import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const httpUrl: string = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'
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
