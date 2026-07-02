import type { CollectionConfig } from 'payload'

export const Languages: CollectionConfig = {
      slug: 'languages',
      admin: {
        useAsTitle: 'label',
        defaultColumns: ['code', 'label', 'updatedAt'],
        description: 'Language list (used as multi-select dropdown in seasons).',
      },
      access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
      },
      fields: [
        { name: 'code', type: 'text', required: true, unique: true, admin: { description: 'Short code (e.g. th, en, my)' } },
        { name: 'label', type: 'text', required: false, admin: { description: 'Display label (optional, e.g. Thai, English)' } },
      ],
    }
