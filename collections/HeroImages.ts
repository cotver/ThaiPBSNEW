import type { CollectionConfig } from 'payload'

export const HeroImages: CollectionConfig = {
  slug: 'heroImages',
  orderable: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'eyebrow', 'image', 'showDetails', 'isActive', 'updatedAt'],
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
      required: true,
      admin: { description: 'Small label above the title, e.g. ThaiPBS Parvilions Original' },
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
      required: true,
      admin: { description: 'Year or short date label shown in the metadata line' },
    },
    {
      name: 'rating',
      type: 'text',
      required: true,
      admin: { description: 'Rating label, e.g. ALL Age, 13+, 18+' },
    },
    {
      name: 'duration',
      type: 'text',
      required: true,
      admin: { description: 'Duration label, e.g. 48m, Series, Movie' },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: { description: 'Hero synopsis text' },
    },
    {
      name: 'genre',
      type: 'text',
      required: true,
      admin: { description: 'Genre or category line shown below synopsis' },
    },
    {
      name: 'primaryLabel',
      type: 'text',
      defaultValue: 'Play',
      admin: { description: 'Primary button label' },
    },
    {
      name: 'primaryLink',
      type: 'text',
      admin: { description: 'Primary button URL. Use /title/example or https://...' },
    },
    {
      name: 'secondaryLabel',
      type: 'text',
      defaultValue: 'Details',
      admin: { description: 'Secondary button label' },
    },
    {
      name: 'secondaryLink',
      type: 'text',
      admin: { description: 'Secondary button URL. Use /title/example or https://...' },
    },
    {
      name: 'showDetails',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show left side shadow, text details, and buttons' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show this slide on the homepage hero' },
    },
  ],
}
