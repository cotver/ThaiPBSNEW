import type { CollectionConfig } from 'payload'

export const Episodes: CollectionConfig = {
      slug: 'episodes',
      admin: {
        hidden: true,
        useAsTitle: '_displayTitle',
        defaultColumns: ['season', 'ep', 'epNameTh', 'epNameEn', 'updatedAt'],
        description: 'Programs > Seasons > Episodes',
      },
      fields: [
        {
          name: 'season',
          type: 'relationship',
          relationTo: 'seasons',
          required: true,
          admin: { description: 'Parent season' },
        },
        {
          name: 'ep',
          type: 'number',
          admin: { description: 'Episode number or code' },
        },
        {
          name: 'epNameTh',
          type: 'text',
          admin: { description: 'Episode name (Thai)' },
        },
        {
          name: 'epNameEn',
          type: 'text',
          admin: { description: 'Episode name (English)' },
        },
        {
          name: 'comingSoon',
          type: 'checkbox',
          admin: { description: 'Coming soon' },
        },
        {
          name: 'comingSoonDate',
          type: 'date',
          admin: { description: 'Date when this becomes available (when coming soon)' },
        },
        {
          name: 'firstRun',
          type: 'date',
          admin: {
            description: 'First run date and time',
            date: { pickerAppearance: 'dayAndTime', timeIntervals: 15 },
          },
        },
        {
          name: 'rerunDates',
          type: 'array',
          admin: { description: 'Rerun dates and times (multiple allowed)' },
          fields: [
            {
              name: 'date',
              type: 'date',
              required: false,
              admin: { date: { pickerAppearance: 'dayAndTime', timeIntervals: 15 } },
            },
          ],
        },
        {
          name: 'synopsisEpTh',
          type: 'textarea',
          admin: { description: 'Episode synopsis (Thai)' },
        },
        {
          name: 'synopsisEpEn',
          type: 'textarea',
          admin: { description: 'Episode synopsis (English)' },
        },
        {
          name: 'coverImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Cover image' },
        },
        { name: 'trailer', type: 'relationship', relationTo: 'videos', admin: { description: 'Trailer video (from Videos collection)' } },
        { name: 'video', type: 'relationship', relationTo: 'videos', admin: { description: 'Main video (from Videos collection)' } },
        {
          name: 'TrailerAirflowProxyPath',
          type: 'text',
          admin: { description: 'Trailer Airflow Proxy Path' },
        },
        {
          name: 'TrailerThumbnailAirflowProxyPath',
          type: 'text',
          admin: { description: 'Trailer Thumbnail Airflow Proxy Path (same search as trailer path, saves thumbnail path)' },
        },
        {
          name: 'videoAirflowProxyPath',
          type: 'text',
          admin: { description: 'video Airflow Proxy Path' },
        },
        {
          name: 'videoThumbnailAirflowProxyPath',
          type: 'text',
          admin: { description: 'Video Thumbnail Airflow Proxy Path (same search as video path, saves thumbnail path)' },
        },
        { name: 'videoLink', type: 'text', admin: { description: 'Video link (URL)' } },
        { name: 'trailerLink', type: 'text', admin: { description: 'Trailer link (URL)' } },
        {
          name: '_displayTitle',
          type: 'text',
          admin: {
            hidden: true,
            description: 'Computed: E{ep} - name for admin list',
          },
          hooks: {
            beforeChange: [
              ({ siblingData }) => {
                const ep = siblingData?.ep
                const epNameTh = (siblingData?.epNameTh ?? '').toString().trim()
                const epNameEn = (siblingData?.epNameEn ?? '').toString().trim()
                const name = epNameTh || epNameEn || ''
                if (ep != null) {
                  return name ? `E${ep} - ${name}` : `E${ep}`
                }
                return name || ''
              },
            ],
          },
        },
      ],
    }
