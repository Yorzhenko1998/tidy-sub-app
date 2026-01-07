'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSubscriptions } from '@/contexts/SubscriptionContext'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

// Base44 exact color palette: Red, Blue, Teal, Gray
const COLORS = ['#EF4444', '#3B82F6', '#14B8A6', '#94A3B8', '#EF4444', '#3B82F6', '#14B8A6', '#94A3B8']

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

export default function AnalyticsTab() {
  const { subscriptions, globalCurrency } = useSubscriptions()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate totals for different periods (only active subscriptions)
  const totalMonthly = useMemo(() => {
    return subscriptions
      .filter(sub => sub.isActive !== false)
      .reduce((sum, sub) => {
        const amountInGlobal = convertCurrency(sub.amount, sub.currency, globalCurrency)
        if (sub.billingInterval === 'Yearly') {
          return sum + amountInGlobal / 12
        }
        return sum + amountInGlobal
      }, 0)
  }, [subscriptions, globalCurrency])

  const totalWeekly = useMemo(() => {
    return totalMonthly / 4.33
  }, [totalMonthly])

  const totalYearly = useMemo(() => {
    return totalMonthly * 12
  }, [totalMonthly])

  // Prepare chart data by category (only active subscriptions)
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {}
    
    subscriptions
      .filter(sub => sub.isActive !== false)
      .forEach((sub) => {
        const amountInGlobal = convertCurrency(sub.amount, sub.currency, globalCurrency)
        const monthlyAmount = sub.billingInterval === 'Yearly' ? amountInGlobal / 12 : amountInGlobal
        categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + monthlyAmount
      })

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [subscriptions, globalCurrency])

  // Get top subscriptions (only active)
  const topSubscriptions = useMemo(() => {
    return [...subscriptions]
      .filter(sub => sub.isActive !== false)
      .map((sub) => {
        const amountInGlobal = convertCurrency(sub.amount, sub.currency, globalCurrency)
        return {
          ...sub,
          monthlyAmount: sub.billingInterval === 'Yearly' ? amountInGlobal / 12 : amountInGlobal
        }
      })
      .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
      .slice(0, 5)
  }, [subscriptions, globalCurrency])

  // Prevent hydration mismatch - show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0f172a] dark:bg-[#1e293b] rounded-xl mb-4 dark:border dark:border-slate-700/40 dark:border-b dark:border-white/5">
            <h1 className="text-3xl font-bold tracking-tight !text-white text-center py-3">Your Statistics</h1>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-white dark:bg-slate-800/40 rounded-2xl shadow-sm p-4">
              <p className="text-sm text-slate-900 dark:text-slate-100 mb-1">Weekly</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">-</p>
            </div>
            <div className="text-center !bg-slate-800 dark:!bg-slate-800/40 rounded-2xl shadow-lg p-4">
              <p className="text-sm !text-white mb-1">Monthly</p>
              <p className="text-3xl font-bold tracking-tight !text-white">-</p>
            </div>
            <div className="text-center bg-white dark:bg-slate-800/40 rounded-2xl shadow-sm p-4">
              <p className="text-sm text-slate-900 dark:text-slate-100 mb-1">Yearly</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">-</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] px-4 md:px-6 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] md:pt-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header Block - Your Statistics */}
        <div className="bg-[#0f172a] dark:bg-[#1e293b] rounded-xl mb-4 mt-2 dark:border dark:border-slate-700/40 dark:border-b dark:border-white/5">
          <h1 className="text-3xl font-bold tracking-tight !text-white text-center py-3">Your Statistics</h1>
        </div>

        {/* Triple Summary Section */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Weekly - Left */}
          <div className="text-center bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border dark:border-slate-700/40 rounded-2xl shadow-sm px-3 py-2 flex-shrink-0">
            <p className="text-sm text-slate-900 dark:text-slate-100 mb-1">Weekly</p>
            <p className="text-base md:text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {getCurrencySymbol(globalCurrency)}{totalWeekly.toFixed(2)}
            </p>
          </div>
          
          {/* Monthly - Center (Priority/Focal Point) - Strictly Centered */}
          <div className="text-center !bg-slate-800 dark:!bg-slate-800/40 dark:backdrop-blur-md rounded-2xl shadow-lg px-3 py-2 flex flex-col justify-center flex-shrink-0 dark:border-blue-500/30 dark:shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <p className="text-sm !text-white mb-1">Monthly</p>
            <p className="text-base md:text-xl font-bold tracking-tight !text-white whitespace-nowrap">
              {getCurrencySymbol(globalCurrency)}{totalMonthly.toFixed(2)}
            </p>
          </div>
          
          {/* Yearly - Right */}
          <div className="text-center bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border dark:border-slate-700/40 rounded-2xl shadow-sm px-3 py-2 flex-shrink-0">
            <p className="text-sm text-slate-900 dark:text-slate-100 mb-1">Yearly</p>
            <p className="text-base md:text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {getCurrencySymbol(globalCurrency)}{totalYearly.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Title Bar - Subscriptions pie */}
        <div className="bg-[#0f172a] dark:bg-[#1e293b] rounded-xl mb-2 dark:border dark:border-slate-700/40 dark:border-b dark:border-white/5">
          <h3 className="text-xl font-bold tracking-tight !text-white text-center py-3">Subscriptions pie</h3>
        </div>

        {/* Doughnut Chart Card */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border dark:border-slate-700/40 rounded-2xl shadow-sm p-6 mb-6">
          {chartData.length > 0 ? (
            <div className="relative select-none pointer-events-none">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart role="presentation" tabIndex={-1}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    cornerRadius={6}
                    labelLine={false}
                    label={false}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Monthly total</p>
                  <p className="font-bold text-lg md:text-2xl text-slate-900 dark:text-white">
                    {getCurrencySymbol(globalCurrency)}{totalMonthly.toFixed(2)}
                  </p>
                </div>
              </div>
              {/* Legend Below Chart */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {chartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-slate-900 dark:text-slate-100 font-medium tracking-tight">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-gray-400">
              No subscriptions to display
            </div>
          )}
        </div>

        {/* Title Bar - Top */}
        <div className="bg-[#0f172a] dark:bg-[#1e293b] rounded-xl mb-2 dark:border dark:border-slate-700/40 dark:border-b dark:border-white/5">
          <h3 className="text-xl font-bold tracking-tight !text-white text-center py-3">Top</h3>
        </div>

        {/* Top Subscriptions List Card */}
        <div className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md border border-slate-200 dark:border dark:border-slate-700/40 rounded-2xl shadow-sm p-6">
          {topSubscriptions.length > 0 ? (
            <div className="space-y-3">
              {topSubscriptions.map((sub, index) => (
                <div key={sub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="text-slate-900 dark:text-slate-100 font-medium">{sub.name}</span>
                  </div>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">
                    {getCurrencySymbol(globalCurrency)}{sub.monthlyAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-gray-400">No subscriptions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
