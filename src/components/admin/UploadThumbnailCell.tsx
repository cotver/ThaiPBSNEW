import type { CollectionSlug, DefaultServerCellComponentProps } from 'payload'

type MediaDoc = {
  alt?: string | null
  thumbnailURL?: string | null
  url?: string | null
}

// List-view cell for an `upload` field: shows the image instead of the file name / ID.
export const UploadThumbnailCell = async ({ cellData, field, payload }: DefaultServerCellComponentProps) => {
  let media: MediaDoc | null = cellData && typeof cellData === 'object' ? (cellData as MediaDoc) : null
  const relationTo = 'relationTo' in field && typeof field.relationTo === 'string' ? field.relationTo : 'media'

  if (!media && (typeof cellData === 'number' || typeof cellData === 'string')) {
    try {
      media = (await payload.findByID({ collection: relationTo as CollectionSlug, id: cellData, depth: 0 })) as MediaDoc
    } catch {
      media = null
    }
  }

  const src = media?.thumbnailURL || media?.url

  if (!src) {
    return <span style={{ color: 'var(--theme-elevation-400)', fontSize: 12 }}>No image</span>
  }

  return (
    <img
      alt={media?.alt || ''}
      src={src}
      style={{ aspectRatio: '1 / 1', borderRadius: 4, display: 'block', height: 44, objectFit: 'cover', width: 44 }}
    />
  )
}
