import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { headers as getNextHeaders } from 'next/headers'
import React from 'react'
import type { AdminViewServerProps, PayloadRequest, TypedUser } from 'payload'
import { getPayloadClient } from '@/lib/payload-client'
import { canViewAdminPage, type AdminPage } from '@/lib/payload-permissions'

function buildTemplateProps(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const req = initPageResult?.req

  if (!req) return null

  const { visibleEntities } = initPageResult

  return {
    i18n: req.i18n,
    locale: initPageResult.locale,
    params,
    payload: req.payload,
    permissions: initPageResult.permissions,
    req,
    searchParams,
    user: req.user ?? undefined,
    viewType: 'dashboard' as const,
    visibleEntities: {
      collections: visibleEntities?.collections ?? [],
      globals: visibleEntities?.globals ?? [],
    },
  }
}

async function getAuthenticatedUser(req: PayloadRequest): Promise<TypedUser | null> {
  if (req.user) return req.user

  try {
    const payload = await getPayloadClient()
    const authResult = await payload.auth({ headers: await getNextHeaders() })
    return authResult.user ?? null
  } catch {
    return null
  }
}

function AdminPageMessage({ message, title }: { message: string; title: string }) {
  return (
    <Gutter>
      <div className="py-8">
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </Gutter>
  )
}

export async function getAdminPageAccessDenied(
  props: AdminViewServerProps,
  page: AdminPage,
): Promise<React.ReactElement | null> {
  const templateProps = buildTemplateProps(props)

  if (!templateProps) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">
          Unable to load page context. Ensure you are logged in and try again.
        </p>
      </div>
    )
  }

  const user = await getAuthenticatedUser(templateProps.req)
  if (user) {
    templateProps.req.user = user
    templateProps.user = user
  }

  if (!user) {
    return (
      <DefaultTemplate {...templateProps}>
        <AdminPageMessage
          title="Login required"
          message="You must be logged in to use this page."
        />
      </DefaultTemplate>
    )
  }

  const allowed = await canViewAdminPage(templateProps.req, page)

  if (allowed) return null

  return (
    <DefaultTemplate {...templateProps}>
      <AdminPageMessage
        title="Not accessible"
        message="You do not have permission to view this page."
      />
    </DefaultTemplate>
  )
}
