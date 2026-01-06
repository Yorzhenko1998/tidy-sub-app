'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomDatePickerProps {
  value: string
  onChange: (date: string) => void
  className?: string
}

export default function CustomDatePicker({ value, onChange, className = '' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedDate = value ? new Date(value) : new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const handleDateSelect = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    onChange(dateString)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 px-4 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent flex items-center justify-between text-base ${className}`}
      >
        <span>{value ? formatDisplayDate(value) : 'Select date'}</span>
        <Calendar className="w-5 h-5 text-slate-400 dark:text-gray-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-[320px] bg-white dark:bg-slate-900/95 dark:backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-gray-300" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-slate-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const dateString = date.toISOString().split('T')[0]
              const isSelected = value === dateString
              const isToday = date.toDateString() === today.toDateString()
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth()

              return (
                <button
                  key={dateString}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                    !isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-700'
                      : isSelected
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : isToday
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-400'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

