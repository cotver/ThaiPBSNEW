import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from 'payload'

export const syncProgramTypeFlags: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const isSpecial = Boolean(data?.is_special_programs ?? originalDoc?.is_special_programs)
  const isOld = Boolean(data?.is_old_series ?? originalDoc?.is_old_series)
  const isGlobal = Boolean(data?.is_global_programs ?? originalDoc?.is_global_programs)

  return {
    ...data,
    is_normal_programs: !isSpecial && !isOld && !isGlobal,
    ...(isGlobal
      ? {}
      : {
          is_global_international: false,
          is_global_thai_dub: false,
        }),
  }
}

export const validateNonNegativePrice = (value: unknown) =>
  value == null || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
    ? true
    : 'Price must be a non-negative number'

const relationToId = (value: unknown): string | number | null => {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

export const enforceReadyForSaleOnlyForIpPrograms: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const readyForSale = Boolean(data?.sellPricing?.readyForSale)
  if (!readyForSale) return data

  const programId = relationToId(data?.program) ?? relationToId(originalDoc?.program)
  if (!programId) {
    return {
      ...data,
      sellPricing: {
        ...(data?.sellPricing ?? {}),
        readyForSale: false,
      },
    }
  }

  const program = await req.payload.findByID({
    collection: 'programs',
    id: programId,
    depth: 0,
    overrideAccess: true,
    req,
  })

  if ((program as { is_IP?: boolean } | null)?.is_IP) return data

  return {
    ...data,
    sellPricing: {
      ...(data?.sellPricing ?? {}),
      readyForSale: false,
    },
  }
}

const stableStringify = (value: unknown) => {
  if (value == null) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const sanitizeLexicalUploadValues = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeLexicalUploadValues)
  if (!value || typeof value !== 'object') return value

  const record = value as Record<string, unknown>
  const next: Record<string, unknown> = {}
  for (const [key, childValue] of Object.entries(record)) {
    const nextChildValue = sanitizeLexicalUploadValues(childValue)
    if (
      key === 'image' &&
      nextChildValue &&
      typeof nextChildValue === 'object' &&
      'id' in nextChildValue
    ) {
      const id = (nextChildValue as { id?: unknown }).id
      next[key] = typeof id === 'string' || typeof id === 'number' ? id : nextChildValue
    } else {
      next[key] = nextChildValue
    }
  }

  if (
    next.type === 'upload' &&
    next.value &&
    typeof next.value === 'object' &&
    'id' in next.value
  ) {
    const id = (next.value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') next.value = id
  }

  return next
}

export const normalizeSeasonAwardDetails: CollectionBeforeValidateHook = ({ data }) => {
  const awards = Array.isArray(data?.awards) ? data.awards : null
  if (!awards) return data

  return {
    ...data,
    awards: awards.map((award: unknown) =>
      award && typeof award === 'object'
        ? {
            ...(award as Record<string, unknown>),
            awardDetail: sanitizeLexicalUploadValues((award as Record<string, unknown>).awardDetail),
          }
        : award
    ),
  }
}

const awardRowKey = (award: unknown, index: number) => {
  if (award && typeof award === 'object' && 'id' in award) {
    const id = (award as { id?: unknown }).id
    if (id != null) return String(id)
  }
  return `index:${index}`
}

const seasonAwardChanged = (nextAward: Record<string, unknown>, previousAward?: Record<string, unknown>) => {
  if (!previousAward) return true
  return (
    relationToId(nextAward.awardName) !== relationToId(previousAward.awardName) ||
    nextAward.awardYear !== previousAward.awardYear ||
    stableStringify(nextAward.awardDetail) !== stableStringify(previousAward.awardDetail)
  )
}

export const stampSeasonAwardUpdatedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const awards = Array.isArray(data?.awards) ? data.awards : null
  if (!awards) return data

  const previousAwards = new Map<string, Record<string, unknown>>()
  if (Array.isArray(originalDoc?.awards)) {
    originalDoc.awards.forEach((award: unknown, index: number) => {
      if (award && typeof award === 'object') {
        previousAwards.set(awardRowKey(award, index), award as Record<string, unknown>)
      }
    })
  }

  return {
    ...data,
    awards: awards.map((award: unknown, index: number) => {
      if (!award || typeof award !== 'object') return award
      const nextAward = {
        ...(award as Record<string, unknown>),
        awardDetail: sanitizeLexicalUploadValues((award as Record<string, unknown>).awardDetail),
      }
      const previousAward = previousAwards.get(awardRowKey(nextAward, index))
      return seasonAwardChanged(nextAward, previousAward)
        ? { ...nextAward, awardUpdatedAt: new Date().toISOString() }
        : nextAward
    }),
  }
}

const syncProgramAwardFlag = async ({
  programId,
  req,
}: {
  programId: string | number | null
  req: Parameters<CollectionAfterChangeHook>[0]['req']
}) => {
  if (!programId) return

  const awardSeasons = await req.payload.find({
    collection: 'seasons',
    where: {
      and: [{ program: { equals: programId } }, { is_Award: { equals: true } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })

  await req.payload.update({
    collection: 'programs',
    id: programId,
    data: { is_Award: (awardSeasons.totalDocs ?? awardSeasons.docs.length) > 0 } as any,
    depth: 0,
    overrideAccess: true,
    req,
  })
}

export const syncProgramAwardFlagAfterSeasonChange: CollectionAfterChangeHook = async (args) => {
  const { doc, previousDoc, req } = args as Parameters<CollectionAfterChangeHook>[0] & {
    previousDoc?: Record<string, unknown>
  }
  const nextProgramId = relationToId((doc as { program?: unknown }).program)
  const previousProgramId = relationToId(previousDoc?.program)

  await syncProgramAwardFlag({ programId: nextProgramId, req })
  if (previousProgramId != null && previousProgramId !== nextProgramId) {
    await syncProgramAwardFlag({ programId: previousProgramId, req })
  }
}

export const syncProgramAwardFlagAfterSeasonDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await syncProgramAwardFlag({ programId: relationToId((doc as { program?: unknown }).program), req })
}
