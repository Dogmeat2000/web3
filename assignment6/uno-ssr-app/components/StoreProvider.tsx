'use client'

import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { makeStore, type StoreType } from '@/src/stores/store'

type StoreProviderProps = {
  readonly playerName: string
  readonly children: ReactNode
}

/**
 * Provides the Redux store to the client components below it, starting from the player the server read from the cookie.
 */
export default function StoreProvider({ playerName, children }: StoreProviderProps) {
  const [store] = useState<StoreType>(() => makeStore(playerName))

  return <Provider store={store}>{children}</Provider>
}
