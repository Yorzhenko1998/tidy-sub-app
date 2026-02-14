'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSubscriptions } from '@/contexts/SubscriptionContext'
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

// Convert amount from any currency to target currency
const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount
  // Convert to USD first, then to target
  const toUSD = amount / EXCHANGE_RATES[fromCurrency]
  return toUSD * EXCHANGE_RATES[toCurrency]
}

export default function CalendarTab() {
  const { subscriptions, globalCurrency } = useSubscriptions()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Auto-select today on mount
  useEffect(() => {
    const today = new Date()
    setSelectedDate(today)
    // Also set currentDate to today's month if needed
    setCurrentDate(today)
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Check if subscription is in trial period
  const isInTrial = (sub: any): boolean => {
    const trialPeriod = sub.trialPeriod
    if (!trialPeriod) return false
    
    const trialEndsOn = sub.trialEndsOn
    if (!trialEndsOn) return false
    
    const trialEndDate = new Date(trialEndsOn)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    trialEndDate.setHours(0, 0, 0, 0)
    
    return trialEndDate >= today
  }

  // Calculate payment dates for subscriptions
  const getPaymentDates = useMemo(() => {
    const paymentDates: Record<number, Array<{ id: string; name: string; color: string }>> = {}
    
    subscriptions.forEach((sub) => {
      // Skip if subscription is in trial period
      if (isInTrial(sub)) {
        return
      }

      const startDate = new Date(sub.startDate)
      const startDay = startDate.getDate()
      const startMonth = startDate.getMonth()
      const startYear = startDate.getFullYear()
      
      // If subscription has trial period, calculate first payment after trial ends
      let effectiveStartDate = startDate
      if ((sub as any).trialPeriod && (sub as any).trialEndsOn) {
        const trialEndDate = new Date((sub as any).trialEndsOn)
        // First payment is after trial ends, based on billing interval
        if (sub.billingInterval === 'Monthly') {
          effectiveStartDate = new Date(trialEndDate)
          effectiveStartDate.setDate(trialEndDate.getDate() + 1)
        } else if (sub.billingInterval === 'Yearly') {
          effectiveStartDate = new Date(trialEndDate)
          effectiveStartDate.setFullYear(trialEndDate.getFullYear() + 1)
        }
      }
      
      const effectiveDay = effectiveStartDate.getDate()
      const effectiveMonth = effectiveStartDate.getMonth()
      const effectiveYear = effectiveStartDate.getFullYear()
      
      if (sub.billingInterval === 'Monthly') {
        // For monthly subscriptions, payment recurs on the same day of each month
        // If subscription started on Jan 5th, it shows on Feb 5th, March 5th, etc.
        // We show it for the current month if the day exists in that month
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
        const dayToShow = Math.min(effectiveDay, daysInCurrentMonth)
        
        // Only show if the effective start date has passed
        const effectiveStart = new Date(effectiveYear, effectiveMonth, effectiveDay)
        const currentMonthStart = new Date(year, month, 1)
        
        if (effectiveStart <= currentMonthStart || 
            (year === effectiveYear && month === effectiveMonth)) {
          if (!paymentDates[dayToShow]) {
            paymentDates[dayToShow] = []
          }
          paymentDates[dayToShow].push({
            id: sub.id,
            name: sub.name,
            color: sub.color
          })
        }
      } else if (sub.billingInterval === 'Yearly') {
        // For yearly subscriptions, payment recurs on the same date each year
        // Only show if it's the same month as the effective start date
        if (effectiveMonth === month) {
          const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
          const dayToShow = Math.min(effectiveDay, daysInCurrentMonth)
          
          // Only show if the effective start date has passed
          const effectiveStart = new Date(effectiveYear, effectiveMonth, effectiveDay)
          const currentDate = new Date(year, month, dayToShow)
          
          if (effectiveStart <= currentDate || 
              (year === effectiveYear && month === effectiveMonth)) {
            if (!paymentDates[dayToShow]) {
              paymentDates[dayToShow] = []
            }
            paymentDates[dayToShow].push({
              id: sub.id,
              name: sub.name,
              color: sub.color
            })
          }
        }
      }
    })
    
    return paymentDates
  }, [subscriptions, month, year])

  // Get payments for selected date with full subscription details
  const selectedDatePayments = useMemo(() => {
    if (!selectedDate) return []
    const day = selectedDate.getDate()
    const paymentIds = getPaymentDates[day] || []
    
    // Get full subscription details for payments
    return paymentIds.map((payment) => {
      const sub = subscriptions.find((s) => s.id === payment.id)
      return sub ? { ...payment, subscription: sub } : null
    }).filter(Boolean) as Array<{ id: string; name: string; color: string; subscription: Subscription }>
  }, [selectedDate, getPaymentDates, subscriptions])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Generate calendar days
  const calendarDays = []
  
  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    calendarDays.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) })
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true, date: new Date(year, month, day) })
  }
  
  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({ day, isCurrentMonth: false, date: new Date(year, month + 1, day) })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(env(safe-area-inset-top),2.5rem)] md:pt-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <header className="mt-2 mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-center">
            Calendar
          </h1>
        </header>

        <div className="md:flex md:items-start md:gap-4">
          {/* Calendar - glassmorphism + shadow */}
          <div className="bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-5 md:p-6 mb-4 md:mb-0 md:max-w-[360px] md:mx-auto md:flex-none">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 py-1.5 md:py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {calendarDays.map(({ day, isCurrentMonth, date }, index) => {
                const payments = isCurrentMonth ? (getPaymentDates[day] || []) : []
                const isSelected = selectedDate && 
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear()
                const isTodayDate = isToday(date)

                const hasPayments = payments.length > 0
                return (
                  <button
                    key={index}
                    onClick={() => isCurrentMonth && setSelectedDate(date)}
                    className={`relative p-1.5 md:p-2 rounded-lg border-2 transition-all aspect-square flex flex-col items-center justify-center ${
                      !isCurrentMonth
                        ? 'text-slate-400 dark:text-gray-600 border-slate-200/70 dark:border-white/10'
                        : isSelected && isTodayDate
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                        : isTodayDate
                        ? 'bg-blue-500/30 dark:bg-blue-500/30 text-slate-900 dark:text-white border-blue-400/60 shadow-md shadow-blue-500/20'
                        : hasPayments
                        ? 'text-slate-700 dark:text-gray-300 border-slate-200/70 dark:border-white/10 hover:bg-white/10 dark:hover:bg-white/5 shadow-sm shadow-slate-500/10'
                        : 'text-slate-700 dark:text-gray-300 border-slate-200/70 dark:border-white/10 hover:bg-blue-50/50 dark:hover:bg-white/5'
                    }`}
                    disabled={!isCurrentMonth}
                  >
                    <span className="text-xs md:text-sm font-medium">{day}</span>
                    {payments.length > 0 && (
                      <div className="flex gap-0.5 md:gap-1 justify-center mt-1">
                        {payments.slice(0, 3).map((payment) => (
                          <div
                            key={payment.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: payment.color }}
                          />
                        ))}
                        {payments.length > 3 && (
                          <span className="text-[10px] md:text-xs">+{payments.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Date Payments - glassmorphism */}
          <div className="bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-4 md:p-5 md:flex-1 md:ml-0 md:mt-0 mt-4">
            <h3 className="text-sm md:text-lg font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">
              {selectedDate
                ? `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                : 'Select a date to view payments'}
            </h3>
            {selectedDatePayments.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {selectedDatePayments.map((payment) => {
                  const sub = payment.subscription
                  const currencySymbol = getCurrencySymbol(globalCurrency)
                  return (
                    <div
                      key={payment.id}
                      className="bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-lg py-2 md:py-2.5 px-3 md:px-4 hover:border-white/30 dark:hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                            style={{ backgroundColor: payment.color }}
                          />
                          <span className="text-slate-900 dark:text-white font-semibold text-sm truncate">{payment.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-900 dark:text-white font-semibold text-sm whitespace-nowrap">
                            {currencySymbol}{sub.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : selectedDate && selectedDatePayments.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No payments scheduled for this date</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
