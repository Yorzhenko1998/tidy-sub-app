'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Edit2, Trash2, ArrowUpDown, PauseCircle, PlayCircle } from 'lucide-react'
import { useSubscriptions } from '@/contexts/SubscriptionContext'
import AddEditSubscriptionDialog from './AddEditSubscriptionDialog'
import type { Subscription } from '@/contexts/SubscriptionContext'

// Hardcoded exchange rates (base: USD)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.27
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

// Convert amount to base currency (USD)
const convertToBaseCurrency = (amount: number, currency: string): number => {
  const rate = EXCHANGE_RATES[currency] || 1.0
  return amount * rate
}

type SortOption = 'nextPayment' | 'priceHigh' | 'alphabetical'

export default function DashboardTab() {
  const { subscriptions, deleteSubscription, updateSubscription, globalCurrency } = useSubscriptions()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('nextPayment')
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate next payment date for a subscription
  const getNextPaymentDate = (sub: Subscription): Date => {
    const startDate = new Date(sub.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if subscription is in trial
    const trialPeriod = (sub as any).trialPeriod
    const trialEndsOn = (sub as any).trialEndsOn
    if (trialPeriod && trialEndsOn) {
      const trialEnd = new Date(trialEndsOn)
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

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = subscriptions.filter((sub) => {
      // Filter by search query
      if (searchQuery.trim()) {
        if (!sub.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false
        }
      }
      return true
    })

    // Sort subscriptions
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'nextPayment':
          const dateA = getNextPaymentDate(a).getTime()
          const dateB = getNextPaymentDate(b).getTime()
          return dateA - dateB
        
        case 'priceHigh':
          const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
            if (fromCurrency === toCurrency) return amount
            const toUSD = amount / EXCHANGE_RATES[fromCurrency]
            return toUSD * EXCHANGE_RATES[toCurrency]
          }
          const amountA = convertCurrency(a.amount, a.currency, globalCurrency)
          const amountB = convertCurrency(b.amount, b.currency, globalCurrency)
          return amountB - amountA
        
        case 'alphabetical':
          return a.name.localeCompare(b.name)
        
        default:
          return 0
      }
    })

    return sorted
  }, [subscriptions, searchQuery, sortOption, globalCurrency])

  // Convert amount from any currency to target currency
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount
    // Convert to USD first, then to target
    const toUSD = amount / EXCHANGE_RATES[fromCurrency]
    return toUSD * EXCHANGE_RATES[toCurrency]
  }

  // Check if subscription is in trial period
  const isInTrial = (sub: Subscription): boolean => {
    const trialPeriod = (sub as any).trialPeriod
    if (!trialPeriod) return false
    
    const trialEndsOn = (sub as any).trialEndsOn
    if (!trialEndsOn) return false
    
    const trialEndDate = new Date(trialEndsOn)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    trialEndDate.setHours(0, 0, 0, 0)
    
    return trialEndDate >= today
  }


  const activeCount = filteredAndSortedSubscriptions.filter(sub => sub.isActive !== false).length

  const handleToggleActive = (subscription: Subscription) => {
    updateSubscription(subscription.id, {
      ...subscription,
      isActive: !(subscription.isActive !== false)
    })
  }

  const handleAddClick = () => {
    setEditingSubscription(null)
    setIsDialogOpen(true)
  }

  const handleEditClick = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription(id)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingSubscription(null)
  }

  // Map icon IDs to emojis for display (fallback only)
  const getIconDisplay = (iconId: string) => {
    const iconMap: Record<string, string> = {
      money: '💰',
      building: '🏢',
      bank: '🏦',
      car: '🚗',
      investment: '📈',
      utilities: '⚡',
      health: '❤️',
      work: '💼',
      entertainment: '▶️',
      'digital-services': '💻'
    }
    return iconMap[iconId] || '📦'
  }

  // Subscription Icon Component with strict priority: logoUrl > brandIconUrl > categoryIcon
  const SubscriptionIcon = ({ subscription }: { subscription: Subscription }) => {
    const [logoError, setLogoError] = useState(false)
    const [brandError, setBrandError] = useState(false)

    // Strict Priority Order: logoUrl || brandIconUrl || categoryIcon
    const displayIcon = subscription.logoUrl || subscription.brandIconUrl || null

    // Priority 1: logoUrl (Automatic - from website URL favicon)
    // This MUST override category icon even if category is selected
    if (subscription.logoUrl && !logoError) {
      return (
        <img
          src={subscription.logoUrl}
          alt={subscription.name}
          className="w-full h-full object-contain"
          onError={() => setLogoError(true)}
        />
      )
    }

    // Priority 2: brandIconUrl (Manual - user selected brand icon)
    // Only show if logoUrl doesn't exist or failed to load
    if (subscription.brandIconUrl && !brandError && (!subscription.logoUrl || logoError)) {
      return (
        <img
          src={subscription.brandIconUrl}
          alt={subscription.name}
          className="w-full h-full object-contain"
          onError={() => setBrandError(true)}
        />
      )
    }

    // Priority 3: categoryIcon (Fallback - generic category icon)
    // ONLY show if both logoUrl and brandIconUrl are missing or failed
    if (!displayIcon || (logoError && brandError)) {
      return <span>{getIconDisplay(subscription.icon)}</span>
    }

    // Should not reach here, but fallback to category icon
    return <span>{getIconDisplay(subscription.icon)}</span>
  }



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header Block - Your Subscriptions */}
        <div className="bg-[#0f172a] dark:bg-slate-800/80 rounded-xl mb-4 dark:border dark:border-slate-700/40 dark:border-b dark:border-white/5">
          <h1 className="text-3xl font-bold tracking-tight !text-white text-center py-3">Your Subscriptions</h1>
        </div>

        {/* Search Bar and Sort */}
        <div className="flex gap-3 mb-2">
          <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-5 h-5 pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="pl-10 pr-8 py-3 bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="nextPayment">Next Payment</option>
              <option value="priceHigh">Price (High to Low)</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Count */}
        {mounted && (
          <p className="text-sm text-slate-500 text-center mb-6">
            {activeCount} active {activeCount === 1 ? 'subscription' : 'subscriptions'}
          </p>
        )}

        {/* Subscription Cards */}
        <div className="space-y-4">
          {filteredAndSortedSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-gray-400 text-lg">
                {searchQuery ? 'No subscriptions found matching your search.' : 'No subscriptions yet. Click the + button to add one!'}
              </p>
            </div>
          ) : (
            filteredAndSortedSubscriptions.map((subscription) => {
              const isActive = subscription.isActive !== false
              // Convert to global currency for display
              const amountInGlobal = convertCurrency(subscription.amount, subscription.currency, globalCurrency)
              const currencySymbol = getCurrencySymbol(globalCurrency)
              
              return (
                <div
                  key={subscription.id}
                  className={`bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 hover:border-slate-300 dark:hover:border-white/10 transition-colors ${
                    !isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Logo/Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${
                          subscription.logoUrl || subscription.brandIconUrl
                            ? 'bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 p-1.5'
                            : ''
                        }`}
                        style={!subscription.logoUrl && !subscription.brandIconUrl ? { backgroundColor: subscription.color + '20' } : undefined}
                      >
                        <SubscriptionIcon subscription={subscription} />
                      </div>
                      
                      {/* Subscription Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-slate-900 dark:text-white font-semibold text-lg">
                            {subscription.name}
                          </h3>
                          {isInTrial(subscription) && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
                              Trial
                            </span>
                          )}
                          {!isActive && (
                            <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 dark:text-slate-500 text-xs font-medium rounded">
                              Paused
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">
                          {subscription.billingInterval}
                        </p>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-slate-900 dark:text-white font-semibold text-lg">
                          {currencySymbol}{amountInGlobal.toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Action Icons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleActive(subscription)}
                          className="text-slate-500 dark:text-gray-400 hover:text-blue-400 transition-colors"
                          aria-label={isActive ? 'Pause subscription' : 'Resume subscription'}
                        >
                          {isActive ? (
                            <PauseCircle className="w-5 h-5" />
                          ) : (
                            <PlayCircle className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditClick(subscription)}
                          className="text-slate-500 dark:text-gray-400 hover:text-blue-400 transition-colors"
                          aria-label="Edit subscription"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(subscription.id)}
                          className="text-slate-500 dark:text-gray-400 hover:text-red-400 transition-colors"
                          aria-label="Delete subscription"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <AddEditSubscriptionDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          subscription={editingSubscription || undefined}
        />
      )}
    </div>
  )
}
