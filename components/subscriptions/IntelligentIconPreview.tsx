'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'

interface IntelligentIconPreviewProps {
  name: string
  websiteUrl?: string
  currentIcon?: string
  brandIconUrl?: string
  onIconChange?: (iconId: string) => void
}

// Manual brand mapping for popular services
const BRAND_ICONS: Record<string, string> = {
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
}

export default function IntelligentIconPreview({ name, websiteUrl, currentIcon, brandIconUrl, onIconChange }: IntelligentIconPreviewProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const resolveIcon = async () => {
      setIsLoading(true)
      let resolvedUrl: string | null = null

      // Normalize website URL: add https:// if missing
      let normalizedUrl = websiteUrl
      if (normalizedUrl && !normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`
      }

      // Priority 1: Website URL Favicon (if URL is present, this overrides everything)
      if (normalizedUrl) {
        try {
          const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
          resolvedUrl = faviconUrl
        } catch (error) {
          console.log('Favicon fetch failed, trying next method')
        }
      }

      // Priority 2: Manually Selected Brand Icon (from brand search)
      if (!resolvedUrl && brandIconUrl) {
        resolvedUrl = brandIconUrl
      }

      // Priority 3: Manual Brand Mapping (only if no URL favicon and no manual brand)
      if (!resolvedUrl && name) {
        const normalizedName = name.toLowerCase().trim()
        for (const [brand, url] of Object.entries(BRAND_ICONS)) {
          if (normalizedName.includes(brand)) {
            resolvedUrl = url
            break
          }
        }
      }

      // Priority 4: Simple-Icons (try common brand name, only if no URL, no manual brand, and no brand match)
      if (!resolvedUrl && name) {
        const normalizedName = name.toLowerCase().trim().replace(/\s+/g, '')
        // Try direct match with simple-icons CDN
        const simpleIconUrl = `https://cdn.simpleicons.org/${normalizedName}/000000`
        resolvedUrl = simpleIconUrl
      }

      setIconUrl(resolvedUrl)
      setIsLoading(false)
    }

    if (name || websiteUrl || brandIconUrl) {
      resolveIcon()
    } else {
      setIconUrl(null)
      setIsLoading(false)
    }
  }, [name, websiteUrl, brandIconUrl])

  if (!name && !websiteUrl) {
    return (
      <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 flex items-center justify-center flex-shrink-0 p-1.5">
        <ImageIcon className="w-6 h-6 text-slate-400 dark:text-gray-500" />
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      ) : iconUrl ? (
        <img
          src={iconUrl}
          alt={name || 'Subscription icon'}
          className="w-full h-full object-contain"
          onError={() => setIconUrl(null)}
        />
      ) : (
        <ImageIcon className="w-6 h-6 text-slate-400 dark:text-gray-500" />
      )}
    </div>
  )
}

