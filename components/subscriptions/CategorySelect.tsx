'use client'

import { useSubscriptions } from '@/contexts/SubscriptionContext'

interface CategorySelectProps {
  value?: string
  onChange?: (value: string) => void
}

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  const { categories } = useSubscriptions()

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full h-12 px-4 bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
    >
      <option value="" disabled>
        Select a category
      </option>
      {categories.map((category) => (
        <option key={category} value={category} className="bg-white dark:bg-slate-900">
          {category}
        </option>
      ))}
    </select>
  )
}
