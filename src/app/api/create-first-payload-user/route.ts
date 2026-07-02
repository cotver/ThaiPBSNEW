import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload-client'

export const runtime = 'nodejs'

/**
 * One-time helper: create the first Payload admin user only when no users exist.
 * GET /api/create-first-payload-user?email=admin@example.com&password=yourpassword
 * Remove or restrict this route in production.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const password = searchParams.get('password')

  if (!email || !password) {
    return NextResponse.json(
      {
        error: 'Missing email or password',
        usage: 'GET /api/create-first-payload-user?email=admin@example.com&password=yourpassword',
      },
      { status: 400 }
    )
  }

  try {
    const payload = await getPayloadClient()
    const existing = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({
        message: 'At least one user already exists. Use /admin to sign in.',
      })
    }

    await payload.create({
      collection: 'users',
      data: { email, password, role: 'super-admin' },
    })

    return NextResponse.json({
      success: true,
      message: 'First user created. Go to /admin and log in with the email and password you used.',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let email: string
  let password: string
  try {
    const body = await request.json()
    email = body?.email
    password = body?.password
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body. Send { "email": "...", "password": "..." }' },
      { status: 400 }
    )
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Missing email or password in body' },
      { status: 400 }
    )
  }

  try {
    const payload = await getPayloadClient()
    const existing = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({
        message: 'At least one user already exists. Use /admin to sign in.',
      })
    }

    await payload.create({
      collection: 'users',
      data: { email, password, role: 'super-admin' },
    })

    return NextResponse.json({
      success: true,
      message: 'First user created. Go to /admin and log in.',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
