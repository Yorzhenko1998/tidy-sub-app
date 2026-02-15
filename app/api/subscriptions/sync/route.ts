import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptions, setSubscriptions, StoredSubscription } from '../store'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { subscriptions?: unknown[] }
    const raw = body.subscriptions
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { error: 'Expected { subscriptions: array }' },
        { status: 400 }
      )
    }
    const subs: StoredSubscription[] = raw.map((item: unknown) => {
      const o = item as Record<string, unknown>
      return {
        id: String(o.id ?? ''),
        name: String(o.name ?? ''),
        amount: Number(o.amount) || 0,
        currency: String(o.currency ?? 'USD'),
        billingInterval: (o.billingInterval === 'Yearly' ? 'Yearly' : 'Monthly') as 'Monthly' | 'Yearly',
        startDate: String(o.startDate ?? ''),
        category: o.category != null ? String(o.category) : undefined,
        icon: o.icon != null ? String(o.icon) : undefined,
        color: o.color != null ? String(o.color) : undefined,
        isActive: o.isActive !== false,
        reminderDays: typeof o.reminderDays === 'number' ? o.reminderDays : undefined,
        pushSubscription: (o.pushSubscription as StoredSubscription['pushSubscription']) ?? undefined,
        trialPeriod: o.trialPeriod === true,
        trialEndsOn: o.trialEndsOn != null ? String(o.trialEndsOn) : undefined
      }
    })
    setSubscriptions(subs)
    return NextResponse.json({ success: true, count: subs.length })
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const subs = getSubscriptions()
  return NextResponse.json({ count: subs.length })
}
