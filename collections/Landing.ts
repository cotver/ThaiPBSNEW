import type { CollectionConfig } from 'payload'

export const Landing: CollectionConfig = {
      slug: 'landing',
      admin: {
        useAsTitle: 'title',
        description: 'Landing page settings (hero background image).',
      },
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          defaultValue: 'Landing',
          admin: { description: 'Label for this settings document (e.g. "Landing")' },
        },
        {
          name: 'heroImage',
          type: 'upload',
          relationTo: 'media',
          required: false,
          admin: { description: 'Background image for the landing page (one per row; multiple rows = loop)' },
        },
      ],
    }
