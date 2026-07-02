export function isPayloadMediaSrc(src: string | null | undefined): boolean {
  if (!src) return false

  if (src.startsWith('/api/media/file/') || src.startsWith('/api/media/')) {
    return true
  }

  if (!src.startsWith('http')) {
    return false
  }

  try {
    const url = new URL(src)
    return url.pathname.startsWith('/api/media/file/') || url.pathname.startsWith('/api/media/')
  } catch {
    return false
  }
}
