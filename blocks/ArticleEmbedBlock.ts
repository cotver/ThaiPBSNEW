import type { Block } from 'payload'

export const ArticleEmbedBlock: Block = {
  slug: 'articleEmbed',
  labels: {
    singular: 'Article Embed',
    plural: 'Article Embeds',
  },
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
      admin: {
        description: 'Choose the source for social/video embeds. Generic works for any link.',
      },
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
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Optional label shown above social and linked image embeds.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Used for image embeds. Add Link URL below to make the image clickable.',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Social/video URL, or the destination URL for a linked image.',
      },
    },
    { name: 'caption', type: 'text', localized: true },
  ],
}
