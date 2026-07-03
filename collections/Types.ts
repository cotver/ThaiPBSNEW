import type { CollectionConfig } from 'payload'

const typeIconOptions = [
  { label: 'Home', value: 'home' },
  { label: 'Search', value: 'search' },
  { label: 'Plus', value: 'plus' },
  { label: 'Spark', value: 'spark' },
  { label: 'Film', value: 'film' },
  { label: 'Screen', value: 'screen' },
  { label: 'News', value: 'news' },
  { label: 'Music', value: 'music' },
  { label: 'Food', value: 'food' },
  { label: 'Travel', value: 'travel' },
  { label: 'Kids', value: 'kids' },
  { label: 'Education', value: 'education' },
]

export const Types: CollectionConfig = {
  slug: 'types',
  orderable: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'icon', 'image', 'video', 'link', 'updatedAt'],
    listSearchableFields: ['name'],
    pagination: {
      defaultLimit: 1000,
      limits: [10, 25, 50, 100, 250, 500, 1000],
    },
  },
  defaultSort: '_order',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Type name' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL-safe type key, e.g. documentary, kids, drama' },
    },
    {
      name: 'icon',
      type: 'select',
      admin: { description: 'Optional icon shown in navigation' },
      options: typeIconOptions,
    },
    {
      name: 'iconExamples',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/CategoryIconExamples#CategoryIconExamples',
        },
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Type image / poster / thumbnail' },
    },
    {
      name: 'video',
      type: 'relationship',
      relationTo: 'videos',
      admin: { description: 'Short video or GIF-style loop from Videos collection' },
    },
    {
      name: 'link',
      type: 'relationship',
      relationTo: 'programs',
      hasMany: true,
      admin: { description: 'Programs connected to this type' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Legacy numeric order. Use drag-and-drop on the Types list to change display order.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show this type on the website navigation' },
    },
  ],
}
