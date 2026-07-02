import type { CollectionConfig } from 'payload'

export const Trends: CollectionConfig = {
      slug: 'trends',
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['type', 'title', 'link', 'image', 'boxHeight', 'updatedAt'],
        description: 'Trending items (image + title + link). Image required for Others only.',
      },
      access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          admin: { description: 'Social platform. Image is required only for Others.' },
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'X', value: 'x' },
            { label: 'Others', value: 'others' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: false,
          admin: { description: 'Trend title' },
        },
        {
          name: 'link',
          type: 'text',
          required: true,
          admin: { description: 'Destination URL', placeholder: 'https://...' },
          validate: (val: unknown) => {
            const raw = (val ?? '').toString().trim()
            if (!raw) return 'Required'
            try {
              const u = new URL(raw)
              return u.protocol === 'http:' || u.protocol === 'https:' ? true : 'URL must start with http(s)://'
            } catch {
              return 'Must be a valid URL'
            }
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: false,
          admin: { description: 'Trend image (from Media). Required for Others only.' },
          validate: (val: unknown, { siblingData }: { siblingData?: { type?: string } }) => {
            const type = siblingData?.type
            if (type !== 'others') return true
            const hasImage = val != null && (typeof val !== 'object' || (val as { id?: unknown })?.id != null)
            return hasImage ? true : 'Image is required for Others'
          },
        },
        {
          name: 'boxHeight',
          type: 'number',
          required: false,
          admin: {
            description: 'Height of the trend box in pixels. Leave empty for default (auto height).',
            step: 1,
          },
          min: 0,
        },
      ],
    }
