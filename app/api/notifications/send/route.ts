import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

export async function POST(request: NextRequest) {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) {
    return NextResponse.json(
      { error: 'VAPID keys not configured' },
      { status: 500 }
    )
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)

  try {
    const body = (await request.json()) as {
      subscription?: { endpoint: string; keys?: Record<string, string> }
      title?: string
      body?: string
    }
    const subscription = body.subscription
    const title = body.title ?? 'TidySub'
    const notificationBody = body.body ?? ''
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Missing or invalid subscription' },
        { status: 400 }
      )
    }
    const payload = JSON.stringify({ title, body: notificationBody })
    await webpush.sendNotification(subscription as any, payload)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send notification error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send notification' },
      { status: 500 }
    )
  }
}
