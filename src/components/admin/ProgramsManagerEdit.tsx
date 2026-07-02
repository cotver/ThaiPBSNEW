import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { getProgramFieldLabels } from '../../lib/programsListFromConfig'
import { getAdminPageAccessDenied } from './AdminPageAccess'
import { ProgramsManagerEditForm } from './ProgramsManagerEditForm'
import type { AwardOption } from './ProgramsManagerAddForm'
import { formatAdminURL } from 'payload/shared'

function relToIds(val: unknown): number[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val
      .map((v) => {
        if (v == null) return null
        if (typeof v === 'number') return v
        if (typeof v === 'string') return Number(v)
        if (typeof v === 'object' && v !== null && 'id' in v) return Number((v as { id: unknown }).id)
        return null
      })
      .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n))
  }
  return []
}

async function fetchByIDsInOrder<T extends { id?: unknown }>(args: {
  // Keep typing loose: Payload's `find` is heavily generic and varies by collection slug.
  payload: any
  collection: string
  ids: number[]
  depth: number
  req: any
  overrideAccess: boolean
}): Promise<T[]> {
  const { payload, collection, ids, depth, req, overrideAccess } = args
  if (!ids.length) return []

  const res = await payload.find({
    collection,
    where: { id: { in: ids } },
    limit: ids.length,
    depth,
    overrideAccess,
    req,
  })
  const docs = (res.docs ?? []) as T[]
  const byId = new Map<number, T>()
  for (const d of docs) {
    const id = d?.id != null ? Number(d.id) : NaN
    if (!Number.isNaN(id)) byId.set(id, d)
  }
  return ids.map((id) => byId.get(id)).filter((d): d is T => Boolean(d))
}

export async function ProgramsManagerEditView(props: AdminViewServerProps) {
  const { initPageResult, params: paramsPromise, searchParams } = props

  if (!initPageResult?.req) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">Unable to load page context.</p>
      </div>
    )
  }

  const { req, visibleEntities } = initPageResult
  const { payload } = req
  const accessDenied = await getAdminPageAccessDenied(props, 'programs-manager-edit')

  if (accessDenied) return accessDenied

  const params = await paramsPromise
  const segments = Array.isArray(params?.segments) ? params.segments : []
  const id = segments[1]
  if (!id) {
    notFound()
  }

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

  const programIdNum = Number(id)
  if (Number.isNaN(programIdNum)) {
    notFound()
  }

  const program = await payload.findByID({
    collection: 'programs',
    id: programIdNum,
    depth: 1,
    overrideAccess: false,
    req,
  }).catch(() => null)

  if (!program) {
    notFound()
  }

  // Prefer relationship order stored in `programs.seasons` (join table has an order column).
  const programSeasonIDs = relToIds((program as unknown as { seasons?: unknown }).seasons)
  const seasons = programSeasonIDs.length
    ? await fetchByIDsInOrder<Record<string, unknown> & { id?: unknown; episodes?: unknown }>({
        payload,
        collection: 'seasons',
        ids: programSeasonIDs,
        depth: 1,
        overrideAccess: false,
        req,
      })
    : (
        (
          await payload.find({
            collection: 'seasons',
            where: { program: { equals: program.id } },
            depth: 1,
            sort: 'season',
            overrideAccess: false,
            req,
          })
        ).docs ?? []
      )

  const seasonsWithEpisodes = await Promise.all(
    seasons.map(async (season) => {
      // Prefer relationship order stored in `seasons.episodes`.
      const episodeIDs = relToIds((season as unknown as { episodes?: unknown }).episodes)
      const episodesResult = episodeIDs.length
        ? { docs: await fetchByIDsInOrder<Record<string, unknown> & { id?: unknown }>({
            payload,
            collection: 'episodes',
            ids: episodeIDs,
            depth: 0,
            overrideAccess: false,
            req,
          }) }
        : await payload.find({
            collection: 'episodes',
            where: { season: { equals: (season as unknown as { id?: unknown }).id } },
            depth: 0,
            sort: 'ep',
            overrideAccess: false,
            req,
          })
      return {
        ...season,
        episodes: episodesResult.docs ?? [],
      }
    })
  )
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

  const listHref = formatAdminURL({ adminRoute, path: '/programs-manager' })

  return (
    <DefaultTemplate {...templateProps}>
      <div className="w-full max-w-full min-w-0" data-view="programs-manager-edit">
        <Gutter>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={listHref}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
              >
                ← Programs Manager
              </Link>
              <h1 className="text-2xl font-bold">
                Edit: {(program as { titleTh?: string; titleEn?: string }).titleTh ||
                  (program as { titleTh?: string; titleEn?: string }).titleEn ||
                  (program as { programId?: string }).programId ||
                  `Program ${program.id}`}
              </h1>
            </div>
          </div>
          <ProgramsManagerEditForm
            programId={program.id as number}
            initialData={{
              program: program as unknown as Record<string, unknown>,
              seasons: seasonsWithEpisodes as Record<string, unknown>[],
            }}
            programFieldLabels={getProgramFieldLabels(config.collections?.find((c) => c.slug === 'programs') as Parameters<typeof getProgramFieldLabels>[0])}
            awardOptions={awardOptions}
          />
        </Gutter>
      </div>
    </DefaultTemplate>
  )
}
