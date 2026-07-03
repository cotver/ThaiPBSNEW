import type { CollectionConfig } from 'payload'

export const HeroImages: CollectionConfig = {
  slug: 'heroImages',
  orderable: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'image', 'genre', 'subGenre', 'showDetails', 'isActive', 'updatedAt'],
    listSearchableFields: ['title', 'eyebrow', 'description'],
    pagination: {
      defaultLimit: 100,
      limits: [10, 25, 50, 100, 250],
    },
    description: 'Homepage hero slides shown before program-generated hero slides.',
  },
  defaultSort: '_order',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Main hero title' },
    },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Small label above the title, e.g. ThaiPBS Category' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Hero background image' },
    },
    {
      name: 'year',
      type: 'text',
      admin: { description: 'Year or short date label shown in the metadata line' },
    },
    {
      name: 'rating',
      type: 'text',
      admin: { description: 'Rating label, e.g. ALL Age, 13+, 18+' },
    },
    {
      name: 'duration',
      type: 'text',
      admin: { description: 'Duration label, e.g. 48m, Series, Movie' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Hero synopsis text' },
    },
    {
      name: 'genre',
      type: 'relationship',
      relationTo: 'genres',
      hasMany: true,
      admin: { description: 'Genres shown below synopsis' },
    },
    {
      name: 'subGenre',
      type: 'relationship',
      relationTo: 'subGenres',
      hasMany: true,
      admin: { description: 'Sub-genres shown below synopsis' },
    },
    {
      name: 'showDetails',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show left side shadow and text details' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show this slide on the homepage hero' },
    },
  ],
}
