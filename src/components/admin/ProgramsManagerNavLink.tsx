'use client'

import React from 'react'
import { Link, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import { useAdminPageAccess } from './useAdminPageAccess'

const baseClass = 'nav'

/**
 * Renders a "Programs Manager" link in the admin sidebar (afterNavLinks).
 * Clicking it navigates to the Programs Manager custom view.
 */
export function ProgramsManagerNavLink() {
  const allowed = useAdminPageAccess('programs-manager')
  const { config } = useConfig()
  const pathname = usePathname()
  const adminRoute = config?.routes?.admin ?? '/admin'
  const href = formatAdminURL({ adminRoute, path: '/programs-manager' })
  const isActive = pathname === href || (pathname.startsWith(href) && (pathname[href.length] === '/' || pathname[href.length] === undefined))

  if (!allowed) return null

  return (
    <Link
      className={`${baseClass}__link`}
      href={href}
      id="nav-programs-manager"
      prefetch={false}
    >
      <>
        {isActive && <div className={`${baseClass}__link-indicator`} />}
        <span className={`${baseClass}__link-label`}>Programs Manager</span>
      </>
    </Link>
  )
}
