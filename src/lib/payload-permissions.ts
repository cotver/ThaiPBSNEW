import type {
  Access,
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
  FieldAccess,
  Where,
} from 'payload'
import { Forbidden } from 'payload'

export const managedCollections = [
  'users',
  'roleProfiles',
  'userGroups',
  'media',
  'videos',
  'landing',
  'trends',
  'content',
  'header',
  'footer',
  'languages',
  'awards',
  'programs',
  'vipaPrograms',
  'seasons',
  'episodes',
] as const
export type ManagedCollection = (typeof managedCollections)[number]

export const adminPages = [
  'dashboard',
  'season-sales',
  'programs-manager',
  'add-program-season-ep',
  'programs-manager-edit',
  'programs-detail-upload',
  'trends-upload',
  'large-video-upload',
] as const
export type AdminPage = (typeof adminPages)[number]

type Operation = 'read' | 'create' | 'update' | 'delete'
type WriteOperation = 'create' | 'update'
type RelationValue = number | string | { id?: number | string | null } | null | undefined

type CollectionPermission = {
  collection?: ManagedCollection | null
  operations?: Operation[] | null
}

type FieldPermission = {
  collection?: ManagedCollection | null
  allFields?: boolean | null
  fields?: string[] | null
  [key: `fields_${string}`]: string[] | null | undefined
}

type PermissionSource = {
  id?: number | string
  users?: RelationValue[] | null
  ownedPrograms?: RelationValue[] | null
  ownedVipaPrograms?: RelationValue[] | null
  allowedAdminPages?: AdminPage[] | null
  collectionPermissions?: CollectionPermission[] | null
  fieldPermissions?: FieldPermission[] | null
}

type PermissionUser = PermissionSource & {
  id?: number | string
  role?: 'super-admin' | 'user' | null
  roles?: RelationValue[] | null
  groups?: RelationValue[] | null
}

type PermissionContext = {
  user: PermissionUser | null
  roles: PermissionSource[]
  groups: PermissionSource[]
}

type PermissionRequest = Parameters<Access>[0]['req'] & {
  context?: Record<string, unknown>
}

const permissionContextCacheKey = '__thaipbsPermissionContext'
const relationshipSyncContextKey = '__thaipbsRelationshipSync'

export const collectionFields: Record<ManagedCollection, string[]> = {
  users: [
    'email',
    'role',
    'roles',
    'groups',
    'ownedPrograms',
    'ownedVipaPrograms',
    'allowedAdminPages',
    'collectionPermissions',
    'fieldPermissions',
  ],
  roleProfiles: ['name', 'users', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions'],
  userGroups: [
    'name',
    'users',
    'ownedPrograms',
    'ownedVipaPrograms',
    'allowedAdminPages',
    'collectionPermissions',
    'fieldPermissions',
  ],
  media: ['title', 'alt'],
  videos: ['title', 'alt'],
  landing: ['title', 'heroImage'],
  trends: ['type', 'title', 'link', 'image', 'boxHeight'],
  content: ['slug', 'titleTh', 'titleEn', 'topicSections', 'contentTh', 'contentEn'],
  header: ['titleTh', 'titleEn', 'items'],
  footer: ['titleTh', 'titleEn', 'items'],
  languages: ['code', 'label'],
  awards: ['name'],
  programs: [
    'programId',
    'slug',
    'titleTh',
    'titleEn',
    'programContentType',
    'comingSoon',
    'comingSoonDate',
    'synopsisTh',
    'synopsisEn',
    'companyProduce',
    'producer',
    'artist',
    'writer',
    'targetGroup',
    'programType',
    'genre',
    'subGenre',
    'tags',
    'comment',
    'image',
    'coverImage',
    'trailer',
    'video',
    'TrailerAirflowProxyPath',
    'TrailerThumbnailAirflowProxyPath',
    'videoAirflowProxyPath',
    'videoThumbnailAirflowProxyPath',
    'videoLink',
    'trailerLink',
    'is_IP',
    'is_Feature',
    'is_NEW',
    'is_Schedule',
    'isNewHits',
    'is_Award',
    'is_special_programs',
    'is_old_series',
    'is_continue',
    'is_global_programs',
    'is_global_international',
    'is_global_thai_dub',
    'is_normal_programs',
    'is_Detail',
    'hasSoundtrack',
    'hasAd',
    'hasCc',
    'hasSl',
    'hasBigSign',
    'isUncut',
    'firstRun',
    'rerunDates',
    'space',
    'format',
    'duration',
    'onThaipbs',
    'onAltv',
    'onVipa',
    'onFacebook',
    'onX',
    'onYoutube',
    'onTiktok',
    'views',
    'productionCountry',
    'productionYear',
    'rightsTerritoriesAvailable',
    'audioChannel1',
    'audioChannel2',
    'closeCaption1',
    'closeCaption2',
    'closeCaption3',
    'subtitle1',
    'file_type',
    'version',
    'file_ext',
    'is_infosheet_write',
    'asset_create',
    'asset_update',
    'seasons',
  ],
  vipaPrograms: [
    'titleTh',
    'titleEn',
    'isNEW',
    'isSchedule',
    'isNewHits',
    'is_special_programs',
    'is_old_series',
    'isFeature',
    'is_IP',
    'isThaiProgram',
    'isInterProgram',
    'image',
    'coverImage',
    'vipaLink',
    'genre',
    'tags',
    'firstRun',
    'rerunDates',
    'duration',
    'hasSoundtrack',
    'hasAd',
    'hasCc',
    'hasSl',
    'hasBigSign',
    'isUncut',
    'epCount',
    'views',
  ],
  seasons: [
    'program',
    'season',
    'seasonName',
    'seasonNameEn',
    'is_Award',
    'awards',
    'hasCc',
    'languages',
    'hasSoundtrack',
    'languagesSoundtrack',
    'comingSoon',
    'comingSoonDate',
    'synopsisTh',
    'synopsisEn',
    'coverImage',
    'trailer',
    'video',
    'TrailerAirflowProxyPath',
    'TrailerThumbnailAirflowProxyPath',
    'videoAirflowProxyPath',
    'videoThumbnailAirflowProxyPath',
    'videoLink',
    'trailerLink',
    'sellPricing',
    'episodes',
  ],
  episodes: [
    'season',
    'ep',
    'epNameTh',
    'epNameEn',
    'comingSoon',
    'comingSoonDate',
    'firstRun',
    'rerunDates',
    'synopsisEpTh',
    'synopsisEpEn',
    'coverImage',
    'trailer',
    'video',
    'TrailerAirflowProxyPath',
    'TrailerThumbnailAirflowProxyPath',
    'videoAirflowProxyPath',
    'videoThumbnailAirflowProxyPath',
    'videoLink',
    'trailerLink',
  ],
}

const collectionOptions = managedCollections.map((collection) => ({ label: collection, value: collection }))
const adminPageOptions = adminPages.map((page) => ({ label: page, value: page }))
const operationOptions: Array<{ label: string; value: Operation }> = [
  { label: 'Read', value: 'read' },
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
]

const idFromRelation = (value: RelationValue): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object') return value.id ?? null
  return null
}

function relationIds(values: RelationValue[] | null | undefined): Array<number | string> {
  return [
    ...new Set(
      (values ?? [])
        .map(idFromRelation)
        .filter((id): id is number | string => id != null),
    ),
  ]
}

function hasSameIds(left: Array<number | string>, right: Array<number | string>): boolean {
  return left.length === right.length && left.every((id) => right.some((other) => String(other) === String(id)))
}

function setRelationshipSyncFlag(req: PermissionRequest, enabled: boolean) {
  req.context ??= {}
  if (enabled) req.context[relationshipSyncContextKey] = true
  else delete req.context[relationshipSyncContextKey]
}

function isRelationshipSyncing(req: PermissionRequest): boolean {
  return Boolean(req.context?.[relationshipSyncContextKey])
}

async function updateRelatedDocumentIds(args: {
  req: PermissionRequest
  collection: 'users' | 'roleProfiles' | 'userGroups'
  id: number | string
  field: 'roles' | 'groups' | 'users'
  nextIds: Array<number | string>
}) {
  const { req, collection, id, field, nextIds } = args
  await req.payload.update({
    collection,
    id,
    data: { [field]: nextIds },
    depth: 0,
    overrideAccess: true,
    req,
  })
}

async function syncInverseMembership(args: {
  req: PermissionRequest
  sourceId: number | string
  previousRelatedIds: Array<number | string>
  nextRelatedIds: Array<number | string>
  relatedCollection: 'users' | 'roleProfiles' | 'userGroups'
  inverseField: 'roles' | 'groups' | 'users'
}) {
  const { req, sourceId, previousRelatedIds, nextRelatedIds, relatedCollection, inverseField } = args
  const touchedIds = [...new Set([...previousRelatedIds, ...nextRelatedIds])]

  for (const relatedId of touchedIds) {
    const relatedDoc = (await req.payload.findByID({
      collection: relatedCollection,
      id: relatedId,
      depth: 0,
      overrideAccess: true,
      req,
    }).catch(() => null)) as Record<string, unknown> | null
    if (!relatedDoc) continue

    const currentIds = relationIds(relatedDoc[inverseField] as RelationValue[] | null | undefined)
    const shouldContain = nextRelatedIds.some((id) => String(id) === String(relatedId))
    const nextIds = shouldContain
      ? [...new Set([...currentIds, sourceId])]
      : currentIds.filter((id) => String(id) !== String(sourceId))

    if (!hasSameIds(currentIds, nextIds)) {
      await updateRelatedDocumentIds({
        req,
        collection: relatedCollection,
        id: relatedId,
        field: inverseField,
        nextIds,
      })
    }
  }
}

export const syncUserRoleAndGroupMemberships: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const permissionReq = req as PermissionRequest
  if (isRelationshipSyncing(permissionReq)) return doc

  const userId = idFromRelation((doc as PermissionUser).id)
  if (userId == null) return doc

  const previousRoleIds = relationIds((previousDoc as PermissionUser | undefined)?.roles)
  const nextRoleIds = relationIds((doc as PermissionUser).roles)
  const previousGroupIds = relationIds((previousDoc as PermissionUser | undefined)?.groups)
  const nextGroupIds = relationIds((doc as PermissionUser).groups)

  try {
    setRelationshipSyncFlag(permissionReq, true)
    await syncInverseMembership({
      req: permissionReq,
      sourceId: userId,
      previousRelatedIds: previousRoleIds,
      nextRelatedIds: nextRoleIds,
      relatedCollection: 'roleProfiles',
      inverseField: 'users',
    })
    await syncInverseMembership({
      req: permissionReq,
      sourceId: userId,
      previousRelatedIds: previousGroupIds,
      nextRelatedIds: nextGroupIds,
      relatedCollection: 'userGroups',
      inverseField: 'users',
    })
  } finally {
    setRelationshipSyncFlag(permissionReq, false)
  }

  return doc
}

function createSyncUsersMembershipHook(args: {
  userField: 'roles' | 'groups'
}): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req }) => {
    const permissionReq = req as PermissionRequest
    if (isRelationshipSyncing(permissionReq)) return doc

    const sourceId = idFromRelation((doc as PermissionSource).id)
    if (sourceId == null) return doc

    const previousUserIds = relationIds((previousDoc as PermissionSource | undefined)?.users)
    const nextUserIds = relationIds((doc as PermissionSource).users)

    try {
      setRelationshipSyncFlag(permissionReq, true)
      await syncInverseMembership({
        req: permissionReq,
        sourceId,
        previousRelatedIds: previousUserIds,
        nextRelatedIds: nextUserIds,
        relatedCollection: 'users',
        inverseField: args.userField,
      })
    } finally {
      setRelationshipSyncFlag(permissionReq, false)
    }

    return doc
  }
}

export const syncRoleProfileUsers = createSyncUsersMembershipHook({
  userField: 'roles',
})

export const syncUserGroupUsers = createSyncUsersMembershipHook({
  userField: 'groups',
})

const asUser = (value: unknown): PermissionUser | null =>
  value && typeof value === 'object' ? (value as PermissionUser) : null

const uniqueById = <T extends { id?: number | string }>(values: T[]): T[] => {
  const seen = new Set<number | string>()
  return values.filter((value) => {
    const id = value.id
    if (id == null) return true
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function findByRelation(
  req: PermissionRequest,
  collection: 'roleProfiles' | 'userGroups',
  value: RelationValue,
): Promise<PermissionSource | null> {
  const id = idFromRelation(value)
  if (id == null) return null
  if (typeof value === 'object' && value && 'name' in value) return value as PermissionSource

  try {
    return (await req.payload.findByID({
      collection,
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })) as PermissionSource
  } catch {
    return null
  }
}

async function findPermissionUserById(
  req: PermissionRequest,
  userId: number | string | null,
): Promise<PermissionUser | null> {
  if (userId == null) return null

  try {
    return (await req.payload.db.findOne({
      collection: 'users',
      req,
      where: {
        id: {
          equals: userId,
        },
      },
    })) as PermissionUser
  } catch {
    return null
  }
}

async function findSourcesContainingUser(
  req: PermissionRequest,
  collection: 'roleProfiles' | 'userGroups',
  userId: number | string | null,
): Promise<PermissionSource[]> {
  if (userId == null) return []

  try {
    const result = await req.payload.find({
      collection,
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        users: {
          contains: userId,
        },
      },
    })

    return result.docs as PermissionSource[]
  } catch {
    return []
  }
}

async function buildPermissionContext(req: PermissionRequest): Promise<PermissionContext> {
  const authUser = asUser(req.user)
  if (!authUser) return { user: null, roles: [], groups: [] }

  const authUserId = idFromRelation(authUser.id)
  const user =
    authUserId == null
      ? authUser
      : (await findPermissionUserById(req, authUserId)) ?? authUser

  const userId = idFromRelation(user.id)
  const [rolesFromUser, rolesWithUser, groupsFromUser, groupsWithUser] = await Promise.all([
    Promise.all((user.roles ?? []).map((role) => findByRelation(req, 'roleProfiles', role))),
    findSourcesContainingUser(req, 'roleProfiles', userId),
    Promise.all((user.groups ?? []).map((group) => findByRelation(req, 'userGroups', group))),
    findSourcesContainingUser(req, 'userGroups', userId),
  ])

  return {
    user,
    roles: uniqueById([...rolesFromUser.filter(Boolean), ...rolesWithUser] as PermissionSource[]),
    groups: uniqueById([...groupsFromUser.filter(Boolean), ...groupsWithUser] as PermissionSource[]),
  }
}

async function getPermissionContext(req: Parameters<Access>[0]['req']): Promise<PermissionContext> {
  const permissionReq = req as PermissionRequest
  permissionReq.context ??= {}

  const cached = permissionReq.context[permissionContextCacheKey]
  if (cached) return cached as Promise<PermissionContext>

  const contextPromise = buildPermissionContext(permissionReq)
  permissionReq.context[permissionContextCacheKey] = contextPromise
  return contextPromise
}

function isSuperAdmin(context: PermissionContext): boolean {
  return context.user?.role === 'super-admin'
}

function isSelf(context: PermissionContext, id?: number | string | null): boolean {
  const userId = idFromRelation(context.user?.id)
  return userId != null && id != null && String(userId) === String(id)
}

function permissionSources(context: PermissionContext): PermissionSource[] {
  if (!context.user) return []
  return [context.user, ...context.roles, ...context.groups]
}

function sourceAllowsOperation(
  source: PermissionSource,
  collection: ManagedCollection,
  operation: Operation,
): boolean {
  return (source.collectionPermissions ?? []).some((permission) => {
    if (permission.collection !== collection) return false
    const operations = permission.operations ?? []
    return operations.includes(operation) || (operation === 'read' && operations.length > 0)
  })
}

function canUseCollection(context: PermissionContext, collection: ManagedCollection, operation: Operation): boolean {
  if (!context.user) return operation === 'read' && !['users', 'roleProfiles', 'userGroups'].includes(collection)
  if (isSuperAdmin(context)) return true

  return permissionSources(context).some((source) => sourceAllowsOperation(source, collection, operation))
}

function ownedIdsFor(context: PermissionContext, collection: ManagedCollection): Array<number | string> {
  const field = collection === 'programs' ? 'ownedPrograms' : collection === 'vipaPrograms' ? 'ownedVipaPrograms' : null
  if (!field) return []

  return [
    ...new Set(
      permissionSources(context)
        .flatMap((source) => source[field] ?? [])
        .map(idFromRelation)
        .filter((id): id is number | string => id != null),
    ),
  ]
}

export async function getAssignedProgramIds(req: Parameters<Access>[0]['req']): Promise<Array<number | string> | true> {
  const context = await getPermissionContext(req)
  if (!context.user) return []
  if (isSuperAdmin(context)) return true
  return ownedIdsFor(context, 'programs')
}

function programScopeWhere(context: PermissionContext, collection: ManagedCollection): boolean | Where {
  if (isSuperAdmin(context)) return true
  const ids = ownedIdsFor(context, collection)
  if (ids.length === 0) return true

  return {
    id: {
      in: ids,
    },
  }
}

export function collectionAccess(collection: ManagedCollection): {
  admin: ({ req }: { req: Parameters<Access>[0]['req'] }) => boolean
  read: Access
  create: Access
  update: Access
  delete: Access
} {
  return {
    admin: ({ req }) => {
      if (collection !== 'users') return false
      return Boolean(req.user)
    },
    read: async ({ req }) => {
      const context = await getPermissionContext(req)
      if (collection === 'media' || collection === 'videos') return true
      if (!context.user) return canUseCollection(context, collection, 'read')
      if (collection === 'users') {
        const userId = idFromRelation(context.user.id)
        if (isSuperAdmin(context)) return true
        return userId == null ? false : { id: { equals: userId } }
      }
      if (!canUseCollection(context, collection, 'read')) return false
      return programScopeWhere(context, collection)
    },
    create: async ({ req }) => {
      if (isRelationshipSyncing(req as PermissionRequest)) return true
      const context = await getPermissionContext(req)
      if (collection === 'users') return isSuperAdmin(context)
      return canUseCollection(context, collection, 'create')
    },
    update: async ({ req }) => {
      if (isRelationshipSyncing(req as PermissionRequest)) return true
      const context = await getPermissionContext(req)
      if (collection === 'users') {
        if (isSuperAdmin(context)) return true
        const userId = idFromRelation(context.user?.id)
        return userId == null ? false : { id: { equals: userId } }
      }
      if (!canUseCollection(context, collection, 'update')) return false
      return programScopeWhere(context, collection)
    },
    delete: async ({ req }) => {
      const context = await getPermissionContext(req)
      if (collection === 'users') return isSuperAdmin(context)
      if (!canUseCollection(context, collection, 'delete')) return false
      return programScopeWhere(context, collection)
    },
  }
}

function fieldNamesFromPermission(permission: FieldPermission, collection: ManagedCollection): string[] {
  return [
    ...(permission.fields ?? [])
      .map((field) => field.split('.'))
      .filter(([fieldCollection]) => fieldCollection === collection)
      .map(([, field]) => field),
    ...(permission[`fields_${collection}`] ?? []),
  ].filter((field): field is string => Boolean(field))
}

function sourceAllowsField(
  source: PermissionSource,
  collection: ManagedCollection,
  field: string,
): boolean {
  return (source.fieldPermissions ?? []).some((permission) => {
    if (permission.collection !== collection) return false
    if (permission.allFields) return true
    return fieldNamesFromPermission(permission, collection).includes(field)
  })
}

export function canEditField(
  context: PermissionContext,
  collection: ManagedCollection,
  field: string,
  operation: WriteOperation,
): boolean {
  if (!context.user) return false
  if (isSuperAdmin(context)) return true
  if (!canUseCollection(context, collection, operation)) return false

  return permissionSources(context).some((source) => sourceAllowsField(source, collection, field))
}

export function fieldAccess(collection: ManagedCollection, field: string): {
  read: FieldAccess
  create: FieldAccess
  update: FieldAccess
} {
  return {
    read: async ({ req }) => {
      const context = await getPermissionContext(req)
      if (collection === 'users') return isSuperAdmin(context)
      return true
    },
    create: async ({ req }) =>
      isRelationshipSyncing(req as PermissionRequest) ||
      canEditField(await getPermissionContext(req), collection, field, 'create'),
    update: async ({ req }) =>
      isRelationshipSyncing(req as PermissionRequest) ||
      canEditField(await getPermissionContext(req), collection, field, 'update'),
  }
}

const ownPasswordKeys = new Set(['password', 'confirmPassword', '_confirmPassword'])
const authInternalUpdateKeys = new Set([
  'lockUntil',
  'loginAttempts',
  'resetPasswordExpiration',
  'resetPasswordToken',
])

function isOwnPasswordOnlyUpdate(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data).filter((key) => data[key] !== undefined)
  return keys.length > 0 && keys.every((key) => ownPasswordKeys.has(key))
}

function isAuthInternalOnlyUpdate(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data).filter((key) => data[key] !== undefined)
  return keys.length > 0 && keys.every((key) => authInternalUpdateKeys.has(key))
}

export const enforceUserSelfPasswordPolicy: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update') return data

  const nextData = data as Record<string, unknown>
  const permissionReq = req as PermissionRequest

  if (isRelationshipSyncing(permissionReq)) return data

  if (isAuthInternalOnlyUpdate(nextData)) return data

  const context = await getPermissionContext(permissionReq)
  if (!context.user) throw new Forbidden(req.t)

  const targetId = idFromRelation((originalDoc as { id?: number | string } | undefined)?.id)
  const targetIsSelf = isSelf(context, targetId)
  const changesPassword = Object.keys(nextData).some((key) => ownPasswordKeys.has(key))

  if (changesPassword && !targetIsSelf) {
    throw new Forbidden(req.t)
  }

  if (!isSuperAdmin(context) && (!targetIsSelf || !isOwnPasswordOnlyUpdate(nextData))) {
    throw new Forbidden(req.t)
  }

  return data
}

function isManagedCollection(slug: string): slug is ManagedCollection {
  return (managedCollections as readonly string[]).includes(slug)
}

function fieldName(field: Field): string | null {
  return 'name' in field && typeof field.name === 'string' ? field.name : null
}

function withFieldPermission(collection: ManagedCollection, field: Field): Field {
  const name = fieldName(field)
  const nextField = { ...field } as Field & { fields?: Field[]; access?: Record<string, unknown> }

  if (name && collectionFields[collection]?.includes(name)) {
    nextField.access = {
      ...(nextField.access ?? {}),
      ...fieldAccess(collection, name),
    }
  }

  if ('fields' in nextField && Array.isArray(nextField.fields)) {
    nextField.fields = nextField.fields.map((nestedField) => withFieldPermission(collection, nestedField))
  }

  return nextField
}

export function withCollectionPermissions<T extends CollectionConfig[]>(collections: T): T {
  return collections.map((collection) => {
    const slug = collection.slug
    if (!isManagedCollection(slug)) return collection

    return {
      ...collection,
      access: {
        ...(collection.access ?? {}),
        ...collectionAccess(slug),
      },
      fields: collection.fields?.map((field) => withFieldPermission(slug, field)) ?? [],
    }
  }) as T
}

export async function canViewAdminPage(req: Parameters<Access>[0]['req'], page: AdminPage): Promise<boolean> {
  const context = await getPermissionContext(req)
  if (!context.user) return false
  if (isSuperAdmin(context)) return true

  return permissionSources(context).some((source) => (source.allowedAdminPages ?? []).includes(page))
}

const documentRelationshipField = (label = 'Documents'): Field => ({
  name: 'allowedDocuments',
  type: 'relationship',
  relationTo: [...managedCollections] as any,
  hasMany: true,
  admin: {
    description: `${label} kept for legacy data only. Collection and field permissions control access.`,
    disabled: true,
  },
})

const collectionPermissionsField = (description: string): Field => ({
  name: 'collectionPermissions',
  type: 'array',
  admin: { description },
  fields: [
    {
      name: 'collection',
      type: 'select',
      required: true,
      options: collectionOptions,
    },
    {
      name: 'operations',
      type: 'select',
      required: true,
      hasMany: true,
      options: operationOptions,
      admin: {
        description: 'Choose one or more actions for this collection.',
      },
    },
  ],
})

const fieldPermissionsField = (description: string): Field => ({
  name: 'fieldPermissions',
  type: 'array',
  admin: { description },
  fields: [
    {
      name: 'collection',
      type: 'select',
      required: true,
      options: collectionOptions,
    },
    {
      name: 'allFields',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow create/update of every field in this collection.',
      },
    },
    {
      name: 'fields',
      type: 'text',
      hasMany: true,
      admin: {
        condition: (_: unknown, siblingData: { allFields?: boolean }) => !siblingData?.allFields,
        description: 'Legacy field list. Prefer the collection-specific picker below.',
      },
    },
    ...managedCollections.map((collection) => ({
      name: `fields_${collection}`,
      type: 'select' as const,
      hasMany: true,
      options: collectionFields[collection].map((field) => ({ label: field, value: field })),
      admin: {
        condition: (_: unknown, siblingData: { collection?: ManagedCollection; allFields?: boolean }) =>
          siblingData?.collection === collection && !siblingData?.allFields,
        description: `Editable fields from ${collection}.`,
      },
    })),
  ],
})

export const userPermissionFields: CollectionConfig['fields'] = [
  {
    name: 'role',
    type: 'select',
    required: true,
    defaultValue: 'user',
    options: [
      { label: 'Super Admin', value: 'super-admin' },
      { label: 'User', value: 'user' },
    ],
    admin: {
      description: 'Only Super Admin is built in. All other access comes from CMS roles or groups.',
    },
  },
  {
    name: 'roles',
    type: 'relationship',
    relationTo: 'roleProfiles',
    hasMany: true,
    admin: {
      description: 'CMS-created permission roles assigned to this user.',
    },
  },
  {
    name: 'groups',
    type: 'relationship',
    relationTo: 'userGroups',
    hasMany: true,
    admin: {
      description: 'Permission groups this user belongs to.',
    },
  },
  {
    name: 'ownedPrograms',
    type: 'relationship',
    relationTo: 'programs',
    hasMany: true,
    admin: {
      description: 'Programs this user owns. When set, program access is scoped to these rows.',
    },
  },
  {
    name: 'ownedVipaPrograms',
    type: 'relationship',
    relationTo: 'vipaPrograms',
    hasMany: true,
    admin: {
      description: 'VIPA programs this user owns. When set, VIPA program access is scoped to these rows.',
    },
  },
  {
    name: 'allowedAdminPages',
    type: 'select',
    hasMany: true,
    options: adminPageOptions,
    admin: {
      description: 'Optional extra admin pages this user can view.',
    },
  },
  collectionPermissionsField('Optional direct collection permissions for this user.'),
  fieldPermissionsField('Optional direct field permissions for this user.'),
  documentRelationshipField('Legacy document assignments'),
]

export const roleProfilesCollection: CollectionConfig = {
  slug: 'roleProfiles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    description: 'CMS-created permission roles. Super Admin is the only built-in role.',
  },
  access: collectionAccess('roleProfiles'),
  hooks: {
    afterChange: [syncRoleProfileUsers],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Role name, for example Producer or Editor.' },
    },
    {
      name: 'users',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: { description: 'Users assigned to this CMS role.' },
    },
    {
      name: 'allowedAdminPages',
      type: 'select',
      hasMany: true,
      options: adminPageOptions,
      admin: { description: 'Admin pages this role can view.' },
    },
    collectionPermissionsField('Collections this role can read, create, update, or delete.'),
    fieldPermissionsField('Fields this role can create or update. Use All Fields to allow every field.'),
    documentRelationshipField('Legacy document assignments'),
  ],
}

export const userGroupsCollection: CollectionConfig = {
  slug: 'userGroups',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    description: 'Permission groups for clients, departments, or partners.',
  },
  access: collectionAccess('userGroups'),
  hooks: {
    afterChange: [syncUserGroupUsers],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Group name, for example Toyota.' },
    },
    {
      name: 'users',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: { description: 'Users who belong to this group.' },
    },
    {
      name: 'ownedPrograms',
      type: 'relationship',
      relationTo: 'programs',
      hasMany: true,
      admin: { description: 'Programs owned by members of this group.' },
    },
    {
      name: 'ownedVipaPrograms',
      type: 'relationship',
      relationTo: 'vipaPrograms',
      hasMany: true,
      admin: { description: 'VIPA programs owned by members of this group.' },
    },
    {
      name: 'allowedAdminPages',
      type: 'select',
      hasMany: true,
      options: adminPageOptions,
      admin: { description: 'Optional extra admin pages members can view.' },
    },
    collectionPermissionsField('Collections group members can read, create, update, or delete.'),
    fieldPermissionsField('Fields group members can create or update. Use All Fields to allow every field.'),
    documentRelationshipField('Legacy document assignments'),
  ],
}
