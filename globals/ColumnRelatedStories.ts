import type { GlobalConfig } from 'payload'
import { relatedStoriesField } from '../collections/RelatedStoryFields.ts'

export const ColumnRelatedStories: GlobalConfig = {
  slug: 'column-related-stories',
  label: 'Global Related Stories',
  admin: { group: 'Column', description: 'These stories appear first on every article page.' },
  access: {
    read: () => true,
    update: ({ req }) => {
      const role = (req.user as { role?: string } | null)?.role
      return role === 'super-admin' || role === 'writer'
    },
  },
  fields: [relatedStoriesField],
}
