import { BlocksFeature, EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Access, Block, CollectionConfig } from 'payload'

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

const editableAccess = {
  read: publicRead,
  create: columnManager,
  update: columnManager,
  delete: columnManager,
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
    defaultColumns: ['nameTh', 'nameEn', 'slug', 'pageStyle', 'showInNavigation'],
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
    { name: 'showInNavigation', type: 'checkbox', defaultValue: true },
  ],
}

export const ColumnSubcategories: CollectionConfig = {
  slug: 'column-subcategories',
  labels: { singular: 'Sub Category', plural: 'Sub Categories' },
  orderable: true,
  admin: columnAdmin({
    useAsTitle: 'nameTh',
    defaultColumns: ['nameTh', 'nameEn', 'category', 'slug', 'showInNavigation'],
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
    beforeChange: [
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
    { name: 'publishedDate', type: 'date', admin: { readOnly: true } },
    {
      name: 'contentTh',
      label: 'Content (TH)',
      type: 'richText',
      required: true,
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
  ColumnArticles,
  ColumnAnalyticsEvents,
  ColumnArticleStats,
  ColumnCategories,
  ColumnSubcategories,
  ColumnTags,
  ColumnAuthors,
  ColumnMedia,
  ColumnVideos,
]
