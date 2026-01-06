'use client'

import { useState, useEffect } from 'react'
import Navigation, { Tab } from '@/components/Navigation'
import DashboardTab from '@/components/subscriptions/DashboardTab'
import AnalyticsTab from '@/components/subscriptions/AnalyticsTab'
import CalendarTab from '@/components/subscriptions/CalendarTab'
import SettingsTab from '@/components/subscriptions/SettingsTab'
import AddEditSubscriptionDialog from '@/components/subscriptions/AddEditSubscriptionDialog'
import { useSubscriptions } from '@/contexts/SubscriptionContext'
import { checkAndSendReminders } from '@/utils/notifications'

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const { subscriptions, remindersEnabled, pushNotificationsEnabled } = useSubscriptions()

  // Prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Check for reminders when app opens
  useEffect(() => {
    if (hasMounted && remindersEnabled && pushNotificationsEnabled) {
      // Check immediately
      checkAndSendReminders(subscriptions, remindersEnabled, pushNotificationsEnabled)
      
      // Also check periodically (every hour)
      const interval = setInterval(() => {
        checkAndSendReminders(subscriptions, remindersEnabled, pushNotificationsEnabled)
      }, 60 * 60 * 1000) // 1 hour

      return () => clearInterval(interval)
    }
  }, [hasMounted, subscriptions, remindersEnabled, pushNotificationsEnabled])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
  }

  const handleAddClick = () => {
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardTab />
      case 'analytics':
        return <AnalyticsTab />
      case 'calendar':
        return <CalendarTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <DashboardTab />
    }
  }

  // Prevent hydration mismatch - only render dynamic content after mount
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-slate-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {renderTab()}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddClick={handleAddClick}
      />
      {isDialogOpen && (
        <AddEditSubscriptionDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </>
  )
}
