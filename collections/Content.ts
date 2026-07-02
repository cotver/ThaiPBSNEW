import type { CollectionConfig } from 'payload'

export const Content: CollectionConfig = {
      slug: 'content',
      admin: {
        useAsTitle: 'titleTh',
        defaultColumns: ['slug', 'titleTh', 'titleEn', 'updatedAt'],
        description: 'Content with Thai/English titles and topic sections.',
      },
      access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
      },
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: false,
          unique: true,
          admin: { description: 'URL path (e.g. topic). Used in /content/[slug]. Leave empty to use ID in URL.' },
        },
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
          name: 'topicSections',
          type: 'array',
          admin: { description: 'Addable topic blocks (Topic + Content per language)' },
          labels: { singular: 'Topic section', plural: 'Topic sections' },
          fields: [
            { name: 'topicTh', type: 'text', required: false, admin: { description: 'Topic (Thai)' } },
            { name: 'topicEn', type: 'text', required: false, admin: { description: 'Topic (English)' } },
            { name: 'contentTh', type: 'textarea', required: false, admin: { description: 'Content (Thai)' } },
            { name: 'contentEn', type: 'textarea', required: false, admin: { description: 'Content (English)' } },
          ],
        },
        {
          name: 'contentTh',
          type: 'richText',
          required: false,
          admin: { description: 'Main content (Thai)' },
        },
        {
          name: 'contentEn',
          type: 'richText',
          required: false,
          admin: { description: 'Main content (English)' },
        },
      ],
    }
