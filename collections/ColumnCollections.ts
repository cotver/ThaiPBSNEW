import { BlocksFeature, EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Access, Block, CollectionBeforeChangeHook, CollectionBeforeDeleteHook, CollectionConfig } from 'payload'
import { relatedStoriesField } from './RelatedStoryFields.ts'
import { siteOnlyFiles } from './siteOnlyFiles.ts'
import { contactSectionOptionLabel, contactSections } from '../src/lib/contact-sections.ts'

const COLUMN_GROUP = 'Column'

const publicRead: Access = () => true
const columnManager: Access = ({ req }) => {
  const role = (req.user as { role?: string } | null)?.role
  return role === 'super-admin' || role === 'writer'
}

const slugify = (value: unknown): string => {
  const text =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object'
        ? String(
            (value as Record<string, unknown>).th ||
              (value as Record<string, unknown>).en ||
              Object.values(value)[0] ||
              '',
          )
        : String(value || '')

  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const marketEventSlugify = (value: unknown): string =>
  String(value || '')
    .trim()
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const editableAccess = {
  read: publicRead,
  create: columnManager,
  update: columnManager,
  delete: columnManager,
}

const deleteColumnArticleDependents: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: 'column-article-stats',
    where: { article: { equals: id } },
    overrideAccess: true,
    req,
  })

  await req.payload.update({
    collection: 'column-analytics-events',
    where: { article: { equals: id } },
    data: { article: null },
    overrideAccess: true,
    req,
  })
}

const columnAdmin = (admin: NonNullable<CollectionConfig['admin']> = {}) => ({
  ...admin,
  group: COLUMN_GROUP,
})

const ColumnArticleEmbedBlock: Block = {
  slug: 'columnArticleEmbed',
  labels: { singular: 'Article Embed', plural: 'Article Embeds' },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'social',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video URL', value: 'video' },
        { label: 'Social Embed URL', value: 'social' },
      ],
    },
    {
      name: 'platform',
      type: 'select',
      options: [
        { label: 'Facebook', value: 'facebook' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'X / Twitter', value: 'x' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
        { label: 'Generic / Other', value: 'generic' },
      ],
    },
    { name: 'title', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'column-media' },
    { name: 'url', type: 'text' },
    { name: 'caption', type: 'text' },
  ],
}

const ColumnArticleImageGroupBlock: Block = {
  slug: 'columnArticleImageGroup',
  labels: { singular: 'Article Image Group', plural: 'Article Image Groups' },
  fields: [
    {
      name: 'layout',
      type: 'select',
      required: true,
      defaultValue: 'normal',
      options: [
        { label: 'Normal single image', value: 'normal' },
        { label: 'Two images', value: 'two' },
        { label: 'Three images row', value: 'three' },
      ],
    },
    {
      name: 'displayWidth',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Full width', value: 'full' },
      ],
    },
    {
      name: 'imageFit',
      type: 'select',
      required: true,
      defaultValue: 'contain',
      options: [
        { label: 'Show full image', value: 'contain' },
        { label: 'Fill frame', value: 'cover' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 3,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'column-media', required: true },
        { name: 'alt', type: 'text' },
      ],
    },
    { name: 'caption', type: 'textarea' },
  ],
}

export const ColumnMedia: CollectionConfig = {
  slug: 'column-media',
  labels: { singular: 'Media', plural: 'Media' },
  admin: columnAdmin({
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'caption', 'updatedAt'],
  }),
  access: editableAccess,
  upload: {
    staticDir: process.env.PAYLOAD_COLUMN_MEDIA_DIR || './payload-uploads/column-media',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'alt', type: 'text' },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text' },
  ],
}

export const ArticlePDF: CollectionConfig = {
  slug: 'articlePDF',
  labels: { singular: 'ArticlePDF', plural: 'ArticlePDFs' },
  admin: columnAdmin({
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'updatedAt'],
  }),
  access: editableAccess,
  upload: {
    staticDir: process.env.PAYLOAD_ARTICLE_PDF_DIR || './payload-uploads/article-pdf',
    mimeTypes: ['application/pdf'],
  },
  fields: [],
}

export const ColumnVideos: CollectionConfig = {
  slug: 'column-videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: columnAdmin({
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'articles', 'updatedAt'],
  }),
  access: editableAccess,
  upload: {
    staticDir: process.env.PAYLOAD_COLUMN_VIDEOS_DIR || './payload-uploads/column-videos',
    mimeTypes: ['video/*', 'image/gif'],
    // ThaiPBS Journal videos (/api/column-videos/file/...) open only for signed-in Payload users, or when the site plays them.
    ...siteOnlyFiles,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'alt',
      type: 'text',
      admin: { description: 'Description of the video for accessibility.' },
    },
    {
      name: 'articles',
      type: 'join',
      collection: 'column-articles',
      on: 'videos',
      admin: { description: 'Articles that use this video.' },
    },
  ],
}

export const ColumnCategories: CollectionConfig = {
  slug: 'column-categories',
  labels: { singular: 'Category', plural: 'Categories' },
  orderable: true,
  admin: columnAdmin({
    useAsTitle: 'nameTh',
    defaultColumns: ['nameTh', 'nameEn', 'slug', 'pageStyle', 'sortOrder', 'showInPage', 'showInPageSortOrder', 'showInNavigation'],
  }),
  defaultSort: '_order',
  access: editableAccess,
  fields: [
    { name: 'nameTh', label: 'Name (TH)', type: 'text', required: true },
    { name: 'nameEn', label: 'Name (EN)', type: 'text' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: { beforeValidate: [({ value, data }) => value || slugify(data?.nameTh || data?.nameEn)] },
    },
    { name: 'descriptionTh', label: 'Description (TH)', type: 'textarea' },
    { name: 'descriptionEn', label: 'Description (EN)', type: 'textarea' },
    { name: 'coverImage', type: 'upload', relationTo: 'column-media' },
    {
      name: 'pageStyle',
      type: 'select',
      required: true,
      defaultValue: 'split-image',
      options: [
        { label: 'Split Image', value: 'split-image' },
        { label: 'Full Image CTA', value: 'full-image-cta' },
        { label: 'Framed Image Overlay', value: 'framed-image-overlay' },
        { label: 'Poster Split', value: 'poster-split' },
        { label: 'Dark Center CTA', value: 'dark-center-cta' },
        { label: 'Editorial Band', value: 'editorial-band' },
        { label: 'Dark Line CTA', value: 'dark-line-cta' },
        { label: 'Image Title Brand', value: 'image-title-brand' },
      ],
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
    { name: 'showInPage', label: 'Show in Page', type: 'checkbox', defaultValue: true },
    { name: 'showInPageSortOrder', label: 'Show in Page Sort Order', type: 'number', defaultValue: 0,
      admin: { description: 'Lower numbers appear first on the Studios page.' } },
    { name: 'showInNavigation', type: 'checkbox', defaultValue: true },
  ],
}

export const ColumnSubcategories: CollectionConfig = {
  slug: 'column-subcategories',
  labels: { singular: 'Sub Category', plural: 'Sub Categories' },
  orderable: true,
  admin: columnAdmin({
    useAsTitle: 'nameTh',
    defaultColumns: ['nameTh', 'nameEn', 'category', 'slug', 'sortOrder', 'showInPage', 'showInPageSortOrder', 'showInNavigation'],
  }),
  defaultSort: '_order',
  access: editableAccess,
  fields: [
    { name: 'nameTh', label: 'Name (TH)', type: 'text', required: true },
    { name: 'nameEn', label: 'Name (EN)', type: 'text' },
    { name: 'category', type: 'relationship', relationTo: 'column-categories', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: { beforeValidate: [({ value, data }) => value || slugify(data?.nameTh || data?.nameEn)] },
    },
    { name: 'descriptionTh', label: 'Description (TH)', type: 'textarea' },
    { name: 'descriptionEn', label: 'Description (EN)', type: 'textarea' },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
    { name: 'showInPage', label: 'Show in Page', type: 'checkbox', defaultValue: true },
    { name: 'showInPageSortOrder', label: 'Show in Page Sort Order', type: 'number', defaultValue: 0,
      admin: { description: 'Lower numbers appear first when subcategories are shown on the page.' } },
    { name: 'showInNavigation', type: 'checkbox', defaultValue: true },
  ],
}

export const ColumnTags: CollectionConfig = {
  slug: 'column-tags',
  labels: { singular: 'Tag', plural: 'Tags' },
  admin: columnAdmin({ useAsTitle: 'nameTh', defaultColumns: ['nameTh', 'nameEn', 'slug'] }),
  access: editableAccess,
  fields: [
    { name: 'nameTh', label: 'Name (TH)', type: 'text', required: true },
    { name: 'nameEn', label: 'Name (EN)', type: 'text' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: { beforeValidate: [({ value, data }) => value || slugify(data?.nameTh || data?.nameEn)] },
    },
  ],
}

export const ColumnAuthors: CollectionConfig = {
  slug: 'column-authors',
  labels: { singular: 'Author', plural: 'Authors' },
  admin: columnAdmin({ useAsTitle: 'nameTh', defaultColumns: ['nameTh', 'nameEn', 'slug'] }),
  access: editableAccess,
  fields: [
    { name: 'nameTh', label: 'Name (TH)', type: 'text', required: true },
    { name: 'nameEn', label: 'Name (EN)', type: 'text' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: { beforeValidate: [({ value, data }) => value || slugify(data?.nameTh || data?.nameEn)] },
    },
    { name: 'avatar', type: 'upload', relationTo: 'column-media' },
    { name: 'bioTh', label: 'Bio (TH)', type: 'textarea' },
    { name: 'bioEn', label: 'Bio (EN)', type: 'textarea' },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}

export const ColumnArticles: CollectionConfig = {
  slug: 'column-articles',
  labels: { singular: 'Article', plural: 'Articles' },
  versions: { drafts: true },
  admin: columnAdmin({
    useAsTitle: 'titleTh',
    defaultColumns: [
      'titleTh',
      'titleEn',
      'categories',
      'subcategories',
      'isFeature',
      'featureUntil',
      'isNewEpisodes',
      'newEpisodesUntil',
      'comingSoon',
      'comingSoonDate',
      'isPressReleases',
      'isMarketsAndEvents',
      '_status',
      'publishedDate',
    ],
  }),
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: columnManager,
    update: columnManager,
    delete: columnManager,
  },
  hooks: {
    beforeDelete: [deleteColumnArticleDependents],
    beforeChange: [
      ({ data, originalDoc }) => {
        const isNewEpisodes = data?.isNewEpisodes ?? originalDoc?.isNewEpisodes
        const comingSoon = data?.comingSoon ?? originalDoc?.comingSoon
        const isPressReleases = data?.isPressReleases ?? originalDoc?.isPressReleases
        const isMarketsAndEvents = data?.isMarketsAndEvents ?? originalDoc?.isMarketsAndEvents

        return {
          ...data,
          isNormal: !isNewEpisodes && !comingSoon && !isPressReleases && !isMarketsAndEvents,
        }
      },
      ({ data, originalDoc }) => {
        const status = data?._status ?? originalDoc?._status
        if (status !== 'published' || originalDoc?.publishedDate) return data

        return {
          ...data,
          publishedDate: new Date().toISOString(),
        }
      },
    ],
  },
  fields: [
    { name: 'titleTh', label: 'Title (TH)', type: 'text', required: true },
    { name: 'titleEn', label: 'Title (EN)', type: 'text' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [({ value, data }) => value || slugify(data?.titleTh || data?.titleEn)] },
    },
    { name: 'excerptTh', label: 'Excerpt (TH)', type: 'textarea' },
    { name: 'excerptEn', label: 'Excerpt (EN)', type: 'textarea' },
    { name: 'descriptionTh', label: 'Description (TH)', type: 'textarea' },
    { name: 'descriptionEn', label: 'Description (EN)', type: 'textarea' },
    {
      name: 'articlePDF',
      label: 'ArticlePDF',
      type: 'upload',
      relationTo: 'articlePDF',
      admin: { description: 'Upload a PDF for this article.' },
    },
    {
      name: 'heroImages',
      type: 'group',
      fields: [
        {
          name: 'vertical',
          type: 'array',
          required: true,
          minRows: 1,
          fields: [{ name: 'image', type: 'upload', relationTo: 'column-media', required: true }],
        },
        {
          name: 'horizontal',
          type: 'array',
          required: true,
          minRows: 1,
          fields: [{ name: 'image', type: 'upload', relationTo: 'column-media', required: true }],
        },
      ],
    },
    {
      name: 'videos',
      type: 'relationship',
      relationTo: 'column-videos',
      hasMany: true,
      admin: { description: 'Videos related to this article.' },
    },
    { name: 'categories', type: 'relationship', relationTo: 'column-categories', hasMany: true },
    { name: 'subcategories', type: 'relationship', relationTo: 'column-subcategories', hasMany: true },
    { name: 'tags', type: 'relationship', relationTo: 'column-tags', hasMany: true },
    relatedStoriesField,
    { name: 'author', type: 'relationship', relationTo: 'column-authors', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'isFeature',
          label: 'Feature',
          type: 'checkbox',
          defaultValue: false,
          index: true,
          admin: {
            description: 'Mark this article as featured.',
          },
        },
        {
          name: 'featureUntil',
          label: 'Feature Until',
          type: 'date',
          index: true,
          admin: {
            condition: (_data, siblingData) => Boolean(siblingData?.isFeature),
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Optional. Leave empty to keep this article featured indefinitely.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isNewEpisodes',
          label: 'New Episodes',
          type: 'checkbox',
          defaultValue: false,
          index: true,
          admin: {
            description: 'Mark this article as having new episodes.',
          },
        },
        {
          name: 'newEpisodesUntil',
          label: 'New Episodes Until',
          type: 'date',
          index: true,
          admin: {
            condition: (_data, siblingData) => Boolean(siblingData?.isNewEpisodes),
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Optional. Leave empty to show New Episodes indefinitely.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'comingSoon',
          label: 'Coming Soon',
          type: 'checkbox',
          defaultValue: false,
          index: true,
          admin: {
            description: 'Mark this article as coming soon.',
          },
        },
        {
          name: 'comingSoonDate',
          label: 'Coming Soon Date',
          type: 'date',
          index: true,
          admin: {
            condition: (_data, siblingData) => Boolean(siblingData?.comingSoon),
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
      ],
    },
    {
      name: 'isPressReleases',
      label: 'Press Releases',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Include this article in Press Releases.',
      },
    },
    {
      name: 'isMarketsAndEvents',
      label: 'Markets and Events',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Include this article in Markets and Events.',
      },
    },
    {
      name: 'isNormal',
      label: 'Normal',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: { hidden: true },
    },
    { name: 'publishedDate', type: 'date', admin: { readOnly: true } },
    {
      name: 'contentTh',
      label: 'Content (TH)',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          EXPERIMENTAL_TableFeature(),
          BlocksFeature({ blocks: [ColumnArticleEmbedBlock, ColumnArticleImageGroupBlock] }),
        ],
      }),
    },
    {
      name: 'contentEn',
      label: 'Content (EN)',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          EXPERIMENTAL_TableFeature(),
          BlocksFeature({ blocks: [ColumnArticleEmbedBlock, ColumnArticleImageGroupBlock] }),
        ],
      }),
    },
  ],
}

export const MarketEventGroups: CollectionConfig = {
  slug: 'market-event-groups',
  labels: { singular: 'Market & Event Group', plural: 'Market & Event Groups' },
  orderable: true,
  admin: columnAdmin({
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'coverImage', 'updatedAt'],
    listSearchableFields: ['name'],
    pagination: { defaultLimit: 1000, limits: [10, 25, 50, 100, 250, 500, 1000] },
    components: { beforeList: ['@/components/admin/CategoriesOrderSort#CategoriesOrderSort'] },
  }),
  defaultSort: '_order',
  access: editableAccess,
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug', type: 'text', required: true, unique: true, index: true,
      hooks: { beforeValidate: [({ value, data }) => value || marketEventSlugify(data?.name)] },
    },
    { name: 'coverImage', label: 'Cover image', type: 'upload', relationTo: 'column-media', required: true },
    { name: 'order', type: 'number', required: true, defaultValue: 0, admin: { hidden: true } },
  ],
}

export const MarketEventContent: CollectionConfig = {
  slug: 'market-event-content',
  labels: { singular: 'Market & Event', plural: 'Market & Events' },
  admin: columnAdmin({ useAsTitle: 'name', defaultColumns: ['name', 'marketEventGroup', 'dateTime', 'location', 'updatedAt'] }),
  defaultSort: '-dateTime',
  access: editableAccess,
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug', type: 'text', required: true, unique: true, index: true,
      hooks: { beforeValidate: [({ value, data }) => value || marketEventSlugify(data?.name)] },
    },
    { name: 'marketEventGroup', label: 'Market & Event group', type: 'relationship', relationTo: 'market-event-groups', required: true, index: true },
    { name: 'programs', type: 'relationship', relationTo: 'programs', hasMany: true },
    { name: 'dateTime', label: 'Date & time', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'location', type: 'text' },
    { name: 'coverImage', label: 'Cover image', type: 'upload', relationTo: 'column-media' },
    {
      name: 'images', label: 'Event images', type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'column-media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'content', label: 'Event content', type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [ColumnArticleEmbedBlock, ColumnArticleImageGroupBlock] }),
        ],
      }),
    },
  ],
}

// Every contact field is optional, so the admin title falls back through whatever was filled in.
const setContactTitle: CollectionBeforeChangeHook = ({ data }) => ({
  ...data,
  title: [data.name, data.position, data.email, data.phone, data.website]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean) || 'Untitled contact',
})

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { singular: 'Contact', plural: 'Contacts' },
  admin: columnAdmin({
    useAsTitle: 'title',
    defaultColumns: ['title', 'position', 'phone', 'email', 'updatedAt'],
    listSearchableFields: ['name', 'position', 'email', 'phone'],
    description: 'Contact people. Add them to one or more home page sections in Section Contacts.',
  }),
  access: editableAccess,
  hooks: { beforeChange: [setContactTitle] },
  fields: [
    { name: 'title', type: 'text', admin: { hidden: true } },
    { name: 'name', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'column-media' },
    { name: 'position', label: 'Job position', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'textarea' },
  ],
}

const setSectionContactTitle: CollectionBeforeChangeHook = async ({ data, req }) => {
  const section = contactSections.find(({ value }) => value === data.section)
  let title: string = section?.label || String(data.section || '')
  if (data.section === 'type-row' && data.programType) {
    const typeId = typeof data.programType === 'object' ? data.programType.id : data.programType
    const type = await req.payload.findByID({ collection: 'categories', id: typeId, depth: 0, overrideAccess: true, req }).catch(() => null)
    title = `${title}: ${type?.name || typeId}`
  }
  if (data.section === 'year-row' && data.year) title = `${title}: ${data.year}`
  return { ...data, title }
}

export const SectionContacts: CollectionConfig = {
  slug: 'section-contacts',
  labels: { singular: 'Section Contact', plural: 'Section Contacts' },
  admin: columnAdmin({
    useAsTitle: 'title',
    defaultColumns: ['title', 'contacts', 'updatedAt'],
    description: 'Pick a home page section and the contacts shown under its "Contact Information" link.',
  }),
  access: editableAccess,
  hooks: { beforeChange: [setSectionContactTitle] },
  fields: [
    { name: 'title', type: 'text', admin: { hidden: true } },
    {
      name: 'section', type: 'select', required: true, index: true,
      options: contactSections.map((section) => ({ value: section.value, label: contactSectionOptionLabel(section) })),
    },
    {
      name: 'programType', label: 'Program type', type: 'relationship', relationTo: 'categories',
      admin: { condition: (data) => data?.section === 'type-row', description: 'The program type row these contacts belong to.' },
      validate: (value: unknown, { siblingData }: { siblingData: { section?: string } }) =>
        siblingData.section !== 'type-row' || value ? true : 'Pick the program type row.',
    },
    {
      name: 'year', type: 'number', min: 1900, max: 9999,
      admin: { condition: (data) => data?.section === 'year-row', description: 'The "ThaiPBS Year" row these contacts belong to, e.g. 2026.' },
      validate: (value: unknown, { siblingData }: { siblingData: { section?: string } }) =>
        siblingData.section !== 'year-row' || value ? true : 'Enter the year of the row.',
    },
    {
      name: 'contacts', label: 'Contact people', type: 'relationship', relationTo: 'contacts', hasMany: true,
      admin: { description: 'Shown in this order. A contact can be used in any number of sections.' },
    },
  ],
}

export const ColumnAnalyticsEvents: CollectionConfig = {
  slug: 'column-analytics-events',
  labels: { singular: 'Analytics Event', plural: 'Analytics Events' },
  admin: columnAdmin({
    useAsTitle: 'eventType',
    defaultColumns: ['eventType', 'article', 'visitorId', 'path', 'createdAt'],
  }),
  access: { read: columnManager, create: columnManager, update: columnManager, delete: columnManager },
  fields: [
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Article View', value: 'article_view' },
        { label: 'Article Click', value: 'article_click' },
        { label: 'Article Like', value: 'article_like' },
        { label: 'Article Unlike', value: 'article_unlike' },
      ],
    },
    { name: 'visitorId', type: 'text', required: true, index: true },
    { name: 'sessionId', type: 'text', index: true },
    { name: 'article', type: 'relationship', relationTo: 'column-articles', index: true },
    { name: 'path', type: 'text' },
    { name: 'referrer', type: 'text' },
    { name: 'userAgent', type: 'textarea' },
    { name: 'consentSnapshot', type: 'checkbox', defaultValue: true },
  ],
}

export const ColumnArticleStats: CollectionConfig = {
  slug: 'column-article-stats',
  labels: { singular: 'Article Stat', plural: 'Article Stats' },
  admin: columnAdmin({
    useAsTitle: 'article',
    defaultColumns: ['article', 'views', 'uniqueViews', 'clicks', 'likes'],
  }),
  access: editableAccess,
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'column-articles', required: true, unique: true },
    { name: 'views', type: 'number', defaultValue: 0, min: 0 },
    { name: 'uniqueViews', type: 'number', defaultValue: 0, min: 0 },
    { name: 'clicks', type: 'number', defaultValue: 0, min: 0 },
    { name: 'uniqueClicks', type: 'number', defaultValue: 0, min: 0 },
    { name: 'likes', type: 'number', defaultValue: 0, min: 0 },
    { name: 'uniqueLikes', type: 'number', defaultValue: 0, min: 0 },
    {
      name: 'monthlyStats',
      type: 'array',
      fields: [
        { name: 'monthYear', type: 'text', required: true },
        { name: 'views', type: 'number', defaultValue: 0, min: 0 },
        { name: 'uniqueViews', type: 'number', defaultValue: 0, min: 0 },
        { name: 'clicks', type: 'number', defaultValue: 0, min: 0 },
        { name: 'uniqueClicks', type: 'number', defaultValue: 0, min: 0 },
        { name: 'likes', type: 'number', defaultValue: 0, min: 0 },
        { name: 'uniqueLikes', type: 'number', defaultValue: 0, min: 0 },
      ],
    },
  ],
}

export const columnCollections: CollectionConfig[] = [
  MarketEventGroups,
  MarketEventContent,
  SectionContacts,
  Contacts,
  ColumnArticles,
  ColumnAnalyticsEvents,
  ColumnArticleStats,
  ColumnCategories,
  ColumnSubcategories,
  ColumnTags,
  ColumnAuthors,
  ColumnMedia,
  ArticlePDF,
  ColumnVideos,
]
