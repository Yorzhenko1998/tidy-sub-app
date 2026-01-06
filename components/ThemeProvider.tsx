'use client'

import { useEffect } from 'react'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('tidysub-settings')
    if (stored) {
      try {
        const settings = JSON.parse(stored)
        const theme = settings.appearance || 'dark'
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        
        if (theme === 'system') {
          if (systemPrefersDark) {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
          } else {
            document.documentElement.classList.add('light')
            document.documentElement.classList.remove('dark')
          }
        } else if (theme === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        } else {
          document.documentElement.classList.add('light')
          document.documentElement.classList.remove('dark')
        }
      } catch (e) {
        document.documentElement.classList.add('dark')
      }
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return <>{children}</>
}

