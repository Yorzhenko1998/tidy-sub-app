'use client'

import { DollarSign, Building2, Banknote, Car, TrendingUp, Zap, Heart, Briefcase, Play, Code } from 'lucide-react'

interface IconPickerProps {
  value?: string
  onChange?: (value: string) => void
}

const icons = [
  { id: 'money', icon: DollarSign, label: 'Money' },
  { id: 'building', icon: Building2, label: 'Building' },
  { id: 'bank', icon: Banknote, label: 'Bank' },
  { id: 'car', icon: Car, label: 'Car' },
  { id: 'investment', icon: TrendingUp, label: 'Investment' },
  { id: 'utilities', icon: Zap, label: 'Utilities' },
  { id: 'health', icon: Heart, label: 'Health' },
  { id: 'work', icon: Briefcase, label: 'Work' },
  { id: 'entertainment', icon: Play, label: 'Entertainment' },
  { id: 'digital-services', icon: Code, label: 'Digital Services' },
]

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="max-h-64 overflow-y-auto smooth-scroll">
      <div className="grid grid-cols-3 gap-3 pr-2">
        {icons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange?.(id)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              value === id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-gray-600'
            }`}
          >
            <Icon className={`w-6 h-6 mx-auto mb-1 ${value === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-white'}`} strokeWidth={1.5} />
            <p className={`text-xs ${value === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-gray-400'}`}>{label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
