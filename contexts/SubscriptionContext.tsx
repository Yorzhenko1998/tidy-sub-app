'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/** Push subscription JSON as stored by the browser (endpoint + keys). */
export type PushSubscriptionJSON = { endpoint: string; keys?: Record<string, string> }

export interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billingInterval: 'Monthly' | 'Yearly'
  startDate: string
  category: string
  icon: string
  color: string
  websiteUrl?: string
  logoUrl?: string
  brandIconUrl?: string
  isActive?: boolean
  /** Number of days before payment to send reminder (0 = day of, 1, 2, 3, 7). */
  reminderDays?: number
  /** Stored push subscription for sending reminders to this device. */
  pushSubscription?: PushSubscriptionJSON | null
  /** Same as reminderDays; used by Cron / Supabase (reminder_days). */
  reminder_days?: number
  /** Same as pushSubscription; used by Cron / Supabase (push_subscription). */
  push_subscription?: PushSubscriptionJSON | null
}

interface SubscriptionContextType {
  subscriptions: Subscription[]
  categories: string[]
  globalCurrency: string
  setGlobalCurrency: (currency: string) => void
  theme: string
  setTheme: (theme: string) => void
  pushNotificationsEnabled: boolean
  setPushNotificationsEnabled: (enabled: boolean) => void
  remindersEnabled: boolean
  setRemindersEnabled: (enabled: boolean) => void
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, subscription: Omit<Subscription, 'id'>) => void
  deleteSubscription: (id: string) => void
  replaceSubscriptions: (subscriptions: Subscription[]) => void
  addCategory: (category: string) => void
  deleteCategory: (category: string) => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

const STORAGE_KEY = 'tidysub-subscriptions'
const CATEGORIES_STORAGE_KEY = 'tidysub-categories'
const SETTINGS_STORAGE_KEY = 'tidysub-settings'

const DEFAULT_CATEGORIES = [
  'Streaming',
  'Software',
  'Utilities',
  'Health & Gym',
  'Gaming',
  'Cloud Storage',
  'Education',
  'Music',
  'Delivery/Food'
]

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Always start with empty array to prevent hydration mismatch
  // Data will be loaded in useEffect after mount
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  
  const [globalCurrency, setGlobalCurrencyState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'USD'
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        return settings.currency || 'USD'
      }
    } catch (error) {
      console.error('Error loading currency from localStorage on init:', error)
    }
    return 'USD'
  })

  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dark'
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        return settings.appearance || 'dark'
      }
    } catch (error) {
      console.error('Error loading theme from localStorage on init:', error)
    }
    return 'dark'
  })

  const [pushNotificationsEnabled, setPushNotificationsEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        return typeof settings.pushNotificationsEnabled === 'boolean' ? settings.pushNotificationsEnabled : false
      }
    } catch (error) {
      console.error('Error loading push notifications from localStorage on init:', error)
    }
    return false
  })

  const [remindersEnabled, setRemindersEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        return typeof settings.remindersEnabled === 'boolean' ? settings.remindersEnabled : false
      }
    } catch (error) {
      console.error('Error loading reminders from localStorage on init:', error)
    }
    return false
  })

  // Apply theme to document immediately
  const applyTheme = (themeValue: string) => {
    if (typeof document === 'undefined') return
    
    const html = document.documentElement
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (themeValue === 'system') {
      if (systemPrefersDark) {
        html.classList.add('dark')
        html.classList.remove('light')
      } else {
        html.classList.add('light')
        html.classList.remove('dark')
      }
    } else if (themeValue === 'dark') {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
    }
  }

  // Apply theme immediately on mount (after state initialization)
  useEffect(() => {
    applyTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const html = document.documentElement
      if (e.matches) {
        html.classList.add('dark')
        html.classList.remove('light')
      } else {
        html.classList.add('light')
        html.classList.remove('dark')
      }
    }

    // Check initial state
    handleSystemThemeChange(mediaQuery)

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange)
      return () => mediaQuery.removeListener(handleSystemThemeChange)
    }
  }, [theme])

  // Save theme to localStorage whenever it changes
  // Note: Theme is applied on mount via separate useEffect, and here when it changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      const settings = stored ? JSON.parse(stored) : {}
      settings.appearance = theme
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
      // Continue execution even if save fails
    }
  }, [theme])

  // Apply theme when it changes (separate from save to ensure it always applies)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme)
  }

  const setGlobalCurrency = (currency: string) => {
    setGlobalCurrencyState(currency)
  }

  // Save global currency to localStorage whenever it changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      const settings = stored ? JSON.parse(stored) : {}
      settings.currency = globalCurrency
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving currency to localStorage:', error)
      // Continue execution even if save fails
    }
  }, [globalCurrency])

  // Save push notifications to localStorage whenever it changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      const settings = stored ? JSON.parse(stored) : {}
      settings.pushNotificationsEnabled = pushNotificationsEnabled
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving push notifications to localStorage:', error)
      // Continue execution even if save fails
    }
  }, [pushNotificationsEnabled])

  const setPushNotificationsEnabled = (enabled: boolean) => {
    setPushNotificationsEnabledState(enabled)
  }

  // Save reminders to localStorage whenever it changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      const settings = stored ? JSON.parse(stored) : {}
      settings.remindersEnabled = remindersEnabled
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving reminders to localStorage:', error)
      // Continue execution even if save fails
    }
  }, [remindersEnabled])

  const setRemindersEnabled = (enabled: boolean) => {
    setRemindersEnabledState(enabled)
  }

  // Categories are initialized with DEFAULT_CATEGORIES, no need for useEffect

  // Load subscriptions from localStorage after mount (prevents hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSubscriptions(parsed)
        }
      }
      // Mark as loaded whether data was found or not
      setIsLoaded(true)
    } catch (error) {
      console.error('Error loading subscriptions from localStorage:', error)
      // Continue with empty array if load fails, but still mark as loaded
      setIsLoaded(true)
    }
  }, [])

  // Save subscriptions to localStorage whenever they change
  // Guard: Only save after initial load is complete to prevent overwriting saved data
  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
    } catch (error) {
      console.error('Error saving subscriptions to localStorage:', error)
    }
  }, [subscriptions, isLoaded])

  // Sync subscriptions to server for cron reminders (runs when subscriptions change)
  useEffect(() => {
    if (!isLoaded || typeof fetch === 'undefined') return
    fetch('/api/subscriptions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptions })
    }).catch(() => {})
  }, [subscriptions, isLoaded])


  const addSubscription = (subscription: Omit<Subscription, 'id'>) => {
    const newSubscription: Subscription = {
      ...subscription,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isActive: subscription.isActive !== undefined ? subscription.isActive : true
    }
    setSubscriptions((prev) => [...prev, newSubscription])
  }

  const updateSubscription = (id: string, subscription: Omit<Subscription, 'id'>) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...subscription, id } : sub))
    )
  }

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id))
  }

  const replaceSubscriptions = (newSubscriptions: Subscription[]) => {
    setSubscriptions(newSubscriptions)
  }

  const addCategory = (category: string) => {
    const trimmedCategory = category.trim()
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      setCategories((prev) => [...prev, trimmedCategory])
    }
  }

  const deleteCategory = (category: string) => {
    // Don't allow deleting default categories
    if (DEFAULT_CATEGORIES.includes(category)) {
      return
    }
    setCategories((prev) => prev.filter((cat) => cat !== category))
  }

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        categories,
        globalCurrency,
        setGlobalCurrency,
        theme,
        setTheme,
        pushNotificationsEnabled,
        setPushNotificationsEnabled,
        remindersEnabled,
        setRemindersEnabled,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        replaceSubscriptions,
        addCategory,
        deleteCategory
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider')
  }
  return context
}

