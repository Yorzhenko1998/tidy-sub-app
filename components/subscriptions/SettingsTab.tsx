'use client'

import { useState, useEffect } from 'react'
import { Download, Upload, Trash2, Sun, Moon, Monitor } from 'lucide-react'
import { useSubscriptions } from '@/contexts/SubscriptionContext'

import { requestNotificationPermission } from '@/utils/notifications'

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
    remindersEnabled,
    setRemindersEnabled
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
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string)
            if (Array.isArray(imported)) {
              // In a real app, you'd want to add these to the context
              console.log('Imported subscriptions:', imported)
              alert('Import functionality would be implemented here')
            }
          } catch (error) {
            alert('Invalid file format')
          }
        }
        reader.readAsText(file)
      }
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header Block - Settings */}
        <div className="bg-[#0f172a] dark:bg-slate-800/80 rounded-xl mb-4 dark:border dark:border-slate-700/40 dark:border-b dark:border-white/5">
          <h1 className="text-3xl font-bold tracking-tight !text-white text-center py-3">Settings</h1>
        </div>

        {/* Currency */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-blue-300 mb-4">Currency</h2>
          <select
            value={globalCurrency}
            onChange={(e) => setGlobalCurrency(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USD" className="bg-white dark:bg-slate-900">USD ($)</option>
            <option value="EUR" className="bg-white dark:bg-slate-900">EUR (€)</option>
            <option value="GBP" className="bg-white dark:bg-slate-900">GBP (£)</option>
          </select>
        </div>

        {/* Push Notifications */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-blue-300 mb-4">Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-slate-700 dark:text-gray-300 font-medium">Enable Push Notifications</label>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Receive notifications for upcoming payments</p>
            </div>
            <button
              onClick={() => {
                const newValue = !pushNotificationsEnabled
                setPushNotificationsEnabled(newValue)
                if (newValue) {
                  requestNotificationPermission()
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                pushNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-900/50'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  pushNotificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-blue-300 mb-4">Reminders</h2>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-slate-700 dark:text-gray-300 font-medium">Enable Reminders</label>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Get notified about subscriptions due in the next 24 hours</p>
            </div>
            <button
              onClick={() => {
                const newValue = !remindersEnabled
                setRemindersEnabled(newValue)
                if (newValue && pushNotificationsEnabled) {
                  requestNotificationPermission()
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                remindersEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-900/50'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  remindersEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-blue-300 mb-4">Appearance</h2>
          <div className="flex flex-row gap-3">
            {([
              { mode: 'light' as const, icon: Sun, label: 'Light' },
              { mode: 'dark' as const, icon: Moon, label: 'Dark' },
              { mode: 'system' as const, icon: Monitor, label: 'System' }
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`flex flex-col items-center justify-center gap-2 flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  theme === mode
                    ? 'border-blue-500 bg-blue-500/20 dark:bg-slate-800/40 dark:backdrop-blur-md dark:border-white/5 text-slate-900 dark:text-white dark:shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 dark:backdrop-blur-md dark:border-white/5 text-slate-700 dark:text-gray-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-blue-300 mb-4">Data Management</h2>
          <div className="flex flex-row gap-3">
            <button
              onClick={handleExport}
              className="flex flex-col items-center justify-center gap-2 flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600/80 dark:hover:bg-blue-600/90 dark:shadow-[0_0_10px_rgba(59,130,246,0.2)] text-white rounded-lg transition-colors border-2 border-blue-600 dark:border-blue-500/50"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-medium">Export</span>
            </button>
            <button
              onClick={handleImport}
              className="flex flex-col items-center justify-center gap-2 flex-1 px-4 py-3 bg-white dark:bg-slate-800/40 dark:backdrop-blur-md hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-900 dark:text-white rounded-lg transition-colors border-2 border-slate-200 dark:border-white/5 text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span className="text-xs font-medium">Import</span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-red-500/50 dark:border-red-500/30 dark:shadow-[0_0_10px_rgba(239,68,68,0.1)] rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-red-500 dark:text-red-400 mb-4">Danger Zone</h2>
          <button
            onClick={handleDeleteAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-600/80 dark:hover:bg-red-600/90 dark:shadow-[0_0_10px_rgba(239,68,68,0.2)] text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Delete All Subscriptions
          </button>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-2">
            This will permanently delete all your subscriptions. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  )
}
