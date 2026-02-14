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
            className={`p-4 rounded-xl border-2 transition-all backdrop-blur-md ${
              value === id
                ? 'border-blue-500 bg-blue-500/20 dark:bg-blue-500/20 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30'
                : 'border-white/10 dark:border-white/10 bg-white/5 dark:bg-slate-800/40 hover:border-white/20 dark:hover:border-white/20 hover:bg-white/10 dark:hover:bg-white/5'
            }`}
          >
            <Icon className={`w-6 h-6 mx-auto mb-1 ${value === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`} strokeWidth={2} />
            <p className={`text-xs font-medium ${value === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
