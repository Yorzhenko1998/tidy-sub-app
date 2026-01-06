'use client'

import { Home, BarChart3, Plus, Calendar, Settings } from 'lucide-react'

export type Tab = 'home' | 'analytics' | 'calendar' | 'settings'

interface NavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onAddClick: () => void
}

export default function Navigation({ activeTab, onTabChange, onAddClick }: NavigationProps) {
  const tabs = [
    { id: 'home' as Tab, icon: Home, label: 'Home' },
    { id: 'analytics' as Tab, icon: BarChart3, label: 'Analytics' },
    { id: 'calendar' as Tab, icon: Calendar, label: 'Calendar' },
    { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-md border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {/* Home */}
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'home'
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            aria-label="Home"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'analytics'
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            aria-label="Analytics"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Analytics</span>
          </button>

          {/* Add Button in the middle */}
          <button
            onClick={onAddClick}
            className="flex flex-col items-center gap-1 px-2 py-2"
            aria-label="Add subscription"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors -mt-6">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-blue-400 mt-1">Add</span>
          </button>

          {/* Calendar */}
          <button
            onClick={() => onTabChange('calendar')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'calendar'
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            aria-label="Calendar"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Calendar</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

