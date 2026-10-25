import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

// During development the client runs on Vite's own port, and the server on port 4000.
// Once deployed, the server also serves the client, so both are found at the address of the page.
// I chose this approach simply to make it simpler to deploy in a cloud environment.
const httpUrl: string = import.meta.env.DEV ? 'http://localhost:4000/graphql' : `${window.location.origin}/graphql`
const wsUrl: string = httpUrl.replace('http', 'ws') // http becomes ws, and https becomes wss

const httpLink = new HttpLink({
  uri: httpUrl,
})

// lazy: the websocket stays closed until the first subscription
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
