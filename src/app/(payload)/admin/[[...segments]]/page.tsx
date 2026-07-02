import config from '@payload-config'
import { RootPage } from '@payloadcms/next/views'
import React from 'react'

import { importMap } from '../importMap.js'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const Page = async ({ params, searchParams }: Args) => {
  const normalizedParams = params.then((value) => ({
    segments: value.segments?.length ? value.segments : undefined,
  }))
  const normalizedSearchParams = searchParams.then((value) =>
    Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string | string[]] => entry[1] !== undefined),
    ),
  )

  return (
    <RootPage
      config={config}
      importMap={importMap}
      params={normalizedParams as Promise<{ segments: string[] }>}
      searchParams={normalizedSearchParams}
    />
  )
}

export default Page
