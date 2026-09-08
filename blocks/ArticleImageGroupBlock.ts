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
      name: 'displayWidth',
      label: 'Display Width',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Full width', value: 'full' },
      ],
      admin: {
        description: 'Resizes the image block on the article page.',
      },
    },
    {
      name: 'imageFit',
      label: 'Image Fit',
      type: 'select',
      required: true,
      defaultValue: 'contain',
      options: [
        { label: 'Show full image (no crop)', value: 'contain' },
        { label: 'Fill frame (crop)', value: 'cover' },
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
