import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload-client'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await getPayloadClient()
    const auth = await payload.auth({ headers: request.headers })

    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please upload an image file.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const doc = await payload.create({
      collection: 'media',
      data: {},
      file: {
        name: file.name,
        data: buffer,
        mimetype: file.type,
        size: file.size,
      },
      overrideAccess: true,
      user: auth.user,
    })

    return NextResponse.json({ doc }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
