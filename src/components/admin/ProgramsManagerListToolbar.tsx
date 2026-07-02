'use client'

import { useRouter, usePathname } from 'next/navigation'
import React, { useState, useCallback, useEffect, useRef } from 'react'

import {
  DEFAULT_VISIBLE_COLUMN_IDS,
  type FilterCondition,
  PER_PAGE_DEFAULT,
  PER_PAGE_OPTIONS,
  type ProgramsFilterFieldDef,
  type ProgramsListColumnDef,
  PROGRAMS_FILTER_FIELDS,
  PROGRAMS_LIST_COLUMNS,
} from './programsManagerListConstants'

const TEXT_OPERATORS = [
  { value: 'like', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
]
const SELECT_OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
]
const NUMBER_DATE_OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
]
const CHECKBOX_OPERATORS = [{ value: 'equals', label: 'is' }]

export type { FilterCondition }

export type ProgramsManagerListToolbarProps = {
  initialSearch?: string
  initialSort?: string
  initialWhere?: FilterCondition[]
  initialColumns?: string[]
  /** Columns from payload.config (programs collection); when provided, list uses config like default page */
  availableColumns?: ProgramsListColumnDef[]
  /** Filter fields from payload.config; when provided, Add filter uses config */
  availableFilterFields?: ProgramsFilterFieldDef[]
  /** Default visible column ids from config.admin.defaultColumns */
  defaultVisibleColumnIds?: string[]
  totalDocs: number
  totalPages: number
  currentPage: number
  limit: number
  showColumns?: boolean
}

function parseWhereFromUrl(whereParam: string | string[] | undefined): FilterCondition[] {
  if (!whereParam) return []
  try {
    const raw = typeof whereParam === 'string' ? whereParam : whereParam[0]
    const arr = JSON.parse(decodeURIComponent(raw || '[]'))
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function whereToUrl(conditions: FilterCondition[]): string | null {
  if (conditions.length === 0) return null
  return encodeURIComponent(JSON.stringify(conditions))
}

export function ProgramsManagerListToolbar({
  initialSearch = '',
  initialSort = '-updatedAt',
  initialWhere = [],
  initialColumns,
  availableColumns: availableColumnsProp,
  availableFilterFields: availableFilterFieldsProp,
  defaultVisibleColumnIds: defaultVisibleColumnIdsProp,
  totalDocs,
  totalPages,
  currentPage,
  limit,
  showColumns = true,
}: ProgramsManagerListToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const availableColumns = availableColumnsProp ?? PROGRAMS_LIST_COLUMNS
  const availableFilterFields = availableFilterFieldsProp ?? PROGRAMS_FILTER_FIELDS
  const defaultVisibleColumnIds = defaultVisibleColumnIdsProp ?? [...DEFAULT_VISIBLE_COLUMN_IDS]

  const [search, setSearch] = useState(initialSearch)
  const [filters, setFilters] = useState<FilterCondition[]>(initialWhere)
  const [columns, setColumns] = useState<string[]>(
    initialColumns && initialColumns.length > 0 ? initialColumns : [...defaultVisibleColumnIds]
  )
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstMount = useRef(true)

  // Sync state when URL-derived props change (e.g. after navigation)
  const whereKey = JSON.stringify(initialWhere ?? [])
  const columnsKey = (initialColumns && initialColumns.length > 0 ? initialColumns : defaultVisibleColumnIds).join(',')
  useEffect(() => {
    setFilters(initialWhere ?? [])
  }, [whereKey])
  useEffect(() => {
    setColumns(initialColumns && initialColumns.length > 0 ? initialColumns : [...defaultVisibleColumnIds])
  }, [columnsKey])

  // Debounced search: update URL 350ms after user stops typing (resets to page 1)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ page: 1 }))
      debounceRef.current = null
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const buildUrl = useCallback(
    (updates: {
      search?: string
      sort?: string
      where?: FilterCondition[]
      columns?: string[]
      page?: number
      limit?: number
    }) => {
      const params = new URLSearchParams()
      const newSearch = updates.search !== undefined ? updates.search : search
      const newSort = updates.sort !== undefined ? updates.sort : initialSort
      const newWhere = updates.where !== undefined ? updates.where : filters
      const newColumns = updates.columns !== undefined ? updates.columns : columns
      const newPage = updates.page !== undefined ? updates.page : 1
      const newLimit = updates.limit !== undefined ? updates.limit : limit
      if (newSearch.trim()) params.set('search', newSearch.trim())
      if (newSort && newSort !== '-updatedAt') params.set('sort', newSort)
      const whereStr = whereToUrl(newWhere)
      if (whereStr) params.set('where', whereStr)
      if (newColumns.join(',') !== defaultVisibleColumnIds.join(',')) params.set('columns', newColumns.join(','))
      if (newLimit !== PER_PAGE_DEFAULT) params.set('limit', String(newLimit))
      if (newPage > 1) params.set('page', String(newPage))
      const q = params.toString()
      return q ? `${pathname}?${q}` : pathname
    },
    [pathname, search, initialSort, filters, columns, limit]
  )

  const addFilter = () => {
    const first = availableFilterFields[0]
    const op = first?.type === 'checkbox' ? 'equals' : first?.type === 'text' ? 'like' : 'equals'
    setFilters((prev) => [...prev, { field: first?.field ?? 'programId', operator: op, value: '' }])
    setFiltersOpen(true)
  }

  const updateFilter = (index: number, upd: Partial<FilterCondition>) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? { ...f, ...upd } : f)))
  }

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index))
    router.push(buildUrl({ where: filters.filter((_, i) => i !== index), page: 1 }))
  }

  const applyWhere = () => {
    router.push(buildUrl({ where: filters, page: 1 }))
    setFiltersOpen(false)
  }

  const columnOrder = availableColumns.map((c) => c.id)
  const toggleColumn = (id: string) => {
    const next = columns.includes(id)
      ? columns.filter((c) => c !== id)
      : [...columns, id].sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b))
    setColumns(next)
    router.push(buildUrl({ columns: next, page: 1 }))
  }

  const clearFilters = () => {
    setSearch('')
    setFilters([])
    setColumns([...defaultVisibleColumnIds])
    router.push(pathname)
  }

  const defaultColsStr = defaultVisibleColumnIds.join(',')
  const hasActiveFilters = Boolean(
    initialSearch ||
      (initialSort && initialSort !== '-updatedAt') ||
      (initialWhere && initialWhere.length > 0) ||
      (initialColumns && initialColumns.join(',') !== defaultColsStr)
  )

  return (
    <div className="mb-4 space-y-3">
      {/* Top row: search + columns + filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/20">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && router.push(buildUrl({ page: 1 }))}
            className="min-w-[220px]"
            aria-label="Search"
          />
          {showColumns && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnsOpen((o) => !o)}
                className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Columns
              </button>
              {columnsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden="true"
                    onClick={() => setColumnsOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-20 mt-2 max-h-[70vh] min-w-[240px] overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-2 shadow-2xl shadow-neutral-900/15 dark:border-neutral-700 dark:bg-neutral-950 dark:shadow-black/40">
                    {availableColumns.map((col) => (
                      <label
                        key={col.id}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      >
                        <input
                          type="checkbox"
                          checked={columns.includes(col.id)}
                          onChange={() => toggleColumn(col.id)}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Add filter
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span>Per page</span>
            <select
              value={limit}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (PER_PAGE_OPTIONS.includes(value as (typeof PER_PAGE_OPTIONS)[number])) {
                  router.push(buildUrl({ limit: value, page: 1 }))
                }
              }}
              className="min-w-20"
              aria-label="Programs per page"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
          {totalDocs > 0
            ? `${(currentPage - 1) * limit + 1}-${Math.min(currentPage * limit, totalDocs)} of ${totalDocs}`
            : '0 programs'}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => router.push(buildUrl({ page: currentPage - 1 }))}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
            >
              Previous
            </button>
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => router.push(buildUrl({ page: currentPage + 1 }))}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Filters panel */}
      {(filtersOpen || filters.length > 0) && (
        <div className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/20">
          {filters.map((f, i) => {
            const fieldDef = availableFilterFields.find((x) => x.field === f.field)
            const operators =
              fieldDef?.type === 'select'
                ? SELECT_OPERATORS
                : fieldDef?.type === 'checkbox'
                  ? CHECKBOX_OPERATORS
                  : fieldDef?.type === 'number' || fieldDef?.type === 'date'
                    ? NUMBER_DATE_OPERATORS
                    : TEXT_OPERATORS
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900">
                <select
                  value={f.field}
                  onChange={(e) => {
                    const nextDef = availableFilterFields.find((x) => x.field === e.target.value)
                    const op = nextDef?.type === 'checkbox' ? 'equals' : nextDef?.type === 'text' ? 'like' : 'equals'
                    updateFilter(i, { field: e.target.value, operator: op, value: '' })
                  }}
                  className="min-w-[160px]"
                >
                  {availableFilterFields.map((o) => (
                    <option key={o.field} value={o.field}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  value={f.operator}
                  onChange={(e) => updateFilter(i, { operator: e.target.value })}
                  className="min-w-[140px]"
                >
                  {operators.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {fieldDef?.type === 'select' ? (
                  <select
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    className="min-w-[140px]"
                  >
                    <option value="">—</option>
                    {(fieldDef.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : fieldDef?.type === 'checkbox' ? (
                  <select
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    className="min-w-[120px]"
                  >
                    <option value="">—</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : fieldDef?.type === 'number' ? (
                  <input
                    type="number"
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    placeholder="Value"
                    className="w-28 min-w-[112px]"
                  />
                ) : fieldDef?.type === 'date' ? (
                  <input
                    type="date"
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    className="min-w-[160px]"
                  />
                ) : (
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    placeholder="Value"
                    className="min-w-[160px]"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFilter(i)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Remove
                </button>
              </div>
            )
          })}
          {filters.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addFilter}
                className="rounded-xl border border-dashed border-neutral-400 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-900"
              >
                + Add another filter
              </button>
              <button
                type="button"
                onClick={applyWhere}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Apply filters
              </button>
            </div>
          )}
          {filters.length === 0 && filtersOpen && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addFilter}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                + Add filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
