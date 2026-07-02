'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import React, { useCallback } from 'react'
import { PER_PAGE_MAX, PER_PAGE_MIN, PER_PAGE_OPTIONS } from './programsManagerListConstants'

export type ProgramsManagerPerPageSelectProps = {
  limit: number
}

export function ProgramsManagerPerPageSelect({ limit }: ProgramsManagerPerPageSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value)
      if (value < PER_PAGE_MIN || value > PER_PAGE_MAX) return
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set('limit', String(value))
      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, searchParams, router]
  )

  const options = [...new Set([...PER_PAGE_OPTIONS, limit])].sort((a, b) => a - b)

  return (
    <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
      <span>Per page</span>
      <select
        value={limit}
        onChange={handleChange}
        className="min-w-20 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        aria-label="Programs per page"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  )
}
