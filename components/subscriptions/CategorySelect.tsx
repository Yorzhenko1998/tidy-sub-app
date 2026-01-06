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
      className="w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
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
