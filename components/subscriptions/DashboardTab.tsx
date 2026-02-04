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
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search')
  
  // Swipe-to-action state
  const [swipeActiveId, setSwipeActiveId] = useState<string | null>(null)
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null)
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({})
  
  const MAX_SWIPE = 160 // pixels revealed on full swipe
  const SWIPE_THRESHOLD = 80 // how far you must swipe to "lock" it open
  
  const handleTouchStart = (id: string, clientX: number) => {
    setSwipeActiveId(id)
    setSwipeStartX(clientX)
  }
  
  const handleTouchMove = (id: string, clientX: number) => {
    if (swipeActiveId !== id || swipeStartX == null) return
    const deltaX = clientX - swipeStartX
    if (deltaX > 0) {
      // no right-swipe; keep at 0
      setSwipeOffsets(prev => ({ ...prev, [id]: 0 }))
      return
    }
    const clamped = Math.max(deltaX, -MAX_SWIPE)
    setSwipeOffsets(prev => ({ ...prev, [id]: clamped }))
  }
  
  const handleTouchEnd = (id: string) => {
    const current = swipeOffsets[id] ?? 0
    const shouldOpen = current <= -SWIPE_THRESHOLD
    setSwipeOffsets(prev => ({ ...prev, [id]: shouldOpen ? -MAX_SWIPE : 0 }))
    setSwipeActiveId(null)
    setSwipeStartX(null)
  }

  // Prevent hydration mismatch and set responsive placeholder
  useEffect(() => {
    setMounted(true)
    
    // Set responsive placeholder
    const updatePlaceholder = () => {
      if (window.innerWidth >= 768) {
        setSearchPlaceholder('Search subscriptions...')
      } else {
        setSearchPlaceholder('Search')
      }
    }
    updatePlaceholder()
    window.addEventListener('resize', updatePlaceholder)
    
    return () => {
      window.removeEventListener('resize', updatePlaceholder)
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] px-4 md:px-6 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(env(safe-area-inset-top),2.5rem)] md:pt-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header - Clean Typography */}
        <header className="mt-2 mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-center">
            Your Subscriptions
          </h1>
        </header>

        {/* Search Bar and Sort */}
        <div className="flex flex-row items-center w-full gap-2 md:gap-3 mb-2">
          <div className="relative w-1/2 md:flex-grow">
            <Search 
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-100 !opacity-100 !block z-10"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 md:h-12 rounded-full bg-white/90 dark:bg-slate-800/60 dark:backdrop-blur-md border border-slate-200/70 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent"
            />
          </div>
          <div className="relative w-1/2 md:w-[180px] md:flex-none">
            <ArrowUpDown 
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-100 !opacity-100 !block z-10"
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="pl-10 pr-8 h-11 md:h-12 w-full bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white text-xs md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="nextPayment" className="truncate">Next Payment</option>
              <option value="priceHigh" className="truncate">Price (High to Low)</option>
              <option value="alphabetical" className="truncate">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Count */}
        {mounted && (
          <p className="text-sm text-slate-500 dark:text-white/60 text-center mb-6">
            {activeCount} active {activeCount === 1 ? 'subscription' : 'subscriptions'}
          </p>
        )}

        {/* Subscription Cards */}
        <div className="space-y-4">
          {filteredAndSortedSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-white/60 text-lg">
                {searchQuery ? 'No subscriptions found matching your search.' : 'No subscriptions yet. Click the + button to add one!'}
              </p>
            </div>
          ) : (
            filteredAndSortedSubscriptions.map((subscription) => {
              const isActive = subscription.isActive !== false
              // Convert to global currency for display
              const amountInGlobal = convertCurrency(subscription.amount, subscription.currency, globalCurrency)
              const currencySymbol = getCurrencySymbol(globalCurrency)
              const nextPaymentDate = getNextPaymentDate(subscription)
              const nextLabel = nextPaymentDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
              
              return (
                <div key={subscription.id} className="relative overflow-hidden">
                  {/* Swipe actions revealed when swiped left */}
                  <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
                    <button
                      onClick={() => {
                        setSwipeOffsets(prev => ({ ...prev, [subscription.id]: 0 }))
                        handleEditClick(subscription)
                      }}
                      className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors"
                      aria-label="Edit subscription"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSwipeOffsets(prev => ({ ...prev, [subscription.id]: 0 }))
                        handleToggleActive(subscription)
                      }}
                      className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm hover:bg-amber-600 transition-colors"
                      aria-label={isActive ? 'Pause subscription' : 'Resume subscription'}
                    >
                      {isActive ? (
                        <PauseCircle className="w-5 h-5" />
                      ) : (
                        <PlayCircle className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSwipeOffsets(prev => ({ ...prev, [subscription.id]: 0 }))
                        handleDeleteClick(subscription.id)
                      }}
                      className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm hover:bg-red-700 transition-colors"
                      aria-label="Delete subscription"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Foreground card that actually moves */}
                  <div
                    className={`bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm py-3 px-4 md:py-4 md:px-5 transition-transform duration-200 ${
                      !isActive ? 'opacity-50' : ''
                    }`}
                    style={{ transform: `translateX(${swipeOffsets[subscription.id] ?? 0}px)` }}
                    onTouchStart={(e) => handleTouchStart(subscription.id, e.touches[0].clientX)}
                    onTouchMove={(e) => handleTouchMove(subscription.id, e.touches[0].clientX)}
                    onTouchEnd={() => handleTouchEnd(subscription.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: logo + title + category */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${
                            subscription.logoUrl || subscription.brandIconUrl
                              ? 'bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 p-1.5'
                              : ''
                          }`}
                          style={
                            !subscription.logoUrl && !subscription.brandIconUrl
                              ? { backgroundColor: subscription.color + '20' }
                              : undefined
                          }
                        >
                          <SubscriptionIcon subscription={subscription} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-slate-900 dark:text-white font-semibold text-base md:text-lg truncate">
                              {subscription.name}
                            </h3>
                            {isInTrial(subscription) && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-medium rounded">
                                Trial
                              </span>
                            )}
                            {!isActive && (
                              <span className="px-2 py-0.5 bg-slate-500/15 text-slate-500 text-[10px] font-medium rounded">
                                Paused
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                            {subscription.category || subscription.billingInterval}
                          </p>
                        </div>
                      </div>

                      {/* Right: price + next date */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                          {currencySymbol}
                          {amountInGlobal.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                          {nextLabel}
                        </p>
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
