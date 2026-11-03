import type { DefaultServerCellComponentProps } from 'payload'

type MediaRow = {
  alt?: string | null
  filename?: string | null
  mimeType?: string | null
  thumbnailURL?: string | null
  url?: string | null
}

const getImageURL = (rowData: MediaRow) => rowData.thumbnailURL || rowData.url || ''

export const MediaThumbnailCell = ({ rowData }: DefaultServerCellComponentProps) => {
  const media = rowData as MediaRow
  const src = getImageURL(media)
  const isImage = media.mimeType?.startsWith('image/')

  if (!src || !isImage) {
    return <span style={{ color: '#777', fontSize: 12 }}>No preview</span>
  }

  return (
    <img
      alt={media.alt || media.filename || 'Media preview'}
      src={src}
      style={{
        aspectRatio: '4 / 3',
        background: '#f3f3f3',
        display: 'block',
        height: 56,
        objectFit: 'cover',
        width: 74
      }}
    />
  )
}
