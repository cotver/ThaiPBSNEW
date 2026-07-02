import type { CollectionConfig } from 'payload'

export const Header: CollectionConfig = {
      slug: 'header',
      admin: {
        useAsTitle: 'titleTh',
        defaultColumns: ['titleTh', 'titleEn', 'updatedAt'],
        description: 'Header with title and multiple items (link or content).',
      },
      access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
      },
      fields: [
        {
          name: 'titleTh',
          type: 'text',
          required: false,
          admin: { description: 'Title (Thai)' },
        },
        {
          name: 'titleEn',
          type: 'text',
          required: false,
          admin: { description: 'Title (English)' },
        },
        {
          name: 'items',
          type: 'array',
          admin: { description: 'Header items: each row is either a link or a content from the Content collection.' },
          labels: { singular: 'Item', plural: 'Items' },
          fields: [
            {
              name: 'itemType',
              type: 'select',
              required: true,
              admin: { description: 'Choose Link or Content' },
              options: [
                { label: 'Link', value: 'link' },
                { label: 'Content', value: 'content' },
              ],
            },
            {
              name: 'linkUrl',
              type: 'text',
              required: false,
              admin: {
                description: 'URL for the link (e.g. https://... or /path)',
                condition: (_, siblingData) => siblingData?.itemType === 'link',
              },
            },
            {
              name: 'linkLabelTh',
              type: 'text',
              required: false,
              admin: {
                description: 'Link label (Thai)',
                condition: (_, siblingData) => siblingData?.itemType === 'link',
              },
            },
            {
              name: 'linkLabelEn',
              type: 'text',
              required: false,
              admin: {
                description: 'Link label (English)',
                condition: (_, siblingData) => siblingData?.itemType === 'link',
              },
            },
            {
              name: 'content',
              type: 'relationship',
              relationTo: 'content',
              required: false,
              admin: {
                description: 'Select a Content document',
                condition: (_, siblingData) => siblingData?.itemType === 'content',
              },
            },
          ],
        },
      ],
    }
