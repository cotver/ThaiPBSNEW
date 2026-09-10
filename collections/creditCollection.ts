import type { CollectionConfig } from 'payload'

type CreditCollectionOptions = {
  singular: string
  plural: string
  programField: 'producers' | 'directors' | 'artists' | 'writers'
  slug: 'producers' | 'directors' | 'artists' | 'writers'
}

export function createCreditCollection({
  singular,
  plural,
  programField,
  slug,
}: CreditCollectionOptions): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      useAsTitle: 'name',
      defaultColumns: ['image', 'nameTh', 'nameEn', 'programs', 'updatedAt'],
      listSearchableFields: ['name', 'nameTh', 'nameEn'],
      description: `${plural} that can be related to multiple programs.`,
    },
    access: {
      read: () => true,
      create: ({ req }) => Boolean(req.user),
      update: ({ req }) => Boolean(req.user),
      delete: ({ req }) => Boolean(req.user),
    },
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        admin: { description: `${singular} image` },
      },
      {
        name: 'name',
        type: 'text',
        required: true,
        index: true,
        admin: {
          hidden: true,
          description: 'Computed from English name, falling back to Thai name.',
        },
        hooks: {
          beforeValidate: [
            ({ siblingData }) => {
              const nameEn = String(siblingData?.nameEn ?? '').trim()
              const nameTh = String(siblingData?.nameTh ?? '').trim()
              return nameEn || nameTh
            },
          ],
        },
      },
      {
        name: 'nameTh',
        label: 'Name (Thai)',
        type: 'text',
        admin: { description: `${singular} name in Thai` },
      },
      {
        name: 'nameEn',
        label: 'Name (English)',
        type: 'text',
        admin: { description: `${singular} name in English` },
      },
      {
        name: 'descriptionTh',
        label: 'Description (Thai)',
        type: 'textarea',
      },
      {
        name: 'descriptionEn',
        label: 'Description (English)',
        type: 'textarea',
      },
      {
        name: 'programs',
        type: 'join',
        collection: 'programs',
        on: programField,
        admin: {
          allowCreate: false,
          defaultColumns: ['programId', 'titleTh', 'titleEn', 'updatedAt'],
          description: `Programs related to this ${singular.toLowerCase()}.`,
        },
      },
    ],
  }
}
