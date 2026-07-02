'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

type VideoDoc = {
  id: number | string
  title?: string
  filename?: string
  url?: string
  mimeType?: string
  updatedAt?: string
}

function getApiBase(): string {
  if (typeof window === 'undefined') return ''
  const apiPath =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH
      ? `${process.env.NEXT_PUBLIC_BASE_PATH}/api`
      : '/admin/api'
  return window.location.origin + apiPath
}

function displayLabel(d: VideoDoc | null): string {
  if (!d) return ''
  const t = (d.title ?? '').toString().trim()
  const f = (d.filename ?? '').toString().trim()
  if (t && f) return `${t} (${f})`
  return t || f || String(d.id)
}

function getVideoSrc(doc: VideoDoc | null): string | null {
  if (!doc) return null
  const rawUrl = typeof doc.url === 'string' && doc.url.trim() ? doc.url.trim() : null
  if (rawUrl) {
    // Normalize relative URLs (e.g. "/admin/api/videos/file/x.mp4") to absolute so <video> works reliably.
    if (rawUrl.startsWith('/')) return `${window.location.origin}${rawUrl}`
    return rawUrl
  }
  const filename = typeof doc.filename === 'string' && doc.filename.trim() ? doc.filename.trim() : null
  if (!filename) return null
  // Use same base as admin API calls so it works behind NEXT_PUBLIC_BASE_PATH.
  return `${getApiBase()}/videos/file/${encodeURIComponent(filename)}`
}

export function VideoRelationPicker({
  value,
  onChange,
  label,
  className = '',
  initialDisplay,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  label: string
  className?: string
  /** When editing, you can pass the populated videos doc from the server */
  initialDisplay?: VideoDoc | null
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [docs, setDocs] = useState<VideoDoc[]>([])
  const [selectedDoc, setSelectedDoc] = useState<VideoDoc | null>(initialDisplay ?? null)

  const valueId = value === '' ? null : Number(value)

  const fetchSelected = useCallback(async () => {
    if (!valueId) {
      setSelectedDoc(null)
      return
    }
    if (initialDisplay && Number(initialDisplay.id) === valueId) {
      setSelectedDoc(initialDisplay)
      return
    }
    const base = getApiBase()
    try {
      const res = await fetch(`${base}/videos/${valueId}?depth=0`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || res.statusText)
      setSelectedDoc((data?.doc ?? data) as VideoDoc)
    } catch (e) {
      setSelectedDoc({ id: valueId })
    }
  }, [valueId, initialDisplay])

  useEffect(() => {
    fetchSelected()
  }, [fetchSelected])

  const runSearch = useCallback(async () => {
    const base = getApiBase()
    setLoading(true)
    setError(null)
    setDocs([])
    try {
      const qs = new URLSearchParams()
      qs.set('limit', '50')
      qs.set('depth', '0')
      qs.set('sort', '-updatedAt')
      const t = q.trim()
      if (t) {
        // Best-effort search: title OR filename contains query
        qs.set('where[or][0][title][like]', t)
        qs.set('where[or][1][filename][like]', t)
      }
      const res = await fetch(`${base}/videos?${qs.toString()}`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || res.statusText)
      setDocs((data?.docs ?? []) as VideoDoc[])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [q])

  const selectedLabel = useMemo(() => displayLabel(selectedDoc), [selectedDoc])
  const selectedVideoSrc = useMemo(() => getVideoSrc(selectedDoc), [selectedDoc])

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={selectedLabel}
          readOnly
          placeholder="No video selected"
          className="flex-1 min-w-[200px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            setModalOpen(true)
            queueMicrotask(() => runSearch())
          }}
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Pick from Videos
        </button>
        {value !== '' ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>

      {selectedVideoSrc ? (
        <div className="mt-2">
          <video
            key={selectedVideoSrc}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            playsInline
            preload="metadata"
            className="w-full max-w-sm rounded bg-black"
            src={selectedVideoSrc}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      ) : null}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pick video"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
                placeholder="Search by title or filename…"
                className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={loading}
                className="rounded bg-gray-700 text-white px-4 py-2 text-sm hover:bg-gray-600 disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Search'}
              </button>
            </div>

            {error && (
              <div className="mx-4 mt-2 rounded border border-red-200 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-auto p-4">
              {docs.length === 0 && !loading ? (
                <p className="text-sm text-gray-500">No videos found.</p>
              ) : (
                <div className="space-y-2">
                  {docs.map((d) => {
                    const idNum = Number(d.id)
                    return (
                      <div
                        key={String(d.id)}
                        className="flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {displayLabel(d)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            id: {String(d.id)}
                            {d.mimeType ? ` • ${d.mimeType}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onChange(Number.isFinite(idNum) ? idNum : '')
                            setSelectedDoc(d)
                            setModalOpen(false)
                          }}
                          className="shrink-0 rounded bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"
                        >
                          Select
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

