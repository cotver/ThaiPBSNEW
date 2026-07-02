import type { CollectionConfig } from 'payload'

const categoryIconOptions = [
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

export const Categories: CollectionConfig = {
  slug: 'categories',
  orderable: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'icon', 'image', 'video', 'updatedAt'],
    listSearchableFields: ['name'],
    pagination: {
      defaultLimit: 1000,
      limits: [10, 25, 50, 100, 250, 500, 1000],
    },
    components: {
      beforeList: ['@/components/admin/CategoriesOrderSort#CategoriesOrderSort'],
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
      admin: { description: 'Category name' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL-safe category key, e.g. news, movies, kids' },
    },
    {
      name: 'icon',
      type: 'select',
      admin: { description: 'Optional icon shown in navigation and category cards' },
      options: categoryIconOptions,
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
      admin: { description: 'Category image / poster / thumbnail' },
    },
    {
      name: 'video',
      type: 'relationship',
      relationTo: 'videos',
      admin: { description: 'Short video or GIF-style loop from Videos collection' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Legacy numeric order. Use drag-and-drop on the Categories list to change display order.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show this category on the website' },
    },
  ],
}
