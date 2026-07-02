import type { CollectionConfig } from 'payload'
import {
  enforceReadyForSaleOnlyForIpPrograms,
  normalizeSeasonAwardDetails,
  stampSeasonAwardUpdatedAt,
  syncProgramAwardFlagAfterSeasonChange,
  syncProgramAwardFlagAfterSeasonDelete,
  validateNonNegativePrice,
} from './hooks.ts'

export const Seasons: CollectionConfig = {
      slug: 'seasons',
      admin: {
        hidden: true,
        useAsTitle: '_displayTitle',
        defaultColumns: ['program', 'season', 'seasonName', 'updatedAt'],
        description: 'Programs > Seasons',
      },
      hooks: {
        beforeValidate: [normalizeSeasonAwardDetails],
        beforeChange: [enforceReadyForSaleOnlyForIpPrograms, stampSeasonAwardUpdatedAt],
        afterChange: [syncProgramAwardFlagAfterSeasonChange],
        afterDelete: [syncProgramAwardFlagAfterSeasonDelete],
      },
      fields: [
        {
          name: 'program',
          type: 'relationship',
          relationTo: 'programs',
          required: true,
          admin: { description: 'Parent program' },
        },
        {
          name: 'season',
          type: 'number',
          admin: { description: 'Season number' },
        },
        {
          name: 'seasonName',
          type: 'text',
          admin: { description: 'Season name (Thai)' },
        },
        {
          name: 'seasonNameEn',
          type: 'text',
          admin: { description: 'Season name (English)' },
        },
        { name: 'is_Award', type: 'checkbox', admin: { description: 'Is Award' } },
        {
          name: 'awards',
          type: 'array',
          labels: { singular: 'Award', plural: 'Awards' },
          admin: {
            description: 'Awards received by this season',
            condition: (_data, siblingData) =>
              Boolean(siblingData?.is_Award) ||
              (Array.isArray(siblingData?.awards) && siblingData.awards.length > 0),
          },
          fields: [
            {
              name: 'awardName',
              type: 'relationship',
              relationTo: 'awards' as any,
              admin: { description: 'Award name' },
            },
            {
              name: 'awardYear',
              type: 'number',
              required: true,
              admin: { description: 'Year received' },
              validate: (val: unknown) =>
                typeof val === 'number' && Number.isInteger(val) && val >= 0
                  ? true
                  : 'Must be a non-negative integer',
            },
            { name: 'awardDetail', type: 'richText', admin: { description: 'Award detail' } },
            {
              name: 'awardUpdatedAt',
              type: 'date',
              admin: {
                description: 'Updated date/time for this award row',
                readOnly: true,
                date: { pickerAppearance: 'dayAndTime', timeIntervals: 5 },
              },
            },
          ],
        },
        { name: 'hasCc', type: 'checkbox', defaultValue: false, admin: { description: 'Has CC (closed captions)' } },
        {
          name: 'languages',
          type: 'relationship',
          relationTo: 'languages' as any,
          hasMany: true,
          admin: {
            description: 'CC languages supported (multi-select dropdown)',
            condition: (_data, siblingData) =>
              Boolean(siblingData?.hasCc) || (Array.isArray(_data) && _data.length > 0),
          },
        },
        { name: 'hasSoundtrack', type: 'checkbox', defaultValue: false, admin: { description: 'Has soundtrack' } },
        {
          name: 'languagesSoundtrack',
          type: 'relationship',
          relationTo: 'languages' as any,
          hasMany: true,
          admin: {
            description: 'Soundtrack languages supported (multi-select dropdown)',
            condition: (_data, siblingData) =>
              Boolean(siblingData?.hasSoundtrack) || (Array.isArray(_data) && _data.length > 0),
          },
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
          name: 'synopsisTh',
          type: 'textarea',
          admin: { description: 'Synopsis (Thai)' },
        },
        {
          name: 'synopsisEn',
          type: 'textarea',
          admin: { description: 'Synopsis (English)' },
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
          name: 'sellPricing',
          type: 'group',
          admin: {
            description: 'One-to-one sell price settings for this season. Use Ready for Sale only when the parent program is IP.',
          },
          fields: [
            {
              name: 'readyForSale',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Show this season as ready for sale. This is allowed only when the parent program is IP.' },
            },
            {
              name: 'formatPrices',
              type: 'array',
              labels: { singular: 'Format price', plural: 'Format prices' },
              admin: { description: 'Set one sell price per video format.' },
              fields: [
                {
                  name: 'format',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'HD', value: 'HD' },
                    { label: 'UHD 4K', value: 'UHD 4K' },
                  ],
                },
                {
                  name: 'price',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { description: 'Sell price for this format.', step: 0.01 },
                  validate: validateNonNegativePrice,
                },
              ],
            },
            {
              name: 'hasCc',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'This sell package includes closed captions.' },
            },
            {
              name: 'ccLanguagePrices',
              type: 'array',
              labels: { singular: 'CC language price', plural: 'CC language prices' },
              admin: {
                description: 'Set an extra or included price for each CC language.',
                condition: (_data, siblingData) => Boolean(siblingData?.hasCc),
              },
              fields: [
                {
                  name: 'language',
                  type: 'relationship',
                  relationTo: 'languages' as any,
                  required: true,
                  admin: { description: 'CC language.' },
                },
                {
                  name: 'price',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { description: 'Price for this CC language.', step: 0.01 },
                  validate: validateNonNegativePrice,
                },
              ],
            },
            {
              name: 'hasAd',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'This sell package includes AD.' },
            },
            {
              name: 'adPrice',
              type: 'number',
              min: 0,
              admin: {
                description: 'Price when AD is included.',
                condition: (_data, siblingData) => Boolean(siblingData?.hasAd),
                step: 0.01,
              },
              validate: validateNonNegativePrice,
            },
          ],
        },
        {
          name: '_displayTitle',
          type: 'text',
          admin: {
            hidden: true,
            description: 'Computed: Season label for admin list',
          },
          hooks: {
            beforeChange: [
              ({ siblingData }) => {
                const season = siblingData?.season
                const seasonName = (siblingData?.seasonName ?? '').toString().trim()
                if (season != null) {
                  return seasonName ? `Season ${season} - ${seasonName}` : `Season ${season}`
                }
                return seasonName || ''
              },
            ],
          },
        },
        {
          name: 'episodes',
          type: 'relationship',
          relationTo: 'episodes',
          hasMany: true,
          admin: { description: 'Episodes in this season' },
        },
      ],
    }
