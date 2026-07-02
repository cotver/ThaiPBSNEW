import type { AdminViewServerProps } from 'payload'
import type { Where } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { formatAdminURL, mergeListSearchAndWhere } from 'payload/shared'
import Link from 'next/link'
import React from 'react'
import {
  type FilterCondition,
  PER_PAGE_DEFAULT,
  PER_PAGE_MIN,
  PER_PAGE_MAX,
} from './programsManagerListConstants'
import { ProgramsManagerListToolbar } from './ProgramsManagerListToolbar'
import { ProgramsManagerListTable } from './ProgramsManagerListTable'
import { ProgramsManagerPerPageSelect } from './ProgramsManagerPerPageSelect'
import { buildProgramsListConfig } from '@/lib/programsListFromConfig'
import { canViewAdminPage } from '@/lib/payload-permissions'
import { getAdminPageAccessDenied } from './AdminPageAccess'

type ProgramDoc = Record<string, unknown> & {
  id: number | string
  coverImage?: { id: number | string; url?: string } | number | null
  image?: { id: number | string; url?: string } | number | null
  is_Award?: boolean | null
}

const DEFAULT_SORT = '-updatedAt'

export async function ProgramsManagerListView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const resolvedSearchParams = typeof searchParams?.then === 'function' ? await searchParams : (searchParams ?? {})

  if (!initPageResult?.req) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">Unable to load page context.</p>
      </div>
    )
  }

  const { req, visibleEntities } = initPageResult
  const { payload } = req
  const accessDenied = await getAdminPageAccessDenied(props, 'programs-manager')

  if (accessDenied) return accessDenied

  const config = payload.config
  const adminRoute = config.routes?.admin ?? '/admin'

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
          <p className="text-red-600 dark:text-red-400">You must be logged in to use this page.</p>
        </Gutter>
      </DefaultTemplate>
    )
  }

  const collectionConfig = config.collections?.find((c) => c.slug === 'programs')
  const listConfig = buildProgramsListConfig(collectionConfig as Parameters<typeof buildProgramsListConfig>[0])
  const {
    columns: listColumns,
    filterFields: listFilterFields,
    defaultVisibleColumnIds,
    allColumnIds,
  } = listConfig

  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search.trim() : ''
  const sortParam = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : DEFAULT_SORT
  const pageNum = Math.max(1, parseInt(String(resolvedSearchParams.page), 10) || 1)
  const limitParam = parseInt(String(resolvedSearchParams.limit), 10)
  const limit = Number.isNaN(limitParam)
    ? PER_PAGE_DEFAULT
    : Math.min(PER_PAGE_MAX, Math.max(PER_PAGE_MIN, limitParam))

  // Parse filter conditions from URL (where param as JSON array)
  let urlWhereConditions: FilterCondition[] = []
  try {
    const w = resolvedSearchParams.where
    const raw = typeof w === 'string' ? w : Array.isArray(w) ? w[0] : undefined
    if (raw) {
      const decoded = decodeURIComponent(raw)
      const arr = JSON.parse(decoded)
      urlWhereConditions = Array.isArray(arr) ? arr : []
    }
  } catch {
    urlWhereConditions = []
  }

  // Parse visible columns from URL (any column id from full list, from config)
  const columnsParam = resolvedSearchParams.columns
  const columnsStr = typeof columnsParam === 'string' ? columnsParam : Array.isArray(columnsParam) ? columnsParam[0] : ''
  const validIds = new Set(allColumnIds)
  const visibleColumns =
    columnsStr?.length > 0
      ? columnsStr.split(',').map((c) => c.trim()).filter((c) => validIds.has(c))
      : [...defaultVisibleColumnIds]
  const effectiveColumns = visibleColumns.length > 0 ? visibleColumns : [...defaultVisibleColumnIds]

  // Build Payload where from filter conditions
  function parseFilterValue(value: string, field: string): string | number | boolean | null {
    const v = value.trim()
    if (v === '') return null
    if (v === 'true') return true
    if (v === 'false') return false
    const num = Number(v)
    if (!Number.isNaN(num) && (field.includes('Year') || field.includes('duration') || field === 'version')) return num
    return v
  }

  const filterWhere: Where =
    urlWhereConditions.length === 0
      ? {}
      : {
          and: urlWhereConditions
            .filter((c) => c.value !== '' || c.operator === 'equals' || c.operator === 'not_equals')
            .map((c) => {
              const val = parseFilterValue(c.value, c.field)
              if (c.operator === 'like') {
                return { [c.field]: { like: typeof val === 'string' ? val : String(val ?? '') } as Record<string, unknown> }
              }
              if (c.operator === 'equals') {
                return { [c.field]: { equals: val ?? null } as Record<string, unknown> }
              }
              if (c.operator === 'not_equals') {
                return { [c.field]: { not_equals: val ?? null } as Record<string, unknown> }
              }
              if (c.operator === 'greater_than') {
                return { [c.field]: { greater_than: val ?? null } as Record<string, unknown> }
              }
              if (c.operator === 'less_than') {
                return { [c.field]: { less_than: val ?? null } as Record<string, unknown> }
              }
              return { [c.field]: { equals: val } as Record<string, unknown> }
            }),
        }
  if ((filterWhere as { and?: unknown[] }).and?.length === 0) {
    delete (filterWhere as { and?: unknown[] }).and
  }

  const baseWhere: Where = Object.keys(filterWhere).length > 0 ? filterWhere : {}
  const where = mergeListSearchAndWhere({
    collectionConfig: collectionConfig!,
    search: search || '',
    where: baseWhere,
  })

  const programsResult = await payload.find({
    collection: 'programs',
    where: Object.keys(where).length > 0 ? where : undefined,
    sort: sortParam,
    page: pageNum,
    limit,
    depth: 1,
    overrideAccess: false,
    req,
  })
  const programs = (programsResult.docs ?? []) as unknown as ProgramDoc[]
  const totalDocs = programsResult.totalDocs ?? 0
  const totalPages = programsResult.totalPages ?? 1
  const [canAddProgram, canEditProgram] = await Promise.all([
    canViewAdminPage(req, 'add-program-season-ep'),
    canViewAdminPage(req, 'programs-manager-edit'),
  ])

  const addHref = formatAdminURL({ adminRoute, path: '/add-program-season-ep' })
  const listBaseHref = formatAdminURL({ adminRoute, path: '/programs-manager' })

  // Build list URL with current params for pagination
  const defaultColumnsStr = defaultVisibleColumnIds.join(',')
  const effectiveColumnsStr = effectiveColumns.join(',')

  function listHrefWithPage(page: number, limitOverride?: number): string {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const whereEnc = urlWhereConditions.length
      ? encodeURIComponent(JSON.stringify(urlWhereConditions))
      : ''
    if (whereEnc) params.set('where', whereEnc)
    if (effectiveColumnsStr !== defaultColumnsStr) params.set('columns', effectiveColumnsStr)
    if (sortParam !== DEFAULT_SORT) params.set('sort', sortParam)
    const effectiveLimit = limitOverride ?? limit
    if (effectiveLimit !== PER_PAGE_DEFAULT) params.set('limit', String(effectiveLimit))
    if (page > 1) params.set('page', String(page))
    return `${listBaseHref}?${params.toString()}`
  }

  return (
    <DefaultTemplate {...templateProps}>
      <div className="w-full max-w-full min-w-0 bg-neutral-50/80 pb-16 dark:bg-neutral-950" data-view="programs-manager">
        <Gutter>
          <style>{`
            [data-view='programs-manager'] input:not([type='checkbox']):not([type='radio']),
            [data-view='programs-manager'] select {
              min-height: 2.75rem;
              border-radius: 0.75rem;
              border: 1px solid rgb(212 212 216);
              background: rgb(255 255 255);
              color: rgb(24 24 27);
              padding: 0 0.875rem;
              font-size: 0.875rem;
              box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
            }
            [data-view='programs-manager'] input:not([type='checkbox']):focus,
            [data-view='programs-manager'] select:focus {
              border-color: rgb(24 24 27);
              box-shadow: 0 0 0 3px rgb(24 24 27 / 0.12);
              outline: none;
            }
            [data-view='programs-manager'] input[type='checkbox'] {
              height: 1rem;
              width: 1rem;
              accent-color: rgb(24 24 27);
            }
            [data-view='programs-manager'] button,
            [data-view='programs-manager'] a {
              transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
            }
            @media (prefers-color-scheme: dark) {
              [data-view='programs-manager'] input:not([type='checkbox']):not([type='radio']),
              [data-view='programs-manager'] select {
                border-color: rgb(63 63 70);
                background: rgb(9 9 11);
                color: rgb(244 244 245);
              }
              [data-view='programs-manager'] input:not([type='checkbox']):focus,
              [data-view='programs-manager'] select:focus {
                border-color: rgb(212 212 216);
                box-shadow: 0 0 0 3px rgb(212 212 216 / 0.18);
              }
            }
          `}</style>
          <div className="mb-7 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/30">
            <div className="flex flex-col gap-5 px-5 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-8">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-950">
                  PM
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold uppercase text-green-700 dark:text-green-400">
                    CMS data table
                  </p>
                  <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50 sm:text-3xl">
                    Programs Manager
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                    Search, filter, sort, select, and update program records from one compact table.
                  </p>
                </div>
              </div>
              {canAddProgram && (
                <Link
                  href={addHref}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold !text-white shadow-sm hover:bg-neutral-800 dark:bg-neutral-100 dark:!text-neutral-950 dark:hover:bg-neutral-200"
                >
                  Add program
                </Link>
              )}
            </div>
          </div>

          <ProgramsManagerListToolbar
            initialSearch={search}
            initialSort={sortParam}
            initialWhere={urlWhereConditions}
            initialColumns={effectiveColumns}
            availableColumns={listColumns}
            availableFilterFields={listFilterFields}
            defaultVisibleColumnIds={defaultVisibleColumnIds}
            totalDocs={totalDocs}
            totalPages={totalPages}
            currentPage={pageNum}
            limit={limit}
          />

          <ProgramsManagerListTable
            programs={programs}
            effectiveColumns={effectiveColumns}
            listColumns={listColumns}
            adminRoute={adminRoute}
            listBaseHref={listBaseHref}
            initialSort={sortParam}
            canEditPrograms={canEditProgram}
          />

          <div className="mt-6 flex flex-wrap items-center justify-end gap-4 rounded-3xl border border-neutral-200 bg-white px-4 py-4 shadow-xl shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/20">
            <div className="flex items-center gap-4 flex-wrap">
              <ProgramsManagerPerPageSelect limit={limit} />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {totalDocs > 0
                  ? `${(pageNum - 1) * limit + 1}-${Math.min(pageNum * limit, totalDocs)} of ${totalDocs}`
                  : '0 programs'}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  {pageNum <= 1 ? (
                    <span className="rounded-xl border border-neutral-300 px-3 py-2 text-sm opacity-50 cursor-not-allowed dark:border-neutral-700">
                      Previous
                    </span>
                  ) : (
                    <Link
                      href={listHrefWithPage(pageNum - 1)}
                      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Page {pageNum} of {totalPages}
                  </span>
                  {pageNum >= totalPages ? (
                    <span className="rounded-xl border border-neutral-300 px-3 py-2 text-sm opacity-50 cursor-not-allowed dark:border-neutral-700">
                      Next
                    </span>
                  ) : (
                    <Link
                      href={listHrefWithPage(pageNum + 1)}
                      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </Gutter>
      </div>
    </DefaultTemplate>
  )
}
