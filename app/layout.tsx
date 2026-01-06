import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import ThemeProvider from '@/components/ThemeProvider'
import { themeScript } from './theme-script'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'TidySub',
  description: 'Subscription Tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} bg-navy-950 text-gray-100 min-h-screen antialiased`}>
        <ThemeProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

