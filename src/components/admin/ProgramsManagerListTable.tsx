'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import type { ProgramsListColumnDef } from './programsManagerListConstants'
import { PROGRAMS_FILTER_FIELDS } from './programsManagerListConstants'

const BULK_EDIT_FIELDS = PROGRAMS_FILTER_FIELDS.filter((field) => field.field !== 'is_Award')

type ProgramDoc = Record<string, unknown> & {
  id: number | string
  coverImage?: { id: number | string; url?: string } | number | null
  image?: { id: number | string; url?: string } | number | null
}

function normalizeImageSrc(src: string): string {
  if (!src.startsWith('http')) return src.startsWith('/') ? src : `/${src}`
  if (typeof window === 'undefined') return src
  try {
    const url = new URL(src)
    if (url.origin === window.location.origin) return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return src
  }
  return src
}

function getImageUrlForDoc(media: unknown): string | null {
  if (media == null) return null
  if (typeof media === 'object' && media !== null && 'url' in media && (media as { url?: string }).url) {
    const url = (media as { url: string }).url
    return normalizeImageSrc(url)
  }
  if (typeof media === 'number' || typeof media === 'string') {
    const base = typeof process.env.NEXT_PUBLIC_BASE_PATH === 'string'
      ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '')
      : ''
    return `${base}/api/media/${media}/file`
  }
  return null
}

export type ProgramsManagerListTableProps = {
  programs: ProgramDoc[]
  effectiveColumns: string[]
  listColumns: ProgramsListColumnDef[]
  adminRoute: string
  /** Optional API base path for delete and bulk edit. Defaults to the Payload REST API route. */
  apiBase?: string
  /** Base URL for list (e.g. /admin/programs-manager) for sort links */
  listBaseHref?: string
  /** Current sort param (e.g. -updatedAt) for sortable headers */
  initialSort?: string
  canEditPrograms?: boolean
}

export function ProgramsManagerListTable({
  programs,
  effectiveColumns,
  listColumns,
  adminRoute,
  apiBase = `${typeof process.env.NEXT_PUBLIC_BASE_PATH === 'string' ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '') : ''}/api`,
  listBaseHref,
  initialSort = '-updatedAt',
  canEditPrograms = false,
}: ProgramsManagerListTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const columnDefsMap = new Map(listColumns.map((c) => [c.id, c]))

  const sortableMap = useMemo(
    () => Object.fromEntries(listColumns.filter((c) => c.sortKey).map((c) => [c.id, c.sortKey!])),
    [listColumns]
  )
  const buildSortHref = useCallback(
    (newSort: string) => {
      if (!listBaseHref) return '#'
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set('sort', newSort)
      params.set('page', '1')
      return `${listBaseHref}?${params.toString()}`
    },
    [listBaseHref, searchParams]
  )
  const sortDirection = useCallback(
    (columnId: string): 'asc' | 'desc' | null => {
      const sortKey = sortableMap[columnId]
      if (!sortKey) return null
      if (initialSort === sortKey) return 'asc'
      if (initialSort === `-${sortKey}`) return 'desc'
      return null
    },
    [initialSort, sortableMap]
  )

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  type BulkEditRow = { id: number; field: string; value: string }
  const [bulkEditRows, setBulkEditRows] = useState<BulkEditRow[]>(() => [
    { id: 0, field: BULK_EDIT_FIELDS[0]?.field ?? '', value: '' },
  ])
  const [bulkEditing, setBulkEditing] = useState(false)
  const nextRowId = useMemo(() => Math.max(0, ...bulkEditRows.map((r) => r.id)) + 1, [bulkEditRows])

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => setSuccessMessage(null), 5000)
    return () => clearTimeout(t)
  }, [successMessage])

  const toggleOne = useCallback((id: number | string) => {
    const key = String(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === programs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(programs.map((p) => String(p.id))))
    }
  }, [programs, selectedIds.size])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setShowBulkEdit(false)
    setError(null)
    setSuccessMessage(null)
  }, [])

  const parseBulkValue = useCallback(
    (field: string, value: string): string | number | boolean | null => {
      const def = BULK_EDIT_FIELDS.find((f) => f.field === field)
      const v = value.trim()
      if (def?.type === 'checkbox') {
        if (v === 'true' || v === '1' || v.toLowerCase() === 'yes') return true
        return false
      }
      if (def?.type === 'number') {
        if (v === '') return 0
        const n = Number(v)
        return Number.isNaN(n) ? 0 : n
      }
      if (def?.type === 'date') return v || null
      return v || null
    },
    []
  )

  const handleBulkEdit = useCallback(async () => {
    const body: Record<string, unknown> = {}
    for (const row of bulkEditRows) {
      if (!row.field) continue
      const def = BULK_EDIT_FIELDS.find((f) => f.field === row.field)
      const isCheckbox = def?.type === 'checkbox'
      if (!isCheckbox && row.value.trim() === '') continue
      body[row.field] = parseBulkValue(row.field, row.value)
    }
    if (selectedIds.size === 0 || Object.keys(body).length === 0) return
    setError(null)
    setSuccessMessage(null)
    setBulkEditing(true)
    const ids = Array.from(selectedIds)
    const count = ids.length
    const base = typeof window !== 'undefined' ? `${window.location.origin}${apiBase}` : ''
    try {
      for (const id of ids) {
        const res = await fetch(`${base}/programs/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || data.errors?.[0]?.message || res.statusText)
        }
      }
      setSelectedIds(new Set())
      setShowBulkEdit(false)
      setBulkEditRows([{ id: 0, field: BULK_EDIT_FIELDS[0]?.field ?? '', value: '' }])
      setSuccessMessage(`Successfully updated ${count} program(s).`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setBulkEditing(false)
    }
  }, [selectedIds, bulkEditRows, parseBulkValue, apiBase, router])

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} program(s)? This cannot be undone.`)) return
    setError(null)
    setSuccessMessage(null)
    setDeleting(true)
    const ids = Array.from(selectedIds)
    const count = ids.length
    const base = typeof window !== 'undefined' ? `${window.location.origin}${apiBase}` : ''
    try {
      for (const id of ids) {
        const res = await fetch(`${base}/programs/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || data.errors?.[0]?.message || res.statusText)
        }
      }
      setSelectedIds(new Set())
      setSuccessMessage(`Successfully deleted ${count} program(s).`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }, [selectedIds, apiBase, router])

  function renderCell(program: ProgramDoc, columnId: string, editHref: string): React.ReactNode {
    if (columnId === 'cover') {
      const imgSrc = getImageUrlForDoc(program.coverImage) ?? getImageUrlForDoc(program.image)
      return (
        <td className="p-3 align-top" key={columnId}>
          {canEditPrograms ? (
            <Link href={editHref} className="relative block h-[104px] w-[156px] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
              {imgSrc ? (
                <Image src={imgSrc} alt="" fill sizes="156px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">No image</div>
              )}
            </Link>
          ) : (
            <span className="relative block h-[104px] w-[156px] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
              {imgSrc ? (
                <Image src={imgSrc} alt="" fill sizes="156px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">No image</div>
              )}
            </span>
          )}
        </td>
      )
    }
    if (columnId === 'actions') {
      return (
        <td className="p-3 align-middle" key={columnId}>
          {canEditPrograms ? (
            <Link href={editHref} className="inline-flex h-9 items-center rounded-xl border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
              Edit
            </Link>
          ) : (
            <span className="text-sm text-neutral-400">View only</span>
          )}
        </td>
      )
    }
    const raw = program[columnId]
    if (raw == null || raw === '') return <td className="p-3 align-middle text-sm text-neutral-400" key={columnId}>—</td>
    if (typeof raw === 'boolean') return <td className="p-3 align-middle text-sm" key={columnId}>{raw ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">Yes</span> : <span className="text-neutral-400">—</span>}</td>
    if (raw instanceof Date || (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw))) {
      const d = typeof raw === 'string' ? new Date(raw) : raw
      return <td className="p-3 align-middle text-sm text-neutral-500" key={columnId}>{d.toLocaleDateString()}</td>
    }
    if (typeof raw === 'number') return <td className="p-3 align-middle text-sm" key={columnId}>{String(raw)}</td>
    if (typeof raw === 'object' && raw !== null && 'url' in raw) {
      const u = getImageUrlForDoc(raw)
      return (
        <td className="p-3 align-middle text-sm" key={columnId}>
          {u ? (
            <span className="relative block h-8 w-20">
              <Image src={u} alt="" fill sizes="80px" className="object-contain" />
            </span>
          ) : '—'}
        </td>
      )
    }
    if (columnId === 'views' && typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
      const str = JSON.stringify(raw)
      return (
        <td className="p-3 align-middle text-sm max-w-[200px] truncate font-mono" key={columnId} title={str}>
          {str || '—'}
        </td>
      )
    }
    if (Array.isArray(raw)) return <td className="p-3 align-middle text-sm" key={columnId}>{raw.length}</td>
    const str = String(raw)
    return (
      <td className="p-3 align-middle text-sm max-w-[200px] truncate" key={columnId} title={str.length > 50 ? str : undefined}>
        {str}
      </td>
    )
  }

  const hasSelection = selectedIds.size > 0
  const allSelected = programs.length > 0 && selectedIds.size === programs.length

  return (
    <>
      {/* Success / error message banner – visible after apply or when error occurs */}
      {(successMessage || error) && (
        <div
          className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm ${
            successMessage
              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          <span>{successMessage ?? error}</span>
          <button
            type="button"
            onClick={() => {
              setSuccessMessage(null)
              setError(null)
            }}
            className="shrink-0 rounded-xl px-3 py-1.5 font-medium hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bulk actions bar (like Payload CMS) – shown when at least one row is selected */}
      {hasSelection && (
        <div className="mb-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => setShowBulkEdit((v) => !v)}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-amber-100 dark:text-neutral-300 dark:hover:bg-amber-950/30"
            >
              Clear selection
            </button>
            {error && (
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            )}
          </div>

          {/* Bulk edit panel: multiple field + value rows */}
          {showBulkEdit && (
            <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
              <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Bulk edit (set multiple columns):</div>
              <div className="space-y-2">
                {bulkEditRows.map((row) => {
                  const fieldDef = BULK_EDIT_FIELDS.find((f) => f.field === row.field)
                  return (
                    <div key={row.id} className="flex flex-wrap items-end gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Field</span>
                        <select
                          value={row.field}
                          onChange={(e) =>
                            setBulkEditRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, field: e.target.value, value: '' } : r))
                            )
                          }
                          className="min-w-[180px]"
                        >
                          {BULK_EDIT_FIELDS.map((f) => (
                            <option key={f.field} value={f.field}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Value</span>
                        {fieldDef?.type === 'checkbox' ? (
                          <select
                            value={row.value}
                            onChange={(e) =>
                              setBulkEditRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                              )
                            }
                            className="min-w-[140px]"
                          >
                            <option value="">No / false</option>
                            <option value="true">Yes / true</option>
                          </select>
                        ) : fieldDef?.type === 'select' && fieldDef.options?.length ? (
                          <select
                            value={row.value}
                            onChange={(e) =>
                              setBulkEditRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                              )
                            }
                            className="min-w-[180px]"
                          >
                            <option value="">—</option>
                            {fieldDef.options.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : fieldDef?.type === 'number' ? (
                          <input
                            type="number"
                            value={row.value}
                            onChange={(e) =>
                              setBulkEditRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                              )
                            }
                            className="w-32"
                          />
                        ) : fieldDef?.type === 'date' ? (
                          <input
                            type="date"
                            value={row.value}
                            onChange={(e) =>
                              setBulkEditRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                              )
                            }
                            className="w-40"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) =>
                              setBulkEditRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r))
                              )
                            }
                            placeholder="Enter value"
                            className="min-w-[220px]"
                          />
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBulkEditRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))
                        }
                        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        title="Remove row"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBulkEditRows((prev) => [...prev, { id: nextRowId, field: BULK_EDIT_FIELDS[0]?.field ?? '', value: '' }])
                  }
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  + Add field
                </button>
                <button
                  type="button"
                  onClick={handleBulkEdit}
                  disabled={bulkEditing}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  {bulkEditing ? 'Updating…' : 'Apply'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkEdit(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/30">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <th className="p-3 w-10">
                {programs.length > 0 && (
                  <label className="flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all on page"
                    />
                  </label>
                )}
              </th>
              {effectiveColumns.map((colId) => {
                const def = columnDefsMap.get(colId)
                const label = def?.label ?? colId
                const sortKey = sortableMap[colId]
                const thClass = 'border-b border-neutral-200 p-3 text-xs font-semibold uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400' + (colId === 'cover' ? ' w-[180px]' : colId === 'actions' ? ' w-[100px]' : '')
                if (sortKey) {
                  const dir = sortDirection(colId)
                  const ascHref = buildSortHref(sortKey)
                  const descHref = buildSortHref(`-${sortKey}`)
                  const baseBtn = 'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-xs font-semibold transition-colors'
                  const inactiveBtn = 'text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300'
                  const activeAsc = 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950'
                  const activeDesc = 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950'
                  return (
                    <th key={colId} className={thClass}>
                      <span className="inline-flex items-center gap-1.5">
                        <span>{label}</span>
                        <span className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-950" aria-label={`Sort by ${label}`}>
                          <Link
                            href={ascHref}
                            className={`${baseBtn} ${dir === 'asc' ? activeAsc : inactiveBtn}`}
                            title="Sort ascending"
                            aria-label="Sort ascending"
                            aria-pressed={dir === 'asc'}
                          >
                            ↑
                          </Link>
                          <Link
                            href={descHref}
                            className={`${baseBtn} ${dir === 'desc' ? activeDesc : inactiveBtn}`}
                            title="Sort descending"
                            aria-label="Sort descending"
                            aria-pressed={dir === 'desc'}
                          >
                            ↓
                          </Link>
                        </span>
                      </span>
                    </th>
                  )
                }
                return <th key={colId} className={thClass}>{label}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={effectiveColumns.length + 1} className="p-10 text-center text-neutral-500">
                  No programs yet. Click &quot;Add program&quot; to create one.
                </td>
              </tr>
            ) : (
              programs.map((program) => {
                const editPath = `/programs-manager/${program.id}` as `/${string}`
                const editHref = `${adminRoute}${editPath}`
                const idStr = String(program.id)
                const checked = selectedIds.has(idStr)
                return (
                  <tr
                    key={idStr}
                    className={`border-b border-neutral-100 dark:border-neutral-800/70 ${checked ? 'bg-neutral-100 dark:bg-neutral-900' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'}`}
                  >
                    <td className="p-3 w-10 align-middle">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(program.id)}
                          aria-label={`Select program ${idStr}`}
                        />
                      </label>
                    </td>
                    {effectiveColumns.map((colId) => renderCell(program as ProgramDoc, colId, editHref))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
