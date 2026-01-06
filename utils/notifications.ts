// Browser notification utilities

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  // Permission is 'default', request it
  const permission = await Notification.requestPermission()
  return permission
}

export const checkAndSendReminders = (
  subscriptions: Array<{
    id: string
    name: string
    amount: number
    currency: string
    billingInterval: 'Monthly' | 'Yearly'
    startDate: string
    isActive?: boolean
    trialPeriod?: boolean
    trialEndsOn?: string
  }>,
  remindersEnabled: boolean,
  pushNotificationsEnabled: boolean
) => {
  if (!remindersEnabled || !pushNotificationsEnabled) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const getNextPaymentDate = (sub: typeof subscriptions[0]): Date => {
    const startDate = new Date(sub.startDate)
    
    // Check if subscription is in trial
    if (sub.trialPeriod && sub.trialEndsOn) {
      const trialEnd = new Date(sub.trialEndsOn)
      trialEnd.setHours(0, 0, 0, 0)
      if (trialEnd > today) {
        // Still in trial, next payment is after trial ends
        if (sub.billingInterval === 'Monthly') {
          const nextPayment = new Date(trialEnd)
          nextPayment.setMonth(nextPayment.getMonth() + 1)
          return nextPayment
        } else {
          const nextPayment = new Date(trialEnd)
          nextPayment.setFullYear(nextPayment.getFullYear() + 1)
          return nextPayment
        }
      }
    }
    
    // Calculate next payment based on billing interval
    let nextPayment = new Date(startDate)
    while (nextPayment <= today) {
      if (sub.billingInterval === 'Monthly') {
        nextPayment.setMonth(nextPayment.getMonth() + 1)
      } else {
        nextPayment.setFullYear(nextPayment.getFullYear() + 1)
      }
    }
    return nextPayment
  }

  // Get currency symbol
  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£'
    }
    return symbols[currency] || currency
  }

  // Check each active subscription
  subscriptions
    .filter(sub => sub.isActive !== false)
    .forEach((sub) => {
      const nextPayment = getNextPaymentDate(sub)
      nextPayment.setHours(0, 0, 0, 0)

      // Check if payment is due tomorrow
      if (nextPayment.getTime() === tomorrow.getTime()) {
        const currencySymbol = getCurrencySymbol(sub.currency)
        const amount = sub.amount.toFixed(2)
        
        new Notification('Subscription Reminder', {
          body: `Reminder: ${sub.name} is due tomorrow (${currencySymbol}${amount})`,
          icon: '/favicon.ico',
          tag: `reminder-${sub.id}`,
          requireInteraction: false
        })
      }
    })
}

