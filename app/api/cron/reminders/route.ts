import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT
const CRON_SECRET = process.env.CRON_SECRET

// Helper: zero out time for YYYY-MM-DD comparison
function normalizeDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysBetween(a: string, b: string) {
  // Dates as yyyy-mm-dd
  const da = new Date(a)
  const db = new Date(b)
  da.setHours(0,0,0,0)
  db.setHours(0,0,0,0)
  const diff = da.getTime() - db.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export async function GET(request: NextRequest) {
  // Security check
  const auth = request.headers.get('authorization') || ''
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return NextResponse.json({ error: 'VAPID keys misconfigured' }, { status: 500 })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  // Fetch all subscriptions from Supabase
  // (Assume you have SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY in env)
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase env not set' }, { status: 500 })
  }

  // Adjust table and field names as appropriate!
  const fetchRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?select=*`, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      Prefer: 'return=representation'
    }
  })
  if (!fetchRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
  const subs = await fetchRes.json()
  const today = normalizeDate(new Date())
  let notified = 0

  // For each subscription
  for (const sub of subs) {
    // Expected: sub.next_payment_date (string: yyyy-mm-dd), sub.reminder_days (number),
    // sub.name (string), sub.push_subscription (object)
    const { next_payment_date, reminder_days, name, push_subscription } = sub

    if (!next_payment_date || reminder_days == null || !name || !push_subscription) {
      continue
    }
    // Calculate the notification date
    const notifDate = new Date(next_payment_date)
    notifDate.setDate(notifDate.getDate() - reminder_days)
    const notifDateStr = normalizeDate(notifDate)

    if (notifDateStr !== today) continue

    // How many days until due?
    const dueIn = daysBetween(next_payment_date, today)

    // English messages
    let title: string
    let body: string

    if (dueIn === 0) {
      title = 'Payment Due Today'
      body = `Your ${name} subscription is due today!`
    } else if (dueIn === 1) {
      title = 'Payment Due Tomorrow'
      body = `Your ${name} subscription is due tomorrow!`
    } else {
      title = 'Upcoming Payment'
      body = `Your ${name} subscription is due in ${dueIn} days.`
    }

    try {
      await webpush.sendNotification(
        push_subscription as any,
        JSON.stringify({ title, body })
      )
      notified++
    } catch (e) {
      // Log error but keep going for other users
      console.error('Failed to send push to', name, '--', e)
    }
  }

  return NextResponse.json({ success: true, notified })
}