import type { Block } from 'payload'

export const ArticleImageGroupBlock: Block = {
  slug: 'articleImageGroup',
  labels: {
    singular: 'Article Image Group',
    plural: 'Article Image Groups',
  },
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
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 3,
      labels: {
        singular: 'Image',
        plural: 'Images',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          localized: true,
          admin: {
            description: 'Optional override. If blank, the media alt text is used.',
          },
        },
      ],
    },
    {
      name: 'caption',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Optional caption shown below the image group.',
      },
    },
  ],
}
