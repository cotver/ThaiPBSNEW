import type { Field } from 'payload'

/** Shared editor for stories pinned to the article sidebar. Row order is display order. */
export const relatedStoriesField: Field = {
  name: 'relatedStories',
  label: 'Related Stories',
  type: 'array',
  labels: { singular: 'Related Story', plural: 'Related Stories' },
  admin: { description: 'Shown before automatic recommendations. Drag rows to set their order.' },
  fields: [
    {
      name: 'kind',
      label: 'Story type',
      type: 'select',
      required: true,
      defaultValue: 'article',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Custom link', value: 'custom' },
      ],
    },
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'column-articles',
      filterOptions: { _status: { equals: 'published' } },
      admin: { condition: (_data, siblingData) => siblingData?.kind === 'article' },
      validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) =>
        siblingData?.kind !== 'article' || value ? true : 'Choose an article.',
    },
    {
      name: 'title',
      type: 'text',
      admin: { condition: (_data, siblingData) => siblingData?.kind === 'custom' },
      validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) =>
        siblingData?.kind !== 'custom' || (typeof value === 'string' && value.trim())
          ? true : 'Enter a title.',
    },
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      admin: { condition: (_data, siblingData) => siblingData?.kind === 'custom' },
      validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
        if (siblingData?.kind !== 'custom') return true
        if (typeof value !== 'string' || !value.trim()) return 'Enter a URL.'
        if (value.startsWith('/') && !value.startsWith('//')) return true
        try {
          const parsed = new URL(value)
          return ['http:', 'https:'].includes(parsed.protocol) ? true : 'Use an HTTP(S) URL or a path starting with /.'
        } catch {
          return 'Use an HTTP(S) URL or a path starting with /.'
        }
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'column-media',
      admin: { condition: (_data, siblingData) => siblingData?.kind === 'custom' },
      validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) =>
        siblingData?.kind !== 'custom' || value ? true : 'Choose an image.',
    },
  ],
}
