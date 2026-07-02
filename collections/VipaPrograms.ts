import type { CollectionConfig } from 'payload'

export const VipaPrograms: CollectionConfig = {
      slug: 'vipaPrograms',
      admin: {
        useAsTitle: '_displayTitle',
        defaultColumns: ['titleTh', 'titleEn', 'image', 'coverImage', 'isNEW', 'isNewHits', 'createdAt', 'updatedAt'],
        listSearchableFields: ['titleTh', 'titleEn', '_displayTitle', 'tags'],
      },
      fields: [
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
        { name: 'isNEW', type: 'checkbox', admin: { description: 'Is NEW' } },
        { name: 'isSchedule', type: 'checkbox', admin: { description: 'Is Schedule' } },
        { name: 'isNewHits', type: 'checkbox', admin: { description: 'Is New Hits' } },
        { name: 'is_special_programs', type: 'checkbox', admin: { description: 'Is special programs' } },
        { name: 'is_old_series', type: 'checkbox', admin: { description: 'Is old series' } },
        { name: 'isFeature', type: 'checkbox', admin: { description: 'Is Feature' } },
        { name: 'is_IP', type: 'checkbox', admin: { description: 'Is IP' } },
        { name: 'isThaiProgram', type: 'checkbox', admin: { description: 'Is Thai program' } },
        { name: 'isInterProgram', type: 'checkbox', admin: { description: 'Is inter program' } },
        { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Image' } },
        { name: 'coverImage', type: 'upload', relationTo: 'media', admin: { description: 'Cover image' } },
        { name: 'vipaLink', type: 'text', admin: { description: 'VIPA link (URL)' } },
        {
          name: 'genre',
          type: 'select',
          admin: { description: 'Genre' },
          options: [
            { label: 'ละคร ซีรีส์', value: 'Drama&Sitcom' },
            { label: 'วาไรตี้', value: 'Variety&Lifestyle' },
            { label: 'สารคดี', value: 'Documentary' },
            { label: 'รายการข่าว', value: 'News&Facture' },
            { label: 'รายการเพลง', value: 'Music' },
            { label: 'รายการพิเศษ', value: 'Special Program' },
            { label: 'อาหาร สุขภาพ ท่องเที่ยว', value: 'Food&Travel' },
            { label: 'เด็กและการเรียนรู้', value: 'Kids&Family' },
            { label: 'แอนิเมชัน', value: 'Animation' },
          ],
        },
        { name: 'tags', type: 'text', admin: { description: 'Tags (comma-separated or free text)' } },
        {
          name: 'firstRun',
          type: 'date',
          admin: {
            description: 'First run date and time',
            date: { pickerAppearance: 'dayAndTime', timeIntervals: 5 },
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
              admin: { date: { pickerAppearance: 'dayAndTime', timeIntervals: 5 } },
            },
          ],
        },
        { name: 'duration', type: 'number', admin: { description: 'Duration' } },
        { name: 'hasSoundtrack', type: 'checkbox', admin: { description: 'Has soundtrack' } },
        { name: 'hasAd', type: 'checkbox', admin: { description: 'Has ad' } },
        { name: 'hasCc', type: 'checkbox', admin: { description: 'Has CC (closed captions)' } },
        { name: 'hasSl', type: 'checkbox', admin: { description: 'Has SL (sign language)' } },
        { name: 'hasBigSign', type: 'checkbox', admin: { description: 'Has BigSign' } },
        { name: 'isUncut', type: 'checkbox', admin: { description: 'Is uncut' } },
        {
          name: 'epCount',
          type: 'number',
          admin: { description: 'Number of episodes' },
          validate: (val: unknown) =>
            val == null || (typeof val === 'number' && Number.isInteger(val) && val >= 0)
              ? true
              : 'Must be null or a non-negative integer',
        },
        {
          name: 'views',
          type: 'json',
          admin: { description: 'View counts per platform. Flat: { "view": 100, "views": 1000, "other": 10000 }. By month-year: { "2025-02": { "view": 100 }, "2025-01": { } }' },
        },
      ],
    }
