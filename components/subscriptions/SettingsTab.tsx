'use client'

import { useState, useEffect } from 'react'
import { Download, Upload, Trash2, Sun, Moon, Monitor } from 'lucide-react'
import { useSubscriptions } from '@/contexts/SubscriptionContext'
import type { Subscription } from '@/contexts/SubscriptionContext'

// Тимчасова функція-заглушка для дозволу на пуші
const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Push permission:', permission);
  }
};

/** Normalize a raw parsed item to Subscription shape (export-compatible). */
function normalizeSubscription(raw: unknown, index: number): Subscription | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const id = typeof o.id === 'string' ? o.id : `import-${Date.now()}-${index}`
  const name = typeof o.name === 'string' ? o.name : ''
  if (!name) return null

  let amount = 0
  if (typeof o.amount === 'number' && !Number.isNaN(o.amount)) amount = o.amount
  else if (typeof o.amount === 'string') amount = parseFloat(o.amount) || 0

  const currency = typeof o.currency === 'string' ? o.currency : 'USD'
  const billingInterval =
    o.billingInterval === 'Yearly' ? 'Yearly' : 'Monthly'

  let startDate = ''
  if (typeof o.startDate === 'string') {
    startDate = o.startDate
  } else if (o.startDate instanceof Date) {
    startDate = o.startDate.toISOString().split('T')[0]
  } else if (typeof o.startDate === 'number') {
    startDate = new Date(o.startDate).toISOString().split('T')[0]
  } else {
    startDate = new Date().toISOString().split('T')[0]
  }

  const category = typeof o.category === 'string' ? o.category : ''
  const icon = typeof o.icon === 'string' ? o.icon : 'money'
  const color = typeof o.color === 'string' ? o.color : '#3B82F6'

  const sub: Subscription = {
    id,
    name,
    amount,
    currency,
    billingInterval,
    startDate,
    category,
    icon,
    color
  }
  if (typeof o.websiteUrl === 'string') sub.websiteUrl = o.websiteUrl
  if (typeof o.logoUrl === 'string') sub.logoUrl = o.logoUrl
  if (typeof o.brandIconUrl === 'string') sub.brandIconUrl = o.brandIconUrl
  if (typeof o.isActive === 'boolean') sub.isActive = o.isActive
  else sub.isActive = true

  // Default reminder to 1 day before; preserve valid value from JSON if present
  const validRemindMe = ['0', '1', '3', '7']
  const rawRemindMe = o.remindMe
  ;(sub as { remindMe?: string }).remindMe =
    typeof rawRemindMe === 'string' && validRemindMe.includes(rawRemindMe) ? rawRemindMe : '1'

  return sub
}

export default function SettingsTab() {
  const { 
    subscriptions, 
    deleteSubscription, 
    globalCurrency, 
    setGlobalCurrency, 
    theme, 
    setTheme,
    pushNotificationsEnabled,
    setPushNotificationsEnabled,
    replaceSubscriptions
  } = useSubscriptions()

  const handleExport = () => {
    const dataStr = JSON.stringify(subscriptions, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tidysub-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result
          if (typeof text !== 'string') {
            alert('Could not read file.')
            return
          }
          const parsed: unknown = JSON.parse(text)

          // Support both raw array (export format) and { subscriptions: [] }
          let rawList: unknown[] = []
          if (Array.isArray(parsed)) {
            rawList = parsed
          } else if (parsed && typeof parsed === 'object' && 'subscriptions' in parsed && Array.isArray((parsed as { subscriptions: unknown[] }).subscriptions)) {
            rawList = (parsed as { subscriptions: unknown[] }).subscriptions
          } else {
            alert('Invalid file format. Expected a JSON array of subscriptions.')
            return
          }

          const normalized: Subscription[] = []
          for (let i = 0; i < rawList.length; i++) {
            const sub = normalizeSubscription(rawList[i], i)
            if (sub) normalized.push(sub)
          }

          replaceSubscriptions(normalized)
          alert(`Import successful. Loaded ${normalized.length} subscription${normalized.length === 1 ? '' : 's'}.`)
        } catch (err) {
          console.error('Import error:', err)
          alert('Invalid file format or corrupted JSON.')
        }
      }
      reader.onerror = () => alert('Could not read file.')
      reader.readAsText(file, 'UTF-8')
    }
    input.click()
  }

  const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all subscriptions? This cannot be undone.')) {
      subscriptions.forEach((sub) => deleteSubscription(sub.id))
      alert('All subscriptions have been deleted')
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(env(safe-area-inset-top),2.5rem)] md:pt-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <header className="mt-2 mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-center">
            Settings
          </h1>
        </header>

        {/* Account - Currency */}
        <section className="bg-white/5 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-white/10 rounded-2xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Account</h2>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Currency</label>
          <select
            value={globalCurrency}
            onChange={(e) => setGlobalCurrency(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 dark:bg-slate-800/50 border border-white/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent"
          >
            <option value="USD" className="bg-white dark:bg-slate-900">USD ($)</option>
            <option value="EUR" className="bg-white dark:bg-slate-900">EUR (€)</option>
            <option value="GBP" className="bg-white dark:bg-slate-900">GBP (£)</option>
          </select>
        </section>

        {/* Notifications */}
        <section className="bg-white/5 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-white/10 rounded-2xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Notifications</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="text-slate-700 dark:text-slate-200 font-medium">Enable Push Notifications</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Receive notifications for upcoming payments</p>
            </div>
            <button
              onClick={() => {
                const newValue = !pushNotificationsEnabled
                setPushNotificationsEnabled(newValue)
                if (newValue) {
                  requestNotificationPermission()
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                pushNotificationsEnabled ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  pushNotificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* App - Appearance & Data */}
        <section className="bg-white/5 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-white/10 rounded-2xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">App</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Theme</p>
          <div className="flex flex-row gap-3 mb-6">
            {([
              { mode: 'light' as const, icon: Sun, label: 'Light' },
              { mode: 'dark' as const, icon: Moon, label: 'Dark' },
              { mode: 'system' as const, icon: Monitor, label: 'System' }
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`flex flex-col items-center justify-center gap-2 flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  theme === mode
                    ? 'border-blue-500 bg-blue-500/20 dark:bg-blue-500/20 text-slate-900 dark:text-white shadow-lg shadow-blue-500/20'
                    : 'border-white/10 dark:border-white/10 bg-white/5 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Data</p>
          <div className="flex flex-row gap-3">
            <button
              onClick={handleExport}
              className="flex flex-row items-center justify-center gap-2 flex-1 h-11 md:h-12 px-3 md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors border border-blue-500/30 shadow-lg shadow-blue-500/20 text-sm md:text-base font-medium"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              <span>Export</span>
            </button>
            <button
              onClick={handleImport}
              className="flex flex-row items-center justify-center gap-2 flex-1 h-11 md:h-12 px-3 md:px-4 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md hover:bg-white/20 dark:hover:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl transition-colors border border-white/10 dark:border-white/10 text-sm md:text-base font-medium"
            >
              <Upload className="w-4 h-4" strokeWidth={2} />
              <span>Import</span>
            </button>
          </div>
        </section>

        {/* Danger Zone - glass with red accent */}
        <section className="bg-white/5 dark:bg-slate-900/40 backdrop-blur-md border border-red-500/30 dark:border-red-500/20 rounded-2xl p-6 shadow-lg shadow-red-500/5">
          <h2 className="text-lg font-semibold text-red-500 dark:text-red-400 mb-4">Danger Zone</h2>
          <button
            onClick={handleDeleteAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-lg shadow-red-500/20"
          >
            <Trash2 className="w-5 h-5" strokeWidth={2} />
            Delete All Subscriptions
          </button>
        </section>
      </div>
    </div>
  )
}
