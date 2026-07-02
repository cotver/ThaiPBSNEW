import config from '@payload-config'
import { NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

export default async function NotFound() {
  return NotFoundPage({
    config: Promise.resolve(config),
    importMap,
    params: Promise.resolve({ segments: [] }),
    searchParams: Promise.resolve({}),
  })
}
