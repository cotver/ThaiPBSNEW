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
    defaultColumns: [
      'name',
      'slug',
      'icon',
      'link',
      'showHeaderSection',
      'showTitle',
      'postRoom',
      'appShellActive',
      'image',
      'video',
      'updatedAt',
    ],
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
      name: 'showHeaderSection',
      label: 'Show header section',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show the header section on this category page' },
    },
    {
      name: 'showTitle',
      label: 'Show Title',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show the category title in the header section' },
    },
    {
      name: 'postRoom',
      label: 'Post Room',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Enable Post Room images for this category' },
    },
    {
      name: 'postRoomGroups',
      label: 'Post Room groups',
      type: 'array',
      labels: {
        singular: 'Post Room group',
        plural: 'Post Room groups',
      },
      admin: {
        description: 'Add image groups for Post Room',
        condition: (_data, siblingData) =>
          Boolean(siblingData?.postRoom) ||
          (Array.isArray(siblingData?.postRoomGroups) && siblingData.postRoomGroups.length > 0),
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: { description: 'Group title' },
        },
        {
          name: 'coverImage',
          label: 'Group cover image',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Cover image shown before opening the group' },
        },
        {
          name: 'images',
          type: 'array',
          labels: {
            singular: 'Image',
            plural: 'Images',
          },
          admin: { description: 'Images inside this Post Room group' },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'Post Room image' },
            },
          ],
        },
      ],
    },
    {
      name: 'link',
      type: 'text',
      admin: { description: 'Optional URL. If set, AppShell navigation opens this link instead of the category page.' },
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
      admin: { description: 'Show this category in brand tiles' },
    },
    {
      name: 'appShellActive',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show this category in the AppShell navigation' },
    },
  ],
}
