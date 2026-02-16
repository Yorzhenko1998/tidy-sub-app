import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// POST /api/subscriptions
// Saves / updates a subscription record in Vercel KV.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body as { id?: string; [key: string]: any }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Missing subscription id' },
        { status: 400 }
      )
    }

    // Store entire subscription object under the given id
    await kv.hset('subscriptions', { [id]: { id, ...data } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('KV save error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

// GET /api/subscriptions
// Returns all subscriptions stored in Vercel KV.
export async function GET() {
  try {
    const all = (await kv.hgetall<Record<string, any>>('subscriptions')) || {}
    const items = Object.values(all)
    return NextResponse.json({ subscriptions: items })
  } catch (err) {
    console.error('KV fetch error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

