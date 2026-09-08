import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

type RelationValue =
  | number
  | string
  | { id?: number | string | null; value?: number | string | null }
  | null
  | undefined

const relationId = (value: RelationValue): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object') return value.id ?? value.value ?? null
  return null
}

const sameId = (left: RelationValue, right: RelationValue): boolean => {
  const leftId = relationId(left)
  const rightId = relationId(right)
  return leftId != null && rightId != null && String(leftId) === String(rightId)
}

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const validateArticleTarget: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const nextData = data ?? {}
  const targetType = nextData.targetType ?? originalDoc?.targetType ?? 'program'
  const program = nextData.program ?? originalDoc?.program
  const season = nextData.season ?? originalDoc?.season
  const episode = nextData.episode ?? originalDoc?.episode
  const errors: Array<{ message: string; path: string }> = []

  if (!relationId(program)) {
    errors.push({ message: 'A parent program is required.', path: 'program' })
  }

  if (targetType === 'program') {
    return {
      ...nextData,
      season: null,
      episode: null,
      targetType,
    }
  }

  if (targetType === 'season' && !relationId(season)) {
    errors.push({ message: 'Select a season for a season article.', path: 'season' })
  }

  if (targetType === 'episode' && !relationId(episode)) {
    errors.push({ message: 'Select an episode for an episode article.', path: 'episode' })
  }

  let resolvedSeason = season

  if (targetType === 'episode' && relationId(episode)) {
    const episodeDoc = await req.payload.findByID({
      collection: 'episodes',
      id: relationId(episode)!,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const episodeSeason = episodeDoc.season as RelationValue

    if (relationId(season) && !sameId(season, episodeSeason)) {
      errors.push({
        message: 'The selected episode does not belong to the selected season.',
        path: 'episode',
      })
    } else {
      resolvedSeason = episodeSeason
    }
  }

  if (relationId(resolvedSeason) && relationId(program)) {
    const seasonDoc = await req.payload.findByID({
      collection: 'seasons',
      id: relationId(resolvedSeason)!,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (!sameId(seasonDoc.program as RelationValue, program)) {
      errors.push({
        message: 'The selected season does not belong to the selected program.',
        path: 'season',
      })
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      {
        collection: 'articles',
        errors,
        req,
      },
      req.t,
    )
  }

  return {
    ...nextData,
    episode: targetType === 'episode' ? relationId(episode) : null,
    season: relationId(resolvedSeason),
    targetType,
  }
}

const setPublishedDate: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const nextData = data ?? {}
  const status = nextData.status ?? originalDoc?.status ?? 'draft'

  return {
    ...nextData,
    publishedDate:
      status === 'published'
        ? originalDoc?.publishedDate ?? nextData.publishedDate ?? new Date().toISOString()
        : originalDoc?.publishedDate ?? null,
  }
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: '_displayTitle',
    defaultColumns: ['titleTh', 'program', 'targetType', 'isFeatured', 'status', 'publishedDate', 'updatedAt'],
    listSearchableFields: ['titleTh', 'titleEn', 'slug', '_displayTitle'],
    description: 'Articles attached to a program, season, or episode.',
  },
  hooks: {
    beforeValidate: [validateArticleTarget, setPublishedDate],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Target',
          description: 'Choose where this article belongs.',
          fields: [
            {
              name: 'program',
              type: 'relationship',
              relationTo: 'programs',
              required: true,
              index: true,
              admin: { description: 'One program can have many articles.' },
            },
            {
              name: 'targetType',
              type: 'select',
              required: true,
              defaultValue: 'program',
              options: [
                { label: 'Program article', value: 'program' },
                { label: 'Season article', value: 'season' },
                { label: 'Episode article', value: 'episode' },
              ],
            },
            {
              name: 'season',
              type: 'relationship',
              relationTo: 'seasons',
              index: true,
              filterOptions: ({ siblingData }) => {
                const program = relationId(
                  (siblingData as { program?: RelationValue } | undefined)?.program,
                )
                return program ? { program: { equals: program } } : true
              },
              admin: {
                condition: (_data, siblingData) => siblingData?.targetType !== 'program',
                description: 'Required for season and episode articles. Only seasons from the selected program are shown.',
              },
            },
            {
              name: 'episode',
              type: 'relationship',
              relationTo: 'episodes',
              index: true,
              filterOptions: ({ siblingData }) => {
                const season = relationId(
                  (siblingData as { season?: RelationValue } | undefined)?.season,
                )
                return season ? { season: { equals: season } } : false
              },
              admin: {
                condition: (_data, siblingData) => siblingData?.targetType === 'episode',
                description: 'Required for episode articles. Select the season first.',
              },
            },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: '_displayTitle',
              type: 'text',
              admin: { hidden: true },
              hooks: {
                beforeChange: [
                  ({ siblingData }) => {
                    const title = String(siblingData?.titleTh || siblingData?.titleEn || '').trim()
                    const type = String(siblingData?.targetType || 'program')
                    return title ? `${title} (${type})` : `Article (${type})`
                  },
                ],
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'titleTh', label: 'Title (Thai)', type: 'text', required: true },
                { name: 'titleEn', label: 'Title (English)', type: 'text' },
              ],
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: { description: 'URL path. Generated from the Thai or English title when left blank.' },
              hooks: {
                beforeValidate: [
                  ({ value, siblingData }) =>
                    slugify(String(value || siblingData?.titleTh || siblingData?.titleEn || '')),
                ],
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'excerptTh', label: 'Excerpt (Thai)', type: 'textarea' },
                { name: 'excerptEn', label: 'Excerpt (English)', type: 'textarea' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'descriptionTh', label: 'Description (Thai)', type: 'textarea' },
                { name: 'descriptionEn', label: 'Description (English)', type: 'textarea' },
              ],
            },
            {
              name: 'heroImages',
              label: 'Hero Images',
              type: 'group',
              fields: [
                {
                  name: 'vertical',
                  label: 'Vertical Hero Images',
                  type: 'array',
                  minRows: 1,
                  admin: { description: 'The first image is the primary vertical hero.' },
                  fields: [
                    { name: 'image', type: 'upload', relationTo: 'media', required: true },
                  ],
                },
                {
                  name: 'horizontal',
                  label: 'Horizontal Hero Images',
                  type: 'array',
                  minRows: 1,
                  admin: { description: 'The first image is the primary horizontal hero.' },
                  fields: [
                    { name: 'image', type: 'upload', relationTo: 'media', required: true },
                  ],
                },
              ],
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
            },
            {
              name: 'tags',
              type: 'text',
              hasMany: true,
              admin: { description: 'Add one or more article tags.' },
            },
            {
              name: 'author',
              type: 'text',
              admin: { description: 'Article author or editorial team.' },
            },
            {
              name: 'publishedDate',
              type: 'date',
              admin: {
                readOnly: true,
                date: { pickerAppearance: 'dayAndTime' },
                description: 'Automatically set the first time the article is published.',
              },
            },
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'draft',
              options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'isFeatured',
                  label: 'Featured in hero',
                  type: 'checkbox',
                  defaultValue: false,
                  index: true,
                  admin: {
                    description: 'Show this article in the final prototype hero.',
                  },
                },
                {
                  name: 'featuredUntil',
                  label: 'Featured until',
                  type: 'date',
                  index: true,
                  admin: {
                    condition: (_data, siblingData) => Boolean(siblingData?.isFeatured),
                    date: { pickerAppearance: 'dayAndTime' },
                    description: 'Optional. Leave empty to keep this article featured indefinitely.',
                  },
                },
              ],
            },
            { name: 'contentTh', label: 'Content (Thai)', type: 'richText', required: true },
            { name: 'contentEn', label: 'Content (English)', type: 'richText' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'seoTitleTh', label: 'SEO title (Thai)', type: 'text' },
                { name: 'seoTitleEn', label: 'SEO title (English)', type: 'text' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'seoDescriptionTh', label: 'SEO description (Thai)', type: 'textarea' },
                { name: 'seoDescriptionEn', label: 'SEO description (English)', type: 'textarea' },
              ],
            },
            { name: 'socialSharingImage', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },
  ],
}
