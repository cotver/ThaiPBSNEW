import type { CollectionConfig, PayloadRequest } from 'payload'

/** What a page on this site asks for when it plays a file: a <video>, <audio>, <track> or a GIF <img>. */
const SITE_MEDIA_DESTINATIONS = new Set(['video', 'audio', 'track', 'image'])

/**
 * Whether a file request comes from this site's own pages playing it (a <video> or GIF on the page),
 * rather than someone opening /api/videos/file/... directly in a tab or downloading it.
 *
 * Browsers label every request with Fetch Metadata: Sec-Fetch-Dest says what will use the response
 * ("document" for a tab, "video" for a player, "empty" for fetch) and Sec-Fetch-Site whether a page on
 * this site asked. Browsers too old to send it (before Safari 16.4) fall back to the Referer, which a
 * player on our page sends and a URL typed into the address bar does not.
 *
 * This keeps casual direct access out; it is not DRM — anyone can still capture what plays on screen.
 */
function isSitePlayback(req: PayloadRequest) {
  const destination = req.headers.get('sec-fetch-dest')
  if (destination) {
    const site = req.headers.get('sec-fetch-site')
    return SITE_MEDIA_DESTINATIONS.has(destination) && (site === 'same-origin' || site === 'same-site')
  }
  const referer = req.headers.get('referer')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (!referer || !host) return false
  try {
    return new URL(referer).host === host
  } catch {
    return false
  }
}

export const Videos: CollectionConfig = {
      slug: 'videos',
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'alt', 'filename', 'updatedAt'],
      },
      access: {
        read: () => true,
      },
      upload: {
        staticDir: process.env.PAYLOAD_VIDEOS_DIR || '../payload-uploads/videos',
        mimeTypes: ['video/*', 'image/gif'],
        // The file itself (/api/videos/file/...) opens only for signed-in Payload users, or when a page on
        // this site plays it. The video records stay public, so pages can still list and link them.
        handlers: [
          (req) => {
            if (req.user || isSitePlayback(req)) return
            return new Response('Sign in to Payload to open this video directly.', {
              status: 403,
              headers: { 'Cache-Control': 'private, no-store', 'Content-Type': 'text/plain; charset=utf-8' },
            })
          },
        ],
        // Never let a copy the player fetched be reused for a direct visit: the browser must ask again
        // (and pass the check) every time, and no shared cache may keep it.
        modifyResponseHeaders: ({ headers }) => {
          headers.set('Cache-Control', 'private, no-cache')
          headers.set('Vary', 'Sec-Fetch-Dest, Sec-Fetch-Site, Cookie')
          return headers
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: { description: 'Title for the video' },
        },
        {
          name: 'alt',
          type: 'text',
          admin: { description: 'Alt text / description for the video (accessibility)' },
        },
      ],
    }
