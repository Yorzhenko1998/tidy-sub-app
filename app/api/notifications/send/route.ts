import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = 'BPI6ObXIdnO6GMzrCXo-fgUvhRouhIZUBaa8bgkHtYfD1RTVpU8P0x93dqEDcOkhnRZLwSc2NGHfXG-GChiOaxI'
const VAPID_PRIVATE_KEY = '0itCDi_uX-hgUM4e9uHnQ4fSKh8QQw_CRgdB4eHIxuc'
const VAPID_SUBJECT = 'mailto:admin@tidysub.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, title = 'TidySub', body: notificationBody = '' } = body as {
      subscription: { endpoint: string; keys?: Record<string, string> }
      title?: string
      body?: string
    }
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Missing or invalid subscription' },
        { status: 400 }
      )
    }
    const payload = JSON.stringify({ title, body: notificationBody })
    await webpush.sendNotification(subscription, payload)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send notification error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send notification' },
      { status: 500 }
    )
  }
}
