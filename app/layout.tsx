import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import ThemeProvider from '@/components/ThemeProvider'
import PWAProvider from '@/components/PWAProvider'
import { themeScript } from './theme-script'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'TidySub',
  description: 'Subscription Tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TidySub'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#000000'
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TidySub" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-[#020617] text-gray-100 min-h-screen antialiased`}>
        <PWAProvider>
          <ThemeProvider>
            <SubscriptionProvider>
              {children}
            </SubscriptionProvider>
          </ThemeProvider>
        </PWAProvider>
      </body>
    </html>
  )
}

