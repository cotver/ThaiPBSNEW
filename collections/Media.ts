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
        staticDir: process.env.PAYLOAD_MEDIA_DIR || '../payload-uploads/media',
        mimeTypes: ['image/*'],
        // pasteURL is left at Payload's default (browser-side fetch). Do not add a
        // wildcard allowList: Payload skips its SSRF filter for allow-listed URLs
        // and the paste-url endpoint returns the fetched body, which would let CMS
        // users read internal services. If a CORS-blocked host must be supported,
        // allow-list that exact public hostname only.
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
