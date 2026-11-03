import type { PayloadRequest } from 'payload'

type PathArgs = { data: Record<string, any>; req: PayloadRequest }
type PathResolver = (args: PathArgs) => null | string | undefined | Promise<null | string | undefined>

export const livePreviewBreakpoints = [
  { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
  { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
  { label: 'Laptop', name: 'laptop', width: 1366, height: 768 },
  { label: 'Desktop', name: 'desktop', width: 1920, height: 1080 },
]

// Live Preview needs an absolute URL on the same origin as the admin. Derive it from the
// request instead of a fixed server URL so it works on localhost and LAN/server IPs.
const getRequestOrigin = (req: { headers: Headers }) => {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const protocol = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http'
  return `${protocol}://${host}`
}

// Admin "Preview" button + side-by-side "Live Preview" for a collection, from one path resolver.
export const previewAdminConfig = (getPath: PathResolver) => ({
  preview: async (doc: Record<string, any>, { req }: { req: PayloadRequest }) => (await getPath({ data: doc, req })) || null,
  livePreview: {
    url: async ({ data, req }: PathArgs) => {
      const path = await getPath({ data, req })
      return path ? `${getRequestOrigin(req)}${path}` : null
    },
  },
})

export const slugPath = (base: string) => ({ data }: PathArgs) =>
  data?.slug ? `${base}/${encodeURIComponent(String(data.slug))}` : null

const getID = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number | string }).id
  return undefined
}

export const marketEventPath = async ({ data, req }: PathArgs) => {
  if (!data?.slug) return null
  let group = data.marketEventGroup
  if (!group?.slug) {
    const id = getID(group)
    if (!id) return null
    try {
      group = await req.payload.findByID({ collection: 'market-event-groups', id, depth: 0, req })
    } catch {
      return null
    }
  }
  return group?.slug
    ? `/studios/events/${encodeURIComponent(String(group.slug))}/${encodeURIComponent(String(data.slug))}`
    : null
}
