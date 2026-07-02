/**
 * Build list columns and filter fields from the programs collection config (payload.config.ts)
 */
import type { ProgramsListColumnDef, ProgramsFilterFieldDef, FilterFieldType } from '../components/admin/programsManagerListConstants'

type FieldLike = {
  name: string
  type: string
  admin?: { description?: string; hidden?: boolean }
  options?: { label: string; value: string }[]
}

type CollectionConfigLike = {
  fields?: FieldLike[]
  admin?: { defaultColumns?: string[] }
}

function fieldLabel(f: FieldLike): string {
  const desc = f.admin?.description
  if (typeof desc === 'string' && desc.trim()) return desc.trim()
  return toWords(f.name)
}

function toWords(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .trim() || name
}

function isSortableType(type: string): boolean {
  return ['text', 'textarea', 'number', 'date', 'checkbox', 'select'].includes(type)
}

function toFilterType(type: string): FilterFieldType {
  if (type === 'select' || type === 'radio') return 'select'
  if (type === 'number') return 'number'
  if (type === 'date') return 'date'
  if (type === 'checkbox') return 'checkbox'
  return 'text'
}

export type ProgramsListConfig = {
  columns: ProgramsListColumnDef[]
  filterFields: ProgramsFilterFieldDef[]
  defaultVisibleColumnIds: string[]
  allColumnIds: string[]
}

export function getProgramFieldLabels(collectionConfig: CollectionConfigLike | null | undefined): Record<string, string> {
  const labels: Record<string, string> = {}
  const fields = collectionConfig?.fields ?? []
  for (const f of fields) {
    if (f.admin?.hidden) continue
    labels[f.name] = fieldLabel(f)
  }
  if (!labels['createdAt']) labels['createdAt'] = 'Created'
  if (!labels['updatedAt']) labels['updatedAt'] = 'Updated'
  return labels
}

export function buildProgramsListConfig(collectionConfig: CollectionConfigLike | null | undefined): ProgramsListConfig {
  const columns: ProgramsListColumnDef[] = [{ id: 'cover', label: 'Cover / Image' }]
  const filterFields: ProgramsFilterFieldDef[] = []
  const fields = collectionConfig?.fields ?? []

  const seenIds = new Set<string>()
  for (const f of fields) {
    if (f.admin?.hidden) continue
    const name = f.name
    seenIds.add(name)
    const label = fieldLabel(f)
    const sortKey = isSortableType(f.type) && f.type !== 'upload' && f.type !== 'relationship' ? name : undefined
    columns.push({ id: name, label, sortKey })

    if (f.type !== 'upload' && f.type !== 'relationship') {
      const filterType = toFilterType(f.type)
      const def: ProgramsFilterFieldDef = { field: name, label, type: filterType }
      if (f.type === 'select' && Array.isArray(f.options) && f.options.length > 0) {
        def.options = f.options.map((o) => ({ label: o.label ?? String(o.value), value: String(o.value ?? '') }))
      }
      filterFields.push(def)
    }
  }
  if (!seenIds.has('createdAt')) {
    columns.push({ id: 'createdAt', label: 'Created', sortKey: 'createdAt' })
    filterFields.push({ field: 'createdAt', label: 'Created', type: 'date' })
  }
  if (!seenIds.has('updatedAt')) {
    columns.push({ id: 'updatedAt', label: 'Updated', sortKey: 'updatedAt' })
    filterFields.push({ field: 'updatedAt', label: 'Updated', type: 'date' })
  }

  columns.push({ id: 'actions', label: 'Actions' })

  const defaultFromConfig = collectionConfig?.admin?.defaultColumns
  const defaultVisibleColumnIds =
    Array.isArray(defaultFromConfig) && defaultFromConfig.length > 0
      ? ['cover', ...defaultFromConfig.filter((id) => id !== 'cover' && columns.some((c) => c.id === id)), 'actions']
      : ['cover', 'programId', 'titleTh', 'titleEn', 'programContentType', 'updatedAt', 'actions']

  const allColumnIds = columns.map((c) => c.id)

  return {
    columns,
    filterFields,
    defaultVisibleColumnIds,
    allColumnIds,
  }
}
