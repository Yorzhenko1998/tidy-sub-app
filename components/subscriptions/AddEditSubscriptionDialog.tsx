'use client'

import { useState, useEffect } from 'react'
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
        remindMe: (subscription as any).remindMe || '1',
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

  // Update currency field when globalCurrency changes (only for new subscriptions)
  useEffect(() => {
    if (!subscription && isOpen && formData.currency !== globalCurrency) {
      setFormData((prev) => ({ ...prev, currency: globalCurrency }))
    }
  }, [globalCurrency, subscription, isOpen])

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
      logoUrl: logoUrl || undefined, // Ensure logoUrl is saved (automatic logo)
      remindMe: formData.remindMe,
      notes: formData.notes,
      brandIconUrl: selectedBrandIcon || undefined, // Manual brand icon (customIcon)
      isActive: subscription ? (subscription.isActive !== false) : true // Default to active for new subscriptions
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header - Fixed at top */}
        <div className="bg-[#0f172a] dark:bg-slate-800/80 rounded-t-3xl flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-bold tracking-tight !text-white text-center flex-1">
            {subscription ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors ml-4"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          <form onSubmit={handleSubmit} id="subscription-form">
            <div className="p-6 space-y-6 rounded-b-3xl">
            {/* Row 1: Name + Icon Preview */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
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
                  className={`w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-slate-200 dark:border-white/5'
                  }`}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Website URL <span className="text-slate-400 dark:text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.websiteUrl}
                onChange={(e) => {
                  let url = e.target.value.trim()
                  // Auto-add https:// if missing protocol
                  if (url && !url.match(/^https?:\/\//i)) {
                    // Don't modify the input value, just store it as-is
                    // We'll normalize it when saving
                  }
                  setFormData({ ...formData, websiteUrl: url })
                }}
                className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="example.com or https://example.com"
              />
            </div>

            {/* Row 2: Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
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
                  className={`w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg font-semibold ${
                    errors.amount ? 'border-red-500' : 'border-slate-200 dark:border-white/5'
                  }`}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <CustomDatePicker
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Billing Interval
                </label>
                <select
                  value={formData.billingInterval}
                  onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value as 'Monthly' | 'Yearly' })}
                  className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                >
                  <option value="Monthly" className="bg-white dark:bg-slate-900">Monthly</option>
                  <option value="Yearly" className="bg-white dark:bg-slate-900">Yearly</option>
                </select>
              </div>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowBrandSearch(true)}
                  className="w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
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
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-full h-12 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-slate-900 dark:border-white scale-110'
                        : 'border-slate-300 dark:border-gray-700 hover:border-slate-400 dark:hover:border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Remind Me */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Remind me
              </label>
              <select
                value={formData.remindMe}
                onChange={(e) => setFormData({ ...formData, remindMe: e.target.value })}
                className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                <option value="1" className="bg-white dark:bg-slate-900">1 day before</option>
                <option value="3" className="bg-white dark:bg-slate-900">3 days before</option>
                <option value="7" className="bg-white dark:bg-slate-900">7 days before</option>
                <option value="0" className="bg-white dark:bg-slate-900">Don't remind me</option>
              </select>
            </div>

            {/* Trial Period Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 dark:backdrop-blur-md rounded-lg border border-slate-200 dark:border-white/5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                  Trial Period
                </label>
                <p className="text-xs text-slate-500 dark:text-gray-400">Mark if this subscription has a trial period</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, trialPeriod: !formData.trialPeriod, trialEndsOn: !formData.trialPeriod ? '' : formData.trialEndsOn })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.trialPeriod ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-900/50'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
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
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                placeholder="Add any additional notes about this subscription..."
              />
            </div>
          </div>
          </form>
        </div>

        {/* Footer - Sticky at bottom */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 rounded-b-3xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="subscription-form"
            disabled={!formData.name.trim() || !formData.amount.trim() || parseFloat(formData.amount) <= 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-600/80 dark:to-blue-700/80 dark:hover:from-blue-600/90 dark:hover:to-blue-700/90 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] shadow-blue-500/20 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
          >
            {subscription ? 'Save Changes' : 'Add Subscription'}
          </button>
        </div>
      </div>

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
