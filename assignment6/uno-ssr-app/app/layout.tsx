import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Multiplayer online UNO',
  icons: { icon: '/icon-192.png' },
}

/**
 * The root layout shared by every page, both the static login page and the dynamic game pages.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
