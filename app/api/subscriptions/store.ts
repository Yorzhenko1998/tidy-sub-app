/**
 * In-memory store for subscriptions synced from the client.
 * Used by the cron reminders job. For production at scale, replace with a database.
 */

export interface StoredSubscription {
  id: string
  name: string
  amount: number
  currency: string
  billingInterval: 'Monthly' | 'Yearly'
  startDate: string
  category?: string
  icon?: string
  color?: string
  isActive?: boolean
  reminderDays?: number
  pushSubscription?: { endpoint: string; keys?: Record<string, string> } | null
  trialPeriod?: boolean
  trialEndsOn?: string
}

let store: StoredSubscription[] = []

export function getSubscriptions(): StoredSubscription[] {
  return store
}

export function setSubscriptions(subs: StoredSubscription[]): void {
  store = subs
}
