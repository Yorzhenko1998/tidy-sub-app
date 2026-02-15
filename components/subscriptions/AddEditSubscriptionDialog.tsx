'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useSubscriptions } from '@/contexts/SubscriptionContext'
import type { Subscription } from '@/contexts/SubscriptionContext'
import CategorySelect from './CategorySelect'
import IconPicker from './IconPicker'
import CustomDatePicker from './CustomDatePicker'
import IntelligentIconPreview from './IntelligentIconPreview'
import BrandIconSearch from './BrandIconSearch'

interface AddEditSubscriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  subscription?: Subscription
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  '#EC7063', '#5DADE2', '#58D68D', '#F4D03F', '#AF7AC5'
]

const toLocalISODate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const normalized = new Date(local.getTime() - local.getTimezoneOffset() * 60000)
  return normalized.toISOString().split('T')[0]
}

export default function AddEditSubscriptionDialog({
  isOpen,
  onClose,
  subscription
}: AddEditSubscriptionDialogProps) {
  const { addSubscription, updateSubscription, globalCurrency } = useSubscriptions()
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: globalCurrency,
    billingInterval: 'Monthly' as 'Monthly' | 'Yearly',
    startDate: '',
    category: '',
    icon: '',
    color: colors[0],
    websiteUrl: '',
    remindMe: '1',
    trialPeriod: false,
    trialEndsOn: '',
    notes: ''
  })
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({})
  const [showBrandSearch, setShowBrandSearch] = useState(false)
  const [selectedBrandIcon, setSelectedBrandIcon] = useState<string | null>(null)

  // Initialize form data when subscription changes or dialog opens
  useEffect(() => {
    if (subscription) {
      const subIcon = subscription.icon || ''
      const brandIcon = subscription.brandIconUrl
      
      const subAny = subscription as { remindMe?: string; reminder_days?: number }
      const remindVal = subAny.remindMe ?? (subAny.reminder_days != null ? String(subAny.reminder_days) : '1')
      setFormData({
        name: subscription.name,
        amount: subscription.amount.toString(),
        currency: subscription.currency,
        billingInterval: subscription.billingInterval,
        startDate: toLocalISODate(subscription.startDate),
        category: subscription.category,
        icon: subIcon.startsWith('brand:') ? '' : subIcon,
        color: subscription.color,
        websiteUrl: subscription.websiteUrl || '',
        remindMe: remindVal,
        trialPeriod: (subscription as any).trialPeriod || false,
        trialEndsOn: (subscription as any).trialEndsOn ? toLocalISODate((subscription as any).trialEndsOn) : '',
        notes: (subscription as any).notes || ''
      })
      setSelectedBrandIcon(brandIcon || null)
    } else {
      // Reset to defaults for new subscription, using global currency
      setFormData({
        name: '',
        amount: '',
        currency: globalCurrency,
        billingInterval: 'Monthly',
        startDate: toLocalISODate(new Date()),
        category: '',
        icon: '',
        color: colors[0],
        websiteUrl: '',
        remindMe: '1',
        trialPeriod: false,
        trialEndsOn: '',
        notes: ''
      })
      setSelectedBrandIcon(null)
    }
    // Clear errors when dialog opens
    setErrors({})
  }, [subscription, isOpen, globalCurrency])

  // Update currency field when globalCurrency changes (only for new subscriptions)
  useEffect(() => {
    if (!subscription && isOpen && formData.currency !== globalCurrency) {
      setFormData((prev) => ({ ...prev, currency: globalCurrency }))
    }
  }, [globalCurrency, subscription, isOpen])

  const inputClass = 'w-full h-12 px-4 bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent'
  const inputClassError = inputClass + ' border-red-500 dark:border-red-500/70'

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: { name?: string; amount?: string } = {}

    // Validate Name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Validate Amount
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else {
      const amountValue = parseFloat(formData.amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        newErrors.amount = 'Amount must be a positive number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    // Normalize website URL: add https:// if missing protocol
    let normalizedUrl = formData.websiteUrl.trim()
    if (normalizedUrl && !normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Generate logoUrl from website URL if provided (Priority 1: Automatic)
    let logoUrl: string | undefined = undefined
    if (normalizedUrl) {
      try {
        const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      } catch (error) {
        console.error('Error generating logoUrl:', error)
      }
    }

    // Also try to generate logoUrl from name if no URL provided (for brands like Netflix, Megogo)
    // This ensures automatic logo detection even without a URL
    // Uses the same brand mapping as IntelligentIconPreview for consistency
    if (!logoUrl && formData.name) {
      const normalizedName = formData.name.toLowerCase().trim()
      const BRAND_ICONS: Record<string, string> = {
        netflix: 'https://cdn.simpleicons.org/netflix/E50914',
        megogo: 'https://www.google.com/s2/favicons?domain=megogo.net&sz=128',
        spotify: 'https://cdn.simpleicons.org/spotify/1DB954',
        apple: 'https://cdn.simpleicons.org/apple/000000',
        youtube: 'https://cdn.simpleicons.org/youtube/FF0000',
        amazon: 'https://cdn.simpleicons.org/amazon/FF9900',
        disney: 'https://cdn.simpleicons.org/disneyplus/113CCF',
        hulu: 'https://cdn.simpleicons.org/hulu/1CE783',
        hbo: 'https://cdn.simpleicons.org/hbo/000000',
        microsoft: 'https://cdn.simpleicons.org/microsoft/0078D4',
        google: 'https://cdn.simpleicons.org/google/4285F4',
        adobe: 'https://cdn.simpleicons.org/adobe/FF0000',
        dropbox: 'https://cdn.simpleicons.org/dropbox/0061FF',
        github: 'https://cdn.simpleicons.org/github/181717',
        figma: 'https://cdn.simpleicons.org/figma/F24E1E',
        notion: 'https://cdn.simpleicons.org/notion/000000',
        slack: 'https://cdn.simpleicons.org/slack/4A154B',
        zoom: 'https://cdn.simpleicons.org/zoom/2D8CFF',
        twitch: 'https://cdn.simpleicons.org/twitch/9146FF',
        discord: 'https://cdn.simpleicons.org/discord/5865F2',
        steam: 'https://cdn.simpleicons.org/steam/000000',
        playstation: 'https://cdn.simpleicons.org/playstation/003087',
        xbox: 'https://cdn.simpleicons.org/xbox/107C10',
        uber: 'https://cdn.simpleicons.org/uber/000000',
        doordash: 'https://cdn.simpleicons.org/doordash/FF3008',
        instacart: 'https://cdn.simpleicons.org/instacart/43B02A',
      }
      
      // Check for brand match in name
      for (const [brand, url] of Object.entries(BRAND_ICONS)) {
        if (normalizedName.includes(brand)) {
          logoUrl = url
          break
        }
      }

      // If still no match, try simple-icons CDN with normalized name
      if (!logoUrl) {
        const simpleName = normalizedName.replace(/\s+/g, '')
        logoUrl = `https://cdn.simpleicons.org/${simpleName}/000000`
      }
    }

    const reminder_days = parseInt(formData.remindMe, 10)
    let push_subscription: { endpoint: string; keys?: Record<string, string> } | null = null
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('push_subscription') ?? localStorage.getItem('push_sub')
        if (stored) {
          const parsed = JSON.parse(stored) as { endpoint?: string; keys?: Record<string, string> }
          if (parsed?.endpoint) push_subscription = { endpoint: parsed.endpoint, keys: parsed.keys }
        }
      } catch (_) {}
    }

    const subscriptionData: any = {
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      billingInterval: formData.billingInterval,
      startDate: toLocalISODate(formData.startDate),
      category: formData.category,
      icon: selectedBrandIcon ? `brand:${selectedBrandIcon}` : (formData.icon || 'money'),
      color: formData.color,
      websiteUrl: normalizedUrl || undefined,
      logoUrl: logoUrl || undefined,
      remindMe: formData.remindMe,
      reminder_days,
      push_subscription,
      notes: formData.notes,
      brandIconUrl: selectedBrandIcon || undefined,
      isActive: subscription ? (subscription.isActive !== false) : true
    }

    // Add trial period data if enabled
    if (formData.trialPeriod) {
      subscriptionData.trialPeriod = true
      subscriptionData.trialEndsOn = formData.trialEndsOn ? toLocalISODate(formData.trialEndsOn) : ''
    } else {
      subscriptionData.trialPeriod = false
      subscriptionData.trialEndsOn = ''
    }

    if (subscription) {
      // Update existing subscription
      updateSubscription(subscription.id, subscriptionData)
    } else {
      // Add new subscription
      addSubscription(subscriptionData)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Soft glow orbs - top-right and bottom-left */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-md" aria-hidden />

      <AnimatePresence>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/20 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl"
        >
          {/* Pull-to-dismiss indicator - iOS style */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-400/60 dark:bg-white/30" aria-hidden />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex-1 text-center">
              {subscription ? 'Edit Subscription' : 'Add Subscription'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -m-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} id="subscription-form">
            <div className="space-y-6">
            {/* Row 1: Name + Icon Preview */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) {
                      setErrors({ ...errors, name: undefined })
                    }
                  }}
                  className={errors.name ? inputClassError : inputClass}
                  placeholder="Enter subscription name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
                )}
              </div>
              <div className="mb-0">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <IntelligentIconPreview
                  name={formData.name}
                  websiteUrl={formData.websiteUrl}
                  currentIcon={formData.icon}
                  brandIconUrl={selectedBrandIcon || undefined}
                  onIconChange={(iconId) => setFormData({ ...formData, icon: iconId })}
                />
              </div>
            </div>

            {/* Website URL Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Website URL <span className="text-slate-400 dark:text-slate-500 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.websiteUrl}
                onChange={(e) => {
                  const url = e.target.value.trim()
                  setFormData({ ...formData, websiteUrl: url })
                }}
                className={inputClass}
                placeholder="example.com or https://example.com"
              />
            </div>

            {/* Row 2: Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <CategorySelect
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
              />
            </div>

            {/* Row 3: Amount + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value })
                    if (errors.amount) {
                      setErrors({ ...errors, amount: undefined })
                    }
                  }}
                  className={`${errors.amount ? inputClassError : inputClass} text-lg font-semibold`}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className={inputClass}
                >
                  <option value="USD" className="bg-white dark:bg-slate-900">USD</option>
                  <option value="EUR" className="bg-white dark:bg-slate-900">EUR</option>
                  <option value="GBP" className="bg-white dark:bg-slate-900">GBP</option>
                </select>
              </div>
            </div>

            {/* Row 4: Billing Date + Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Date
                </label>
                <CustomDatePicker
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Billing Interval
                </label>
                <select
                  value={formData.billingInterval}
                  onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value as 'Monthly' | 'Yearly' })}
                  className={inputClass}
                >
                  <option value="Monthly" className="bg-white dark:bg-slate-900">Monthly</option>
                  <option value="Yearly" className="bg-white dark:bg-slate-900">Yearly</option>
                </select>
              </div>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Icon
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowBrandSearch(true)}
                  className="w-full px-4 py-2.5 bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <Search className="w-4 h-4" />
                  Search Brand Icons
                </button>
                <IconPicker
                  value={formData.icon}
                  onChange={(value) => {
                    setFormData({ ...formData, icon: value })
                    setSelectedBrandIcon(null) // Clear brand icon when category icon is selected
                  }}
                />
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-full h-12 rounded-xl border-2 transition-all ${
                      formData.color === color
                        ? 'border-slate-900 dark:border-white scale-110 ring-2 ring-blue-500/30 shadow-lg'
                        : 'border-white/10 dark:border-white/10 hover:border-white/20 dark:hover:border-white/20'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Remind Me */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Remind me
              </label>
              <select
                value={formData.remindMe}
                onChange={(e) => setFormData({ ...formData, remindMe: e.target.value })}
                className={inputClass}
              >
                <option value="1" className="bg-white dark:bg-slate-900">1 day before</option>
                <option value="2" className="bg-white dark:bg-slate-900">2 days before</option>
                <option value="3" className="bg-white dark:bg-slate-900">3 days before</option>
                <option value="7" className="bg-white dark:bg-slate-900">7 days before</option>
                <option value="0" className="bg-white dark:bg-slate-900">Don&apos;t remind me</option>
              </select>
            </div>

            {/* Trial Period Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 dark:border-white/10">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Trial Period
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mark if this subscription has a trial period</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, trialPeriod: !formData.trialPeriod, trialEndsOn: !formData.trialPeriod ? '' : formData.trialEndsOn })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.trialPeriod ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    formData.trialPeriod ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Trial Ends On - Only show when trial period is enabled */}
            {formData.trialPeriod && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Trial Ends On
                </label>
                <CustomDatePicker
                  value={formData.trialEndsOn}
                  onChange={(date) => setFormData({ ...formData, trialEndsOn: date })}
                  className={inputClass}
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className={`${inputClass} py-3 resize-none`}
                placeholder="Add any additional notes about this subscription..."
              />
            </div>
          </div>
          </form>
        </div>

        {/* Footer - Sticky at bottom */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/5 dark:bg-black/10 rounded-b-3xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-white/10 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="subscription-form"
            disabled={!formData.name.trim() || !formData.amount.trim() || parseFloat(formData.amount) <= 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {subscription ? 'Save Changes' : 'Add Subscription'}
          </button>
        </div>
        </motion.div>
      </AnimatePresence>

      {/* Brand Icon Search Modal */}
      {showBrandSearch && (
        <BrandIconSearch
          onSelect={(iconUrl, brandName) => {
            setSelectedBrandIcon(iconUrl)
            setFormData({ ...formData, icon: `brand:${brandName}` })
            setShowBrandSearch(false)
          }}
          onClose={() => setShowBrandSearch(false)}
        />
      )}
    </div>
  )
}
