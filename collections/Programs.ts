import type { CollectionBeforeDeleteHook, CollectionConfig } from 'payload'
import {
  syncProgramTypeFlags,
} from './hooks.ts'

export const Programs: CollectionConfig = {
      slug: 'programs',
      admin: {
        useAsTitle: '_displayTitle',
        defaultColumns: ['programId', 'titleTh', 'titleEn', 'programContentType', 'createdAt', 'updatedAt'],
        listSearchableFields: ['programId', 'titleTh', 'titleEn', '_displayTitle'],
      },
      hooks: {
        beforeChange: [syncProgramTypeFlags],
        beforeDelete: [
          (async ({ id, req }) => {
            const seasonsResult = await req.payload.find({
              collection: 'seasons',
              where: { program: { equals: id } },
              limit: 5000,
              depth: 0,
              overrideAccess: true,
              req,
            })
            const seasons = seasonsResult.docs ?? []
            for (const season of seasons) {
              const episodesResult = await req.payload.find({
                collection: 'episodes',
                where: { season: { equals: season.id } },
                limit: 5000,
                depth: 0,
                overrideAccess: true,
                req,
              })
              const episodes = episodesResult.docs ?? []
              for (const episode of episodes) {
                await req.payload.delete({
                  collection: 'episodes',
                  id: episode.id,
                  overrideAccess: true,
                  req,
                })
              }
              await req.payload.delete({
                collection: 'seasons',
                id: season.id,
                overrideAccess: true,
                req,
              })
            }
          }) as CollectionBeforeDeleteHook,
        ],
      },
      fields: [
        { name: 'programId', type: 'text', required: false, admin: { description: 'Program ID' } },
        {
          name: 'slug',
          type: 'text',
          required: true,
          admin: { description: 'URL path (e.g. my-program)' },
        },
        {
          name: 'titleTh',
          type: 'text',
          admin: { description: 'Title (Thai)' },
        },
        {
          name: 'titleEn',
          type: 'text',
          admin: { description: 'Title (English)' },
        },
        {
          name: '_displayTitle',
          type: 'text',
          admin: { hidden: true, description: 'Computed: titleTh or titleEn for admin list title' },
          hooks: {
            beforeChange: [
              ({ siblingData }) => {
                const titleTh = (siblingData?.titleTh ?? '').toString().trim()
                const titleEn = (siblingData?.titleEn ?? '').toString().trim()
                return titleTh || titleEn || ''
              },
            ],
          },
        },
        {
          name: 'programContentType',
          type: 'select',
          admin: { description: 'Program content type' },
          options: [
            { label: 'Series', value: 'Series' },
            { label: 'Movie', value: 'Movie' },
          ],
        },
        {
          name: 'categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: { description: 'Categories this program belongs to' },
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
          name: 'companyProduce',
          type: 'text',
          admin: { description: 'Company produce' },
        },
        {
          name: 'producer',
          type: 'text',
          admin: { description: 'Producer' },
        },
        {
          name: 'artist',
          type: 'text',
          admin: { description: 'Artist' },
        },
        {
          name: 'writer',
          type: 'text',
          admin: { description: 'Writer' },
        },
        {
          name: 'type',
          type: 'select',
          admin: { description: 'Program type' },
          options: [
            { label: 'Short Clip', value: 'Short Clip' },
            { label: 'Trailer', value: 'Trailer' },
            { label: 'PodCast', value: 'PodCast' },
            { label: 'Spot', value: 'Spot' },
            { label: 'Filler', value: 'Filler' },
            { label: 'Demo', value: 'Demo' },
            { label: 'Program', value: 'Program' },
            { label: 'Picture', value: 'Picture' },
            { label: 'Poster', value: 'Poster' },
            { label: 'Footage', value: 'Footage' },
          ],
        },
        {
          name: 'genre',
          type: 'relationship',
          relationTo: 'genres',
          hasMany: true,
          admin: { description: 'Genres' },
        },
        {
          name: 'programsType',
          type: 'relationship',
          relationTo: 'types',
          hasMany: true,
          admin: { description: 'Programs Type' },
        },
        {
          name: 'genre_sub',
          type: 'relationship',
          relationTo: 'subGenres',
          hasMany: true,
          admin: { description: 'Sub-genres' },
        },
        {
          name: 'tags',
          type: 'text',
          admin: { description: 'Tags (comma-separated or free text)' },
        },
        {
          name: 'comment',
          type: 'textarea',
          admin: { hidden: true, description: 'Comment' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Image' },
        },
        {
          name: 'coverImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Cover image' },
        },
        {
          name: 'trailer',
          type: 'relationship',
          relationTo: 'videos',
          admin: { description: 'Trailer video (from Videos collection)' },
        },
        {
          name: 'video',
          type: 'relationship',
          relationTo: 'videos',
          admin: { description: 'Main video (from Videos collection)' },
        },
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
          name: 'is_IP',
          type: 'checkbox',
          admin: { description: 'Is IP' },
        },
        {
          name: 'is_Feature',
          type: 'checkbox',
          admin: { description: 'Is Feature' },
        },
        { name: 'is_NEW', type: 'checkbox', admin: { description: 'Is NEW' } },
        { name: 'is_Schedule', type: 'checkbox', admin: { description: 'Is Schedule' } },
        { name: 'isNewHits', type: 'checkbox', admin: { description: 'Is New Hits' } },
        {
          name: 'is_Award',
          type: 'checkbox',
          admin: { hidden: true, description: 'Computed: checked when any season is award' },
        },
        { name: 'is_special_programs', type: 'checkbox', admin: { description: 'Is special programs' } },
        { name: 'is_old_series', type: 'checkbox', admin: { description: 'Is old series' } },
        { name: 'is_global_programs', type: 'checkbox', admin: { description: 'Is global programs' } },
        {
          name: 'is_global_international',
          type: 'checkbox',
          admin: {
            description: 'INTERNATIONAL',
            condition: (_data, siblingData) => Boolean(siblingData?.is_global_programs),
          },
        },
        {
          name: 'is_global_thai_dub',
          type: 'checkbox',
          admin: {
            description: 'Thai Dub',
            condition: (_data, siblingData) => Boolean(siblingData?.is_global_programs),
          },
        },
        { name: 'is_normal_programs', type: 'checkbox', defaultValue: true, admin: { description: 'Is normal programs' } },
        { name: 'is_Detail', type: 'checkbox', admin: { description: 'Is Detail' } },
        { name: 'hasSoundtrack', type: 'checkbox', admin: { description: 'Has soundtrack' } },
        { name: 'hasAd', type: 'checkbox', admin: { description: 'Has ad' } },
        { name: 'hasCc', type: 'checkbox', admin: { description: 'Has CC (closed captions)' } },
        { name: 'hasSl', type: 'checkbox', admin: { description: 'Has SL (sign language)' } },
        { name: 'hasBigSign', type: 'checkbox', admin: { description: 'Has BigSign' } },
        { name: 'isUncut', type: 'checkbox', admin: { description: 'Is uncut' } },
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
          name: 'space',
          type: 'text',
          admin: { description: 'Media Space' },
        },
        {
          name: 'format',
          type: 'select',
          admin: { description: 'Format' },
          options: [
            { label: 'None', value: '' },
            { label: 'HD', value: 'HD' },
            { label: 'UHD 4K', value: 'UHD 4K' },
          ],
        },
        {
          name: 'duration',
          type: 'number',
          admin: { description: 'Duration' },
        },

        {
          name: 'onThaipbs',
          type: 'checkbox',
          admin: { description: 'On ThaiPBS' },
        },
        {
          name: 'onAltv',
          type: 'checkbox',
          admin: { hidden: true, description: 'On ALTV' },
        },
        {
          name: 'onVipa',
          type: 'checkbox',
          admin: { description: 'On VIPA' },
        },
        {
          name: 'onFacebook',
          type: 'checkbox',
          admin: { description: 'On Facebook' },
        },
        {
          name: 'onX',
          type: 'checkbox',
          admin: { description: 'On X' },
        },
        {
          name: 'onYoutube',
          type: 'checkbox',
          admin: { description: 'On YouTube' },
        },
        {
          name: 'onTiktok',
          type: 'checkbox',
          admin: { description: 'On TikTok' },
        },
        {
          name: 'views',
          type: 'json',
          admin: {
            description: 'View counts per platform. Flat: { "X": 100, "Youtube": 1000 }. By month-year: { "2025-02": { "X": 100, "Youtube": 100000 }, "2025-01": { ... } }',
          },
        },
        {
          name: 'productionCountry',
          type: 'text',
          admin: { description: 'Production country' },
        },
        {
          name: 'productionYear',
          type: 'number',
          admin: { description: 'Production year' },
        },
        {
          name: 'rightsTerritoriesAvailable',
          type: 'textarea',
          admin: { description: 'Rights territories available' },
        },
        {
          name: 'targetGroup',
          type: 'number',
          min: 0,
          max: 120,
          admin: { description: 'Target group age. Enter the minimum viewer age, for example 18 means older than 18.' },
        },
        {
          name: 'audioChannel1_2',
          type: 'select',
          admin: { description: 'Audio channel 1/2' },
          options: [
            { label: 'None', value: '' },
            { label: 'Full Mix_Thai', value: 'Full Mix_Thai' },
            { label: 'Full Mix_English', value: 'Full Mix_English' },
            { label: 'Full Mix_Japanese', value: 'Full Mix_Japanese' },
            { label: 'Full Mix_Chinese', value: 'Full Mix_Chinese' },
            { label: 'Music & Effect', value: 'Music & Effect' },
          ],
        },
        {
          name: 'audioChannel3_4',
          type: 'select',
          admin: { description: 'Audio channel 3/4' },
          options: [
            { label: 'None', value: '' },
            { label: 'Full Mix_Thai', value: 'Full Mix_Thai' },
            { label: 'Full Mix_English', value: 'Full Mix_English' },
            { label: 'Full Mix_Japanese', value: 'Full Mix_Japanese' },
            { label: 'Full Mix_Chinese', value: 'Full Mix_Chinese' },
            { label: 'Music & Effect', value: 'Music & Effect' },
          ],
        },
        {
          name: 'closeCaption1',
          type: 'select',
          admin: { description: 'Close caption 1' },
          options: [
            { label: 'Thai', value: 'Thai' },
            { label: 'Eng', value: 'Eng' },
            { label: 'Myanmar', value: 'Myanmar' },
            { label: 'Chinese', value: 'Chinese' },
            { label: 'Japan', value: 'Japan' },
            { label: 'None', value: '' },
          ],
        },
        {
          name: 'closeCaption2',
          type: 'select',
          admin: { description: 'Close caption 2' },
          options: [
            { label: 'Thai', value: 'Thai' },
            { label: 'Eng', value: 'Eng' },
            { label: 'Myanmar', value: 'Myanmar' },
            { label: 'Chinese', value: 'Chinese' },
            { label: 'Japan', value: 'Japan' },
            { label: 'None', value: '' },
          ],
        },
        {
          name: 'closeCaption3',
          type: 'select',
          admin: { description: 'Close caption 3' },
          options: [
            { label: 'Thai', value: 'Thai' },
            { label: 'Eng', value: 'Eng' },
            { label: 'Myanmar', value: 'Myanmar' },
            { label: 'Chinese', value: 'Chinese' },
            { label: 'Japan', value: 'Japan' },
            { label: 'None', value: '' },
          ],
        },
        {
          name: 'subtitle1',
          type: 'select',
          admin: { description: 'Subtitle 1' },
          options: [
            { label: 'Burn Thai-Sub Into Video', value: 'Burn Thai-Sub Into Video' },
            { label: 'Burn Eng-Sub Into Video', value: 'Burn Eng-Sub Into Video' },
            { label: 'Thai-Sub Sidecar File', value: 'Thai-Sub Sidecar File' },
            { label: 'Eng-Sub Sidecar File', value: 'Eng-Sub Sidecar File' },
            { label: 'Interviewer Local-Sub', value: 'Interviewer Local-Sub' },
            { label: 'None', value: '' },
          ],
        },
        {
          name: 'file_type',
          type: 'text',
          admin: { description: 'File type' },
        },
        {
          name: 'version',
          type: 'number',
          admin: { description: 'Version' },
          validate: (val: unknown) =>
            val == null ||
              (typeof val === 'number' && Number.isInteger(val) && val >= 0)
              ? true
              : 'Must be null or a non-negative integer',
        },
        {
          name: 'file_ext',
          type: 'text',
          admin: { description: 'File extension' },
        },
        {
          name: 'is_infosheet_write',
          type: 'checkbox',
          admin: { description: 'Is data written from infosheet' },
        },
        {
          name: 'asset_create',
          type: 'date',
          required: false,
          admin: {
            description: 'Asset create date',
            condition: (_data, _siblingData, { operation }) => operation === 'update',
          },
          defaultValue: () => new Date().toISOString(),
        },
        {
          name: 'asset_update',
          type: 'date',
          required: false,
          admin: {
            description: 'Asset update date',
            condition: (_data, _siblingData, { operation }) => operation === 'update',
          },
          defaultValue: () => new Date().toISOString(),
        },
        {
          name: 'seasons',
          type: 'relationship',
          relationTo: 'seasons',
          hasMany: true,
          admin: { description: 'Seasons (for Series)' },
        },
      ],
    }
