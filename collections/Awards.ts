import type { CollectionConfig } from 'payload'

export const Awards: CollectionConfig = {
      slug: 'awards',
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'updatedAt'],
        description: 'Award names that can be selected in program seasons.',
      },
      access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
      },
      fields: [
        { name: 'name', type: 'text', required: true, unique: true, admin: { description: 'Award name' } },
      ],
    }
