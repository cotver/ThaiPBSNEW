'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Inside the admin's Live Preview panel: tell the admin this page is ready, then re-render the
// page with the latest saved content after every save.
export function LivePreviewRefresh() {
  const router = useRouter()

  useEffect(() => {
    if (window.parent === window) return

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'payload-document-event') router.refresh()
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'payload-live-preview', ready: true }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [router])

  return null
}
