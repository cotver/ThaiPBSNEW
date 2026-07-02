import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'
import { formatAdminURL } from 'payload/shared'
import { getProgramFieldLabels } from '../../lib/programsListFromConfig'
import { getAdminPageAccessDenied } from './AdminPageAccess'
import { ProgramsManagerAddForm, type AwardOption } from './ProgramsManagerAddForm'

export async function ProgramsManagerAddView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props

  if (!initPageResult?.req) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">
          Unable to load page context. Ensure you are logged in and try again.
        </p>
      </div>
    )
  }

  const { req, visibleEntities } = initPageResult
  const { payload } = req
  const accessDenied = await getAdminPageAccessDenied(props, 'add-program-season-ep')

  if (accessDenied) return accessDenied

  // DefaultTemplate expects payload, req, visibleEntities, etc. (it reads payload.config)
  const templateProps = {
    i18n: req.i18n,
    locale: initPageResult.locale,
    params,
    payload,
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

  if (!req.user) {
    return (
      <DefaultTemplate {...templateProps}>
        <Gutter>
          <p className="text-red-600 dark:text-red-400">
            You must be logged in to use this page.
          </p>
        </Gutter>
      </DefaultTemplate>
    )
  }

  const programsCollection = payload.config.collections?.find((c) => c.slug === 'programs')
  const programFieldLabels = getProgramFieldLabels(programsCollection as Parameters<typeof getProgramFieldLabels>[0])
  const adminRoute = payload.config.routes?.admin ?? '/admin'
  const listHref = formatAdminURL({ adminRoute, path: '/programs-manager' })
  const awardsResult = await payload.find({
    collection: 'awards' as any,
    limit: 500,
    depth: 0,
    sort: 'name',
    overrideAccess: false,
    req,
  }).catch(() => ({ docs: [] }))
  const awardOptions: AwardOption[] = ((awardsResult.docs ?? []) as Array<{ id?: unknown; name?: unknown }>)
    .map((award) => ({
      id: Number(award.id),
      name: String(award.name ?? '').trim(),
    }))
    .filter((award) => Number.isFinite(award.id) && award.id > 0 && award.name)

  return (
    <DefaultTemplate {...templateProps}>
      <div className="w-full max-w-full min-w-0 bg-neutral-50/80 pb-16 dark:bg-neutral-950" data-view="programs-manager-add">
        <Gutter>
          <div className="mb-7 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/30">
            <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <Link
                href={listHref}
                className="inline-flex h-9 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-white hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
              >
                Back to Programs Manager
              </Link>
            </div>
            <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:px-8 lg:py-8">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-950">
                  PM
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold uppercase text-green-700 dark:text-green-400">
                    CMS data entry
                  </p>
                  <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50 sm:text-3xl">
                    Add Program, Season & Episodes
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                    Create the core program record, organize seasons, and prepare episode metadata in one focused workflow.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 p-1 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <div className="rounded-xl bg-white px-3 py-3 shadow-sm dark:bg-neutral-800">
                  <div className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">1</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Program</div>
                </div>
                <div className="px-3 py-3">
                  <div className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">+</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Seasons</div>
                </div>
                <div className="px-3 py-3">
                  <div className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">+</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Episodes</div>
                </div>
              </div>
            </div>
          </div>
          <ProgramsManagerAddForm programFieldLabels={programFieldLabels} awardOptions={awardOptions} />
        </Gutter>
      </div>
    </DefaultTemplate>
  )
}
