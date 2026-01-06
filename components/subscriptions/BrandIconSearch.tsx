'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'

interface BrandIconSearchProps {
  onSelect: (iconUrl: string, brandName: string) => void
  onClose: () => void
}

// Extended brand database
const BRAND_DATABASE: Record<string, string> = {
  netflix: 'https://cdn.simpleicons.org/netflix/E50914',
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
  airbnb: 'https://cdn.simpleicons.org/airbnb/FF5A5F',
  tesla: 'https://cdn.simpleicons.org/tesla/CC0000',
  nvidia: 'https://cdn.simpleicons.org/nvidia/76B900',
  intel: 'https://cdn.simpleicons.org/intel/0071C5',
  samsung: 'https://cdn.simpleicons.org/samsung/1428A0',
  sony: 'https://cdn.simpleicons.org/sony/000000',
  paypal: 'https://cdn.simpleicons.org/paypal/00457C',
  stripe: 'https://cdn.simpleicons.org/stripe/635BFF',
  shopify: 'https://cdn.simpleicons.org/shopify/96BF48',
  wordpress: 'https://cdn.simpleicons.org/wordpress/21759B',
  squarespace: 'https://cdn.simpleicons.org/squarespace/000000',
  wix: 'https://cdn.simpleicons.org/wix/0C6EFC',
  vercel: 'https://cdn.simpleicons.org/vercel/000000',
  aws: 'https://cdn.simpleicons.org/amazonaws/232F3E',
  azure: 'https://cdn.simpleicons.org/microsoftazure/0078D4',
  gcp: 'https://cdn.simpleicons.org/googlecloud/4285F4',
}

export default function BrandIconSearch({ onSelect, onClose }: BrandIconSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.entries(BRAND_DATABASE).slice(0, 20) // Show first 20 by default
    }
    
    const query = searchQuery.toLowerCase().trim()
    return Object.entries(BRAND_DATABASE).filter(([brand]) =>
      brand.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const handleSelect = (brand: string, url: string) => {
    onSelect(url, brand)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <div className="bg-white dark:bg-slate-900/95 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Search Brand Icons</h3>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands (e.g., Netflix, Spotify)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Brand Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredBrands.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-gray-400">
              No brands found matching "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredBrands.map(([brand, url]) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleSelect(brand, url)}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800/50 dark:backdrop-blur-md hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title={brand}
                >
                  <img
                    src={url}
                    alt={brand}
                    className="w-8 h-8 object-contain mb-1"
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <span className="text-xs text-slate-700 dark:text-gray-300 truncate w-full text-center">
                    {brand}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

