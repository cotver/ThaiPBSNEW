import type { CollectionConfig } from 'payload'

export const Videos: CollectionConfig = {
      slug: 'videos',
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'alt', 'filename', 'updatedAt'],
      },
      access: {
        read: () => true,
      },
      upload: {
        staticDir: process.env.PAYLOAD_VIDEOS_DIR || '../payload-uploads/videos',
        mimeTypes: ['video/*', 'image/gif'],
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: { description: 'Title for the video' },
        },
        {
          name: 'alt',
          type: 'text',
          admin: { description: 'Alt text / description for the video (accessibility)' },
        },
      ],
    }
