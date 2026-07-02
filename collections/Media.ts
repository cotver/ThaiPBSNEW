import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
      slug: 'media',
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'alt', 'filename', 'updatedAt'],
      },
      access: {
        read: () => true,
      },
      upload: {
        staticDir: process.env.PAYLOAD_MEDIA_DIR || './payload-uploads/media',
        mimeTypes: ['image/*'],
        // Enable server-side paste URL so pasting external URLs works when client fetch
        // fails (e.g. CORS). Empty hostname lets any host for that protocol.
        pasteURL: {
          allowList: [
            { protocol: 'https', hostname: '' },
            { protocol: 'http', hostname: '' },
          ],
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: { description: 'Title for the media' },
        },
        {
          name: 'alt',
          type: 'text',
          admin: { description: 'Alt text for the image' },
        },
      ],
    }
