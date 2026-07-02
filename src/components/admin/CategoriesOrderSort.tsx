'use client'

import { useListQuery } from '@payloadcms/ui'
import { useEffect } from 'react'

export const CategoriesOrderSort = () => {
  const { query, refineListData } = useListQuery()

  useEffect(() => {
    if (query?.sort === '_order' || query?.sort === '-_order') return

    void refineListData({
      page: 1,
      sort: '_order',
    })
  }, [query?.sort, refineListData])

  return null
}
