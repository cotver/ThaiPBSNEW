'use client'

import Image from 'next/image'
import React, { useCallback, useState } from 'react'

const AIRFLOW_ORIGIN = process.env.NEXT_PUBLIC_AIRFLOW_ORIGIN || 'https://airflow.thaipbs.or.th:8005'
const API_BASE = process.env.NEXT_PUBLIC_BASE_PATH || '/admin'

type AnyResult = Record<string, unknown>

function isClip(r: AnyResult) {
  return (r as any)?.data?.asset?.asset_type_text === 'clip'
}

function staticProxyUrl(thumbnailPath: string) {
  return `${API_BASE}/api/airflow/static?path=${encodeURIComponent(thumbnailPath)}`
}

function videoProxyUrl(proxyPath: string) {
  const full = `${AIRFLOW_ORIGIN}/static/${proxyPath.replace(/^\/+/, '')}`
  return `${API_BASE}/api/airflow/video?url=${encodeURIComponent(full)}`
}

export type AirflowSharedSearch = {
  q: string
  results: AnyResult[]
  setQ: (q: string) => void
  setResults: (results: AnyResult[]) => void
}

export type AirflowVideoPickerProps = {
  value: string
  onChange: (path: string) => void
  label: string
  className?: string
  /** When true, selecting a clip saves its thumbnail_path instead of proxy_path (same search UI). */
  pickThumbnail?: boolean
  /** When set, this picker uses the same search query/results as the other picker(s) with the same sharedSearch (e.g. Video + Video Thumbnail in the same section). */
  sharedSearch?: AirflowSharedSearch
}

export function AirflowVideoPicker({
  value,
  onChange,
  label,
  className = '',
  pickThumbnail = false,
  sharedSearch,
}: AirflowVideoPickerProps) {
  const [ownQ, setOwnQ] = useState('')
  const [ownResults, setOwnResults] = useState<AnyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const q = sharedSearch?.q ?? ownQ
  const setQ = sharedSearch?.setQ ?? setOwnQ
  const results = sharedSearch?.results ?? ownResults
  const setResults = sharedSearch?.setResults ?? setOwnResults

  const clips = React.useMemo(() => results.filter(isClip), [results])

  const runSearch = useCallback(async () => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res1 = await fetch(`${API_BASE}/api/airflow/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          q: q.trim(),
          template: 'Meta Data Team',
          flags: {
            clips: true,
            files: true,
            images: true,
            markers: true,
            sequences: true,
            subclips: true,
          },
          payload: {},
        }),
      })
      const data1 = await res1.json().catch(async () => ({ raw: await res1.text() }))
      if (!res1.ok) throw new Error(`Search failed: HTTP ${res1.status}`)
      const cacheId = data1?.data?.cache_id
      if (!cacheId) throw new Error('No cache_id in response')

      const qs = 'start=0&max_results=50&wait_for_results=true&wait_timeout=31&sort_by=MODIFIED&sort_order=descending'
      const res2 = await fetch(`${API_BASE}/api/airflow/search/${encodeURIComponent(cacheId)}?${qs}`)
      const data2 = await res2.json().catch(async () => ({ raw: await res2.text() }))
      if (!res2.ok) throw new Error(`Results failed: HTTP ${res2.status}`)
      setResults((data2 as any)?.data?.results ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [q])

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={value}
          readOnly
          placeholder="No video selected"
          className="flex-1 min-w-[120px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Search &amp; pick video
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pick Airflow video"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Search Airflow — {label}
              </h3>
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
                  e.stopPropagation()
                  runSearch()
                }
              }}
                placeholder="Search (e.g. g001234)"
                className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={loading || !q.trim()}
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
              {clips.length === 0 && !loading && (
                <p className="text-sm text-gray-500">
                  {results.length === 0 ? 'Run a search to see clips.' : 'No clips in results.'}
                </p>
              )}
              {clips.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {clips.map((r, idx) => {
                    const d = (r as any).data
                    const baseName = d?.display_name ?? d?.metadata?.clip_name ?? `clip-${idx}`
                    const fileExt = d?.display_fileext
                    const name = fileExt ? `${baseName}.${fileExt}` : baseName
                    const thumbPath = d?.asset?.thumbnail_path
                    const proxyPath = d?.proxy_path as string | undefined
                    if (!proxyPath && !pickThumbnail) return null
                    const valueToSave = pickThumbnail ? (thumbPath ?? '') : proxyPath!
                    const canSelect = pickThumbnail ? true : !!proxyPath
                    return (
                      <div
                        key={d?.clip_id ?? idx}
                        className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                      >
                        <div className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 text-sm truncate" title={name}>
                          {name}
                        </div>
                        {thumbPath ? (
                          <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900">
                            <Image
                              src={staticProxyUrl(thumbPath)}
                              alt={name}
                              fill
                              sizes="(max-width: 1024px) 50vw, 320px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                            (no thumbnail)
                          </div>
                        )}
                        <div className="p-2">
                          {!pickThumbnail && (
                            <video
                              controls
                              controlsList="nodownload"
                              playsInline
                              preload="metadata"
                              className="w-full rounded bg-black text-sm"
                              src={videoProxyUrl(proxyPath!)}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (canSelect) {
                                onChange(valueToSave)
                                setModalOpen(false)
                              }
                            }}
                            disabled={pickThumbnail && !thumbPath}
                            className="mt-2 w-full rounded bg-blue-600 text-white py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pickThumbnail ? 'Use this thumbnail' : 'Use this video'}
                          </button>
                        </div>
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

/** Grouped picker: one search button, sets both proxy path and thumbnail path from the selected clip. Use labels for Video or Trailer. */
export type AirflowVideoAndThumbnailPickerProps = {
  valueVideo: string
  valueThumbnail: string
  onChangeVideo: (path: string) => void
  onChangeThumbnail: (path: string) => void
  className?: string
  /** Default: "Video Airflow Proxy Path" */
  labelVideo?: string
  /** Default: "Video Thumbnail Airflow Proxy Path" */
  labelThumbnail?: string
  /** Default: "Search & pick video" */
  buttonLabel?: string
  /** Default: "Search Airflow — Video & Thumbnail" */
  modalTitle?: string
}

export function AirflowVideoAndThumbnailPicker({
  valueVideo,
  valueThumbnail,
  onChangeVideo,
  onChangeThumbnail,
  className = '',
  labelVideo = 'Video Airflow Proxy Path',
  labelThumbnail = 'Video Thumbnail Airflow Proxy Path',
  buttonLabel = 'Search & pick video',
  modalTitle = 'Search Airflow — Video & Thumbnail',
}: AirflowVideoAndThumbnailPickerProps) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnyResult[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const clips = React.useMemo(() => results.filter(isClip), [results])

  const runSearch = useCallback(async () => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res1 = await fetch(`${API_BASE}/api/airflow/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          q: q.trim(),
          template: 'Meta Data Team',
          flags: {
            clips: true,
            files: true,
            images: true,
            markers: true,
            sequences: true,
            subclips: true,
          },
          payload: {},
        }),
      })
      const data1 = await res1.json().catch(async () => ({ raw: await res1.text() }))
      if (!res1.ok) throw new Error(`Search failed: HTTP ${res1.status}`)
      const cacheId = data1?.data?.cache_id
      if (!cacheId) throw new Error('No cache_id in response')

      const qs = 'start=0&max_results=50&wait_for_results=true&wait_timeout=31&sort_by=MODIFIED&sort_order=descending'
      const res2 = await fetch(`${API_BASE}/api/airflow/search/${encodeURIComponent(cacheId)}?${qs}`)
      const data2 = await res2.json().catch(async () => ({ raw: await res2.text() }))
      if (!res2.ok) throw new Error(`Results failed: HTTP ${res2.status}`)
      setResults((data2 as any)?.data?.results ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [q])

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {buttonLabel}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{labelVideo}</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={valueVideo}
            readOnly
            placeholder="No video selected"
            className="flex-1 min-w-[120px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm"
          />
          {valueVideo ? (
            <button type="button" onClick={() => onChangeVideo('')} className="text-sm text-red-600 dark:text-red-400 hover:underline">
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{labelThumbnail}</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={valueThumbnail}
            readOnly
            placeholder="No thumbnail selected"
            className="flex-1 min-w-[120px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm"
          />
          {valueThumbnail ? (
            <button type="button" onClick={() => onChangeThumbnail('')} className="text-sm text-red-600 dark:text-red-400 hover:underline">
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pick Airflow video and thumbnail"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {modalTitle}
              </h3>
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
                  e.stopPropagation()
                  runSearch()
                }
              }}
                placeholder="Search (e.g. g001234)"
                className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={loading || !q.trim()}
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
              {clips.length === 0 && !loading && (
                <p className="text-sm text-gray-500">
                  {results.length === 0 ? 'Run a search to see clips.' : 'No clips in results.'}
                </p>
              )}
              {clips.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {clips.map((r, idx) => {
                    const d = (r as any).data
                    const baseName = d?.display_name ?? d?.metadata?.clip_name ?? `clip-${idx}`
                    const fileExt = d?.display_fileext
                    const name = fileExt ? `${baseName}.${fileExt}` : baseName
                    const thumbPath = d?.asset?.thumbnail_path ?? ''
                    const proxyPath = d?.proxy_path as string | undefined
                    if (!proxyPath) return null
                    return (
                      <div
                        key={d?.clip_id ?? idx}
                        className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                      >
                        <div className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 text-sm truncate" title={name}>
                          {name}
                        </div>
                        <div className="p-2">
                          <video
                            controls
                            controlsList="nodownload"
                            playsInline
                            preload="metadata"
                            className="w-full rounded bg-black text-sm"
                            src={videoProxyUrl(proxyPath)}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onChangeVideo(proxyPath)
                              onChangeThumbnail(thumbPath)
                              setModalOpen(false)
                            }}
                            className="mt-2 w-full rounded bg-blue-600 text-white py-1.5 text-sm hover:bg-blue-700"
                          >
                            Use this video
                          </button>
                        </div>
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
