import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
})

// lazy: the websocket stays closed until the first subscription
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
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
