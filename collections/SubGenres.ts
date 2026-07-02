import type { CollectionConfig } from 'payload'

export const SubGenres: CollectionConfig = {
  slug: 'subGenres',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'genre', 'updatedAt'],
    listSearchableFields: ['name', 'slug'],
    description: 'Reusable sub-genre names. A sub-genre may optionally belong to a genre.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Sub-genre name' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL-safe sub-genre key, e.g. science-technology' },
    },
    {
      name: 'genre',
      type: 'relationship',
      relationTo: 'genres',
      required: false,
      admin: { description: 'Optional parent genre' },
    },
  ],
}
