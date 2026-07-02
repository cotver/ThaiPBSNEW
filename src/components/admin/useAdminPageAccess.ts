'use client'

import { useAuth } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type AdminPage =
  | 'dashboard'
  | 'season-sales'
  | 'programs-manager'
  | 'add-program-season-ep'
  | 'programs-manager-edit'
  | 'programs-detail-upload'
  | 'trends-upload'
  | 'large-video-upload'

export function useAdminPageAccess(page: AdminPage): boolean {
  const { user } = useAuth()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!user) {
      setAllowed(false)
      return
    }

    if ((user as { role?: string }).role === 'super-admin') {
      setAllowed(true)
      return
    }

    let cancelled = false

    setAllowed(false)

    fetch(`/admin/api/admin-page-access?page=${encodeURIComponent(page)}`, {
      credentials: 'include',
    })
      .then((response) => (response.ok ? response.json() : { allowed: false }))
      .then((data: { allowed?: boolean }) => {
        if (!cancelled) setAllowed(Boolean(data.allowed))
      })
      .catch(() => {
        if (!cancelled) setAllowed(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, user])

  return allowed
}
