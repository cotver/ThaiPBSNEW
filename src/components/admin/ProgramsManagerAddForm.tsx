'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import { AirflowVideoAndThumbnailPicker } from './AirflowVideoPicker'
import { VideoRelationPicker } from './VideoRelationPicker'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $createTextNode,
  $applyNodeReplacement,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  type ElementFormatType,
  type EditorState,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
} from 'lexical'
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { $setBlocksType } from '@lexical/selection'
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import {
  $insertList,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@lexical/list'
import {
  $createLinkNode,
  $isLinkNode,
  LinkNode as PayloadLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@payloadcms/richtext-lexical/client'

const TYPE_OPTIONS = [
  'Short Clip', 'Trailer', 'PodCast', 'Spot', 'Filler', 'Demo',
  'Program', 'Picture', 'Poster', 'Footage',
]
const FORMAT_OPTIONS = ['', 'HD', 'UHD 4K']
const SELL_FORMAT_OPTIONS = ['HD', 'UHD 4K'] as const

type SellFormat = (typeof SELL_FORMAT_OPTIONS)[number]

type SeasonSellPricingForm = {
  readyForSale: boolean
  formatPrices: Array<{
    _key: string
    format: SellFormat
    price: number | ''
  }>
  hasCc: boolean
  ccLanguagePrices: Array<{
    _key: string
    language: number | ''
    price: number | ''
  }>
  hasAd: boolean
  adPrice: number | ''
}

type EpisodeForm = {
  _key: string
  id?: number
  ep: number | ''
  epNameTh: string
  epNameEn: string
  comingSoon: boolean
  comingSoonDate: string
  firstRun: string
  rerunDates: string[]
  synopsisEpTh: string
  synopsisEpEn: string
  TrailerAirflowProxyPath: string
  TrailerThumbnailAirflowProxyPath: string
  videoAirflowProxyPath: string
  videoThumbnailAirflowProxyPath: string
  videoLink: string
  trailerLink: string
  coverImage: number | ''
  trailer: number | ''
  video: number | ''
}

type SeasonForm = {
  _key: string
  id?: number
  season: number | ''
  seasonName: string
  seasonNameEn: string
  is_Award: boolean
  awards: SeasonAwardForm[]
  sellPricing: SeasonSellPricingForm
  hasCc: boolean
  languages: number[]
  hasSoundtrack: boolean
  languagesSoundtrack: number[]
  comingSoon: boolean
  comingSoonDate: string
  synopsisTh: string
  synopsisEn: string
  TrailerAirflowProxyPath: string
  TrailerThumbnailAirflowProxyPath: string
  videoAirflowProxyPath: string
  videoThumbnailAirflowProxyPath: string
  videoLink: string
  trailerLink: string
  coverImage: number | ''
  trailer: number | ''
  video: number | ''
  episodes: EpisodeForm[]
}

export type EditInitialData = {
  program: Record<string, unknown>
  seasons: Array<Record<string, unknown> & { episodes?: Record<string, unknown>[] }>
}

function makeKey(): string {
  // Stable key for React list rendering + reordering.
  // Avoid index keys so input state doesn't "jump" when reordering.
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

const emptyEpisode = (): EpisodeForm => ({
  _key: makeKey(),
  ep: '',
  epNameTh: '',
  epNameEn: '',
  comingSoon: false,
  comingSoonDate: '',
  firstRun: '',
  rerunDates: [''],
  synopsisEpTh: '',
  synopsisEpEn: '',
  TrailerAirflowProxyPath: '',
  TrailerThumbnailAirflowProxyPath: '',
  videoAirflowProxyPath: '',
  videoThumbnailAirflowProxyPath: '',
  videoLink: '',
  trailerLink: '',
  coverImage: '',
  trailer: '',
  video: '',
})

const emptySellPricing = (): SeasonSellPricingForm => ({
  readyForSale: false,
  formatPrices: SELL_FORMAT_OPTIONS.map((format) => ({
    _key: makeKey(),
    format,
    price: '',
  })),
  hasCc: false,
  ccLanguagePrices: [],
  hasAd: false,
  adPrice: '',
})

const emptySeasonAward = (): SeasonAwardForm => ({
  _key: makeKey(),
  awardName: '',
  awardYear: '',
  awardDetail: '',
  awardUpdatedAt: '',
})

const emptySeason = (): SeasonForm => ({
  _key: makeKey(),
  season: '',
  seasonName: '',
  seasonNameEn: '',
  is_Award: false,
  awards: [],
  sellPricing: emptySellPricing(),
  hasCc: false,
  languages: [],
  hasSoundtrack: false,
  languagesSoundtrack: [],
  comingSoon: false,
  comingSoonDate: '',
  synopsisTh: '',
  synopsisEn: '',
  TrailerAirflowProxyPath: '',
  TrailerThumbnailAirflowProxyPath: '',
  videoAirflowProxyPath: '',
  videoThumbnailAirflowProxyPath: '',
  videoLink: '',
  trailerLink: '',
  coverImage: '',
  trailer: '',
  video: '',
  episodes: [emptyEpisode()],
})

function hasEpisodeData(row: EpisodeForm) {
  return (
    row.id != null ||
    row.ep !== '' ||
    row.epNameTh.trim() !== '' ||
    row.epNameEn.trim() !== '' ||
    row.comingSoon ||
    row.comingSoonDate !== '' ||
    row.firstRun !== '' ||
    row.rerunDates.some((date) => date.trim() !== '') ||
    row.synopsisEpTh.trim() !== '' ||
    row.synopsisEpEn.trim() !== '' ||
    row.TrailerAirflowProxyPath.trim() !== '' ||
    row.TrailerThumbnailAirflowProxyPath.trim() !== '' ||
    row.videoAirflowProxyPath.trim() !== '' ||
    row.videoThumbnailAirflowProxyPath.trim() !== '' ||
    row.videoLink.trim() !== '' ||
    row.trailerLink.trim() !== '' ||
    row.coverImage !== '' ||
    row.trailer !== '' ||
    row.video !== ''
  )
}

function hasSeasonData(row: SeasonForm) {
  return (
    row.id != null ||
    row.season !== '' ||
    row.seasonName.trim() !== '' ||
    row.seasonNameEn.trim() !== '' ||
    row.is_Award ||
    row.awards.length > 0 ||
    row.hasCc ||
    row.languages.length > 0 ||
    row.hasSoundtrack ||
    row.languagesSoundtrack.length > 0 ||
    row.comingSoon ||
    row.comingSoonDate !== '' ||
    row.synopsisTh.trim() !== '' ||
    row.synopsisEn.trim() !== '' ||
    row.TrailerAirflowProxyPath.trim() !== '' ||
    row.TrailerThumbnailAirflowProxyPath.trim() !== '' ||
    row.videoAirflowProxyPath.trim() !== '' ||
    row.videoThumbnailAirflowProxyPath.trim() !== '' ||
    row.videoLink.trim() !== '' ||
    row.trailerLink.trim() !== '' ||
    row.coverImage !== '' ||
    row.trailer !== '' ||
    row.video !== '' ||
    row.episodes.some(hasEpisodeData)
  )
}

/** Parse views JSON string for payload. Supports flat { "X": 100, "Youtube": 1000 } or by month-year { "2025-02": { "X": 100, "Youtube": 1000 }, "2025-01": { ... } }. */
function parseViewsJson(s: string): Record<string, unknown> | undefined {
  const t = s.trim()
  if (!t) return undefined
  try {
    const o = JSON.parse(t) as unknown
    return typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

type MediaDoc = {
  id: number | string
  title?: string
  filename?: string
  url?: string
  thumbnailURL?: string
  mimeType?: string
}

type LinkType = 'custom' | 'internal'

type LinkableCollection = 'content' | 'programs' | 'seasons' | 'episodes' | 'landing' | 'trends' | 'videos' | 'media' | 'awards'

type InternalLinkDoc = {
  id: number | string
  title?: string
  titleTh?: string
  name?: string
  label?: string
  _displayTitle?: string
  filename?: string
  email?: string
}

type AwardLinkFields = {
  doc?: { relationTo: LinkableCollection; value: number | string } | null
  linkType: LinkType
  newTab: boolean
  url?: string
}

type AwardLinkPayload = {
  fields: AwardLinkFields
  selectedNodes?: LexicalNode[]
  text: null | string
} | null

type AwardUploadData = {
  id?: string
  fields: Record<string, unknown>
  relationTo: 'media'
  value: number | string | MediaDoc
}

type AwardImageGroupLayout = 'normal' | 'two' | 'three'

type AwardImageGroupData = {
  caption?: string
  images: Array<{
    alt?: string
    image: number | string | MediaDoc
  }>
  layout: AwardImageGroupLayout
}

type ArticleEmbedData = {
  caption?: string
  image?: number | string | MediaDoc | null
  platform?: string
  title?: string
  type: 'image' | 'video' | 'social'
  url?: string
}

type ArticleBlockFields = (AwardImageGroupData | ArticleEmbedData) & {
  blockName?: string
  blockType: 'articleImageGroup' | 'articleEmbed'
  id?: string
}

type SerializedAwardUploadNode = SerializedLexicalNode & AwardUploadData & {
  format: ElementFormatType
  type: 'upload'
  version: 3
}

type SerializedAwardImageGroupNode = SerializedLexicalNode & AwardImageGroupData & {
  format: ElementFormatType
  type: 'awardImageGroup'
  version: 1
}

type SerializedArticleBlockNode = SerializedLexicalNode & {
  fields: ArticleBlockFields
  format: ElementFormatType
  type: 'block'
  version: 2
}

function createAwardUploadNodeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `award-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createArticleBlockId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `article-block-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

class AwardUploadNode extends DecoratorBlockNode {
  __data: AwardUploadData

  constructor({ data, format, key }: { data: AwardUploadData; format?: ElementFormatType; key?: NodeKey }) {
    super(format, key)
    this.__data = {
      ...data,
      id: data.id || createAwardUploadNodeId(),
      fields: data.fields || {},
    }
  }

  static clone(node: AwardUploadNode): AwardUploadNode {
    return new AwardUploadNode({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'upload'
  }

  static importJSON(serializedNode: SerializedAwardUploadNode): AwardUploadNode {
    const node = $createAwardUploadNode({
      data: {
        id: serializedNode.id,
        fields: serializedNode.fields || {},
        relationTo: 'media',
        value: serializedNode.value,
      },
    })
    node.setFormat(serializedNode.format || '')
    return node
  }

  decorate(editor: LexicalEditor): React.JSX.Element {
    return <AwardUploadPreview data={this.__data} editor={editor} format={this.__format} nodeKey={this.getKey()} />
  }

  exportJSON(): SerializedAwardUploadNode {
    const valueId = getAwardUploadValueId(this.__data.value)
    return {
      ...super.exportJSON(),
      ...this.__data,
      value: valueId ?? this.__data.value,
      format: this.__format,
      type: 'upload',
      version: 3,
    }
  }

  setData(data: AwardUploadData): void {
    const writable = this.getWritable()
    writable.__data = data
  }
}

function $createAwardUploadNode({ data }: { data: AwardUploadData }): AwardUploadNode {
  return $applyNodeReplacement(new AwardUploadNode({ data }))
}

function $isAwardUploadNode(node: LexicalNode | null | undefined): node is AwardUploadNode {
  return node instanceof AwardUploadNode
}

class AwardImageGroupNode extends DecoratorBlockNode {
  __data: AwardImageGroupData

  constructor({ data, format, key }: { data: AwardImageGroupData; format?: ElementFormatType; key?: NodeKey }) {
    super(format, key)
    this.__data = {
      ...data,
      images: data.images.slice(0, 3),
      layout: data.layout || 'normal',
    }
  }

  static clone(node: AwardImageGroupNode): AwardImageGroupNode {
    return new AwardImageGroupNode({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'awardImageGroup'
  }

  static importJSON(serializedNode: SerializedAwardImageGroupNode): AwardImageGroupNode {
    const node = $createAwardImageGroupNode({
      data: {
        caption: serializedNode.caption,
        images: (serializedNode.images || []).slice(0, 3),
        layout: serializedNode.layout || 'normal',
      },
    })
    node.setFormat(serializedNode.format || 'center')
    return node
  }

  decorate(editor: LexicalEditor): React.JSX.Element {
    return <AwardImageGroupPreview data={this.__data} editor={editor} nodeKey={this.getKey()} />
  }

  exportJSON(): SerializedAwardImageGroupNode {
    return {
      ...super.exportJSON(),
      caption: this.__data.caption,
      images: this.__data.images.slice(0, 3).map((item) => ({
        ...item,
        image: getAwardUploadValueId(item.image) ?? item.image,
      })),
      layout: this.__data.layout,
      format: this.__format || 'center',
      type: 'awardImageGroup',
      version: 1,
    }
  }
}

function $createAwardImageGroupNode({ data }: { data: AwardImageGroupData }): AwardImageGroupNode {
  return $applyNodeReplacement(new AwardImageGroupNode({ data, format: 'center' }))
}

function $isAwardImageGroupNode(node: LexicalNode | null | undefined): node is AwardImageGroupNode {
  return node instanceof AwardImageGroupNode
}

class ArticleBlockNode extends DecoratorBlockNode {
  __fields: ArticleBlockFields

  constructor({ fields, format, key }: { fields: ArticleBlockFields; format?: ElementFormatType; key?: NodeKey }) {
    super(format, key)
    this.__fields = {
      ...fields,
      id: fields.id || createArticleBlockId(),
    }
  }

  static clone(node: ArticleBlockNode): ArticleBlockNode {
    return new ArticleBlockNode({
      fields: node.__fields,
      format: node.__format,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'block'
  }

  static importJSON(serializedNode: SerializedArticleBlockNode): ArticleBlockNode {
    const node = $createArticleBlockNode({
      fields: {
        ...serializedNode.fields,
        blockType: serializedNode.fields.blockType,
      },
    })
    node.setFormat(serializedNode.format || 'center')
    return node
  }

  decorate(editor: LexicalEditor): React.JSX.Element {
    return <ArticleBlockPreview fields={this.__fields} editor={editor} nodeKey={this.getKey()} />
  }

  exportJSON(): SerializedArticleBlockNode {
    const fields = this.__fields.blockType === 'articleImageGroup'
      ? {
          ...this.__fields,
          images: ((this.__fields as ArticleBlockFields & AwardImageGroupData).images || []).slice(0, 3).map((item) => ({
            ...item,
            image: getAwardUploadValueId(item.image) ?? item.image,
          })),
        }
      : {
          ...this.__fields,
          image: getAwardUploadValueId((this.__fields as ArticleBlockFields & ArticleEmbedData).image ?? null) ?? (this.__fields as ArticleBlockFields & ArticleEmbedData).image ?? null,
        }

    return {
      ...super.exportJSON(),
      fields,
      format: this.__format || 'center',
      type: 'block',
      version: 2,
    }
  }
}

function $createArticleBlockNode({ fields }: { fields: ArticleBlockFields }): ArticleBlockNode {
  return $applyNodeReplacement(new ArticleBlockNode({ fields, format: 'center' }))
}

function $isArticleBlockNode(node: LexicalNode | null | undefined): node is ArticleBlockNode {
  return node instanceof ArticleBlockNode
}

function getAwardUploadValueId(value: AwardUploadData['value'] | null | undefined): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && value.id != null) return value.id
  return null
}

function getAwardUploadValueDoc(value: AwardUploadData['value'] | null | undefined): MediaDoc | null {
  return value && typeof value === 'object' ? value : null
}

function normalizeImageSrc(src: string): string {
  if (!src.startsWith('http')) return src.startsWith('/') ? src : `/${src}`
  if (typeof window === 'undefined') return src
  try {
    const url = new URL(src)
    if (url.origin === window.location.origin) return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return src
  }
  return src
}

function getPayloadApiPath(): string {
  const basePath =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH
      ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '')
      : ''

  return `${basePath}/api`
}

function getPayloadApiBase(): string {
  return typeof window !== 'undefined' ? window.location.origin + getPayloadApiPath() : ''
}

function AwardUploadPreview({
  data,
  editor,
  format,
  nodeKey,
}: {
  data: AwardUploadData
  editor: LexicalEditor
  format: ElementFormatType
  nodeKey: NodeKey
}) {
  const valueDoc = getAwardUploadValueDoc(data.value)
  const valueId = getAwardUploadValueId(data.value)
  const [doc, setDoc] = React.useState<MediaDoc | null>(valueDoc)
  const base = getPayloadApiBase()

  React.useEffect(() => {
    if (valueDoc) {
      setDoc(valueDoc)
      return
    }
    if (!base || valueId == null || valueId === '') return
    fetch(`${base}/media/${encodeURIComponent(String(valueId))}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((media: MediaDoc | null) => setDoc(media))
      .catch(() => setDoc(null))
  }, [base, valueDoc, valueId])

  const src = doc?.thumbnailURL || doc?.url
  const alignClass =
    format === 'center' ? 'mx-auto' :
      format === 'right' ? 'ml-auto' :
        format === 'justify' ? 'w-full' :
          ''

  const removeUpload = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isAwardUploadNode(node)) node.remove()
    })
  }

  return (
    <div className={`w-full rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 ${alignClass}`}>
      {src ? (
        <img
          src={normalizeImageSrc(src)}
          alt={doc?.title || doc?.filename || ''}
          className="block aspect-video max-h-56 w-full rounded-t bg-black/5 object-contain"
        />
      ) : (
        <div className="flex aspect-video max-h-56 items-center justify-center rounded-t bg-gray-100 text-sm text-gray-500 dark:bg-gray-800">
          Loading image...
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
        <span className="truncate">{doc?.title || doc?.filename || (valueId != null ? `Media ${valueId}` : 'Media')}</span>
        <button
          type="button"
          className="shrink-0 rounded border border-gray-300 px-2 py-1 hover:bg-white dark:border-gray-600 dark:hover:bg-gray-800"
          onClick={removeUpload}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

function AwardImageGroupPreview({
  data,
  editor,
  nodeKey,
  onRemove,
}: {
  data: AwardImageGroupData
  editor: LexicalEditor
  nodeKey: NodeKey
  onRemove?: () => void
}) {
  const base = getPayloadApiBase()
  const [docs, setDocs] = React.useState<Record<string, MediaDoc>>(() => {
    const initial: Record<string, MediaDoc> = {}
    for (const item of data.images) {
      if (item.image && typeof item.image === 'object') initial[String(item.image.id)] = item.image
    }
    return initial
  })

  React.useEffect(() => {
    if (!base) return
    const ids = data.images
      .map((item) => getAwardUploadValueId(item.image))
      .filter((id): id is string | number => id != null && !docs[String(id)])
    if (ids.length === 0) return
    ids.forEach((id) => {
      fetch(`${base}/media/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((media: MediaDoc | null) => {
          if (media?.id != null) setDocs((prev) => ({ ...prev, [String(media.id)]: media }))
        })
        .catch(() => undefined)
    })
  }, [base, data.images, docs])

  const removeGroup = () => {
    if (onRemove) {
      onRemove()
      return
    }
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isAwardImageGroupNode(node)) node.remove()
    })
  }

  const columnClass =
    data.layout === 'normal' || data.images.length === 1
      ? 'grid-cols-1 max-w-xl'
      : data.layout === 'two' || data.images.length === 2
        ? 'grid-cols-2 max-w-3xl'
        : 'grid-cols-3 max-w-5xl'

  return (
    <div className="my-4 mx-auto rounded border border-gray-200 bg-gray-50 p-3 text-left dark:border-gray-700 dark:bg-gray-900">
      <div className={`mx-auto grid gap-3 ${columnClass}`}>
        {data.images.slice(0, 3).map((item, index) => {
          const id = getAwardUploadValueId(item.image)
          const doc = (id != null ? docs[String(id)] : null) || getAwardUploadValueDoc(item.image)
          const src = doc?.thumbnailURL || doc?.url
          return (
            <div key={`${id ?? index}`} className="overflow-hidden rounded bg-white ring-1 ring-black/10 dark:bg-gray-800">
              {src ? (
                <img src={normalizeImageSrc(src)} alt={item.alt || doc?.title || doc?.filename || ''} className="block aspect-video w-full object-contain bg-black/5" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800">Loading image...</div>
              )}
            </div>
          )
        })}
      </div>
      {data.caption ? <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">{data.caption}</p> : null}
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-white dark:border-gray-600 dark:hover:bg-gray-800"
          onClick={removeGroup}
        >
          Remove image row
        </button>
      </div>
    </div>
  )
}

function ArticleBlockPreview({
  editor,
  fields,
  nodeKey,
}: {
  editor: LexicalEditor
  fields: ArticleBlockFields
  nodeKey: NodeKey
}) {
  const removeBlock = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isArticleBlockNode(node)) node.remove()
    })
  }

  if (fields.blockType === 'articleImageGroup') {
    return (
      <div>
        <AwardImageGroupPreview data={fields as ArticleBlockFields & AwardImageGroupData} editor={editor} nodeKey={nodeKey} onRemove={removeBlock} />
      </div>
    )
  }

  return <ArticleEmbedPreview data={fields as ArticleBlockFields & ArticleEmbedData} onRemove={removeBlock} />
}

function ArticleEmbedPreview({
  data,
  onRemove,
}: {
  data: ArticleEmbedData
  onRemove: () => void
}) {
  const imageId = getAwardUploadValueId(data.image ?? null)
  const imageDoc = getAwardUploadValueDoc(data.image ?? null)
  const [doc, setDoc] = React.useState<MediaDoc | null>(imageDoc)
  const base = getPayloadApiBase()

  React.useEffect(() => {
    if (imageDoc) {
      setDoc(imageDoc)
      return
    }
    if (!base || imageId == null) return
    fetch(`${base}/media/${encodeURIComponent(String(imageId))}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((media: MediaDoc | null) => setDoc(media))
      .catch(() => setDoc(null))
  }, [base, imageDoc, imageId])

  const src = doc?.thumbnailURL || doc?.url

  return (
    <div className="my-4 mx-auto max-w-3xl rounded border border-gray-200 bg-gray-50 p-3 text-left dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Article Embed</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{data.title || data.url || data.type}</p>
        </div>
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-white dark:border-gray-600 dark:hover:bg-gray-800"
          onClick={onRemove}
        >
          Remove embed
        </button>
      </div>
      {data.type === 'image' && src ? (
        <img src={normalizeImageSrc(src)} alt={data.title || doc?.title || doc?.filename || ''} className="block max-h-72 w-full rounded bg-black/5 object-contain" />
      ) : (
        <div className="rounded bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-black/10 dark:bg-gray-800 dark:text-gray-200">
          <span className="font-semibold">{data.platform || data.type}</span>
          {data.url ? <span className="ml-2 break-all text-gray-500">{data.url}</span> : null}
        </div>
      )}
      {data.caption ? <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">{data.caption}</p> : null}
    </div>
  )
}

const LINKABLE_COLLECTIONS: Array<{ label: string; slug: LinkableCollection; titleField: keyof InternalLinkDoc }> = [
  { label: 'Content', slug: 'content', titleField: 'titleTh' },
  { label: 'Programs', slug: 'programs', titleField: '_displayTitle' },
  { label: 'Seasons', slug: 'seasons', titleField: '_displayTitle' },
  { label: 'Episodes', slug: 'episodes', titleField: '_displayTitle' },
  { label: 'Landing', slug: 'landing', titleField: 'title' },
  { label: 'Trends', slug: 'trends', titleField: 'title' },
  { label: 'Videos', slug: 'videos', titleField: 'title' },
  { label: 'Media', slug: 'media', titleField: 'title' },
  { label: 'Awards', slug: 'awards', titleField: 'name' },
]

function getInternalDocLabel(doc: InternalLinkDoc) {
  return doc._displayTitle || doc.titleTh || doc.title || doc.name || doc.label || doc.filename || doc.email || `ID ${doc.id}`
}

function normalizeCustomUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || /^[/#.]/.test(trimmed)) return trimmed
  if (trimmed.includes('@')) return `mailto:${trimmed}`
  return `https://${trimmed}`
}

function toggleAwardLink(payload: AwardLinkPayload) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) && (payload === null || !payload.selectedNodes?.length)) return

  const nodes = $isRangeSelection(selection) ? selection.extract() : payload === null ? [] : payload.selectedNodes

  if (payload === null) {
    nodes?.forEach((node) => {
      const parent = node.getParent()
      if ($isLinkNode(parent)) {
        parent.getChildren().forEach((child) => parent.insertBefore(child))
        parent.remove()
      }
    })
    return
  }

  if (nodes?.length === 1) {
    const firstNode = nodes[0]
    const existingLink = $isLinkNode(firstNode) ? firstNode : getAwardLinkAncestor(firstNode)
    if (existingLink) {
      existingLink.setFields(payload.fields as any)
      if (payload.text != null && payload.text !== existingLink.getTextContent()) {
        existingLink.append($createTextNode(payload.text))
        existingLink.getChildren().forEach((child) => {
          if (child !== existingLink.getLastChild()) child.remove()
        })
      }
      return
    }
  }

  let previousParent: LexicalNode | null = null
  let linkNode: PayloadLinkNode | null = null

  nodes?.forEach((node) => {
    const parent = node.getParent()
    if (parent === linkNode || parent === null || ($isElementNode(node) && !node.isInline())) return

    if ($isLinkNode(parent)) {
      linkNode = parent
      parent.setFields(payload.fields as any)
      return
    }

    if (!parent.is(previousParent)) {
      previousParent = parent
      linkNode = $createLinkNode({ fields: payload.fields as any })
      node.insertBefore(linkNode)
    }

    if ($isLinkNode(node)) {
      if (node.is(linkNode)) return
      if (linkNode) linkNode.append(...node.getChildren())
      node.remove()
      return
    }

    linkNode?.append(node)
  })
}

function getAwardLinkAncestor(node: LexicalNode): PayloadLinkNode | null {
  let parent: LexicalNode | null = node
  while (parent !== null) {
    parent = parent.getParent()
    if (parent === null || $isLinkNode(parent)) break
  }
  return $isLinkNode(parent) ? parent : null
}

function AwardLinkCommandPlugin() {
  const [editor] = useLexicalComposerContext()
  React.useEffect(() => {
    return editor.registerCommand(
      TOGGLE_LINK_COMMAND,
      (payload) => {
        toggleAwardLink(payload as AwardLinkPayload)
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])
  return null
}

type LanguageDoc = {
  id: number
  code?: string
  label?: string
}

type CategoryDoc = {
  id: number
  name?: string
  slug?: string
}

type GenreDoc = {
  id: number
  name?: string
  slug?: string
}

type SubGenreDoc = {
  id: number
  name?: string
  slug?: string
  genre?: number | GenreDoc | null
}

export type AwardOption = {
  id: number
  name: string
}

type SeasonAwardForm = {
  _key: string
  id?: string
  awardName: number | ''
  awardYear: number | ''
  awardDetail: unknown
  awardUpdatedAt: string
}

function LanguageMultiDropdown({
  options,
  value,
  onChange,
  buttonClassName = '',
}: {
  options: LanguageDoc[]
  value: number[]
  onChange: (next: number[]) => void
  buttonClassName?: string
}) {
  const [open, setOpen] = useState(false)

  const selectedSet = React.useMemo(() => new Set(value), [value])
  const selectedLabels = React.useMemo(() => {
    const byId = new Map(options.map((o) => [o.id, o] as const))
    const parts = value
      .map((id) => {
        const o = byId.get(id)
        if (!o) return null
        return o.label || o.code || `#${o.id}`
      })
      .filter(Boolean) as string[]
    return parts
  }, [options, value])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ||
          'w-full text-left rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2'
        }
      >
        {selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Select languages…'}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-2">
          {options.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1">No languages yet</div>
          ) : (
            <div className="space-y-1">
              {options.map((o) => {
                const label = (o.label || o.code || `#${o.id}`) + (o.code && o.label ? ` (${o.code})` : '')
                const checked = selectedSet.has(o.id)
                return (
                  <label
                    key={o.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(new Set([...value, o.id]))
                          : value.filter((id) => id !== o.id)
                        onChange(next)
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                )
              })}
            </div>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryMultiDropdown({
  options,
  value,
  onChange,
}: {
  options: CategoryDoc[]
  value: number[]
  onChange: (next: number[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedSet = React.useMemo(() => new Set(value), [value])
  const selectedLabels = React.useMemo(() => {
    const byId = new Map(options.map((option) => [option.id, option] as const))
    return value
      .map((id) => {
        const option = byId.get(id)
        if (!option) return null
        return option.name || option.slug || `#${option.id}`
      })
      .filter(Boolean) as string[]
  }, [options, value])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full text-left rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
      >
        {selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Select categories...'}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-2">
          {options.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1">No categories yet</div>
          ) : (
            <div className="space-y-1">
              {options.map((option) => {
                const checked = selectedSet.has(option.id)
                const label = option.name || option.slug || `#${option.id}`
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? Array.from(new Set([...value, option.id]))
                          : value.filter((id) => id !== option.id)
                        onChange(next)
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                )
              })}
            </div>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TaxonomyMultiDropdown({
  emptyLabel,
  noOptionsLabel,
  options,
  value,
  onChange,
}: {
  emptyLabel: string
  noOptionsLabel: string
  options: Array<{ id: number; name?: string; slug?: string }>
  value: number[]
  onChange: (next: number[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedSet = React.useMemo(() => new Set(value), [value])
  const selectedLabels = React.useMemo(() => {
    const byId = new Map(options.map((option) => [option.id, option] as const))
    return value
      .map((id) => {
        const option = byId.get(id)
        if (!option) return null
        return option.name || option.slug || `#${option.id}`
      })
      .filter(Boolean) as string[]
  }, [options, value])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full text-left rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
      >
        {selectedLabels.length > 0 ? selectedLabels.join(', ') : emptyLabel}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-2">
          {options.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1">{noOptionsLabel}</div>
          ) : (
            <div className="space-y-1">
              {options.map((option) => {
                const checked = selectedSet.has(option.id)
                const label = option.name || option.slug || `#${option.id}`
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? Array.from(new Set([...value, option.id]))
                          : value.filter((id) => id !== option.id)
                        onChange(next)
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                )
              })}
            </div>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function relationId(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : null
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return relationId((value as { id?: unknown }).id)
  }
  return null
}

function relationIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => relationId(item)).filter((id): id is number => id != null)
}

/** Payload-style image picker: card + modal with thumbnail grid and upload. */
function MediaPicker({
  value,
  onChange,
  label,
  className = '',
  initialDisplay,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  label: string
  className?: string
  /** When editing, pass the populated media doc from the server so the image shows without an extra fetch */
  initialDisplay?: MediaDoc | null
}) {
  const [mediaList, setMediaList] = useState<MediaDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const base = getPayloadApiBase()

  const loadMedia = React.useCallback(() => {
    setLoading(true)
    fetch(`${base}/media?limit=250&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((data: { docs?: MediaDoc[] }) => {
        setMediaList(data.docs ?? [])
      })
      .catch(() => setMediaList([]))
      .finally(() => setLoading(false))
  }, [base])

  React.useEffect(() => {
    if (modalOpen) loadMedia()
  }, [modalOpen, loadMedia])

  const filteredList = React.useMemo(() => {
    if (!search.trim()) return mediaList
    const q = search.toLowerCase()
    return mediaList.filter(
      (m) =>
        (m.title ?? '').toLowerCase().includes(q) ||
        (m.filename ?? '').toLowerCase().includes(q)
    )
  }, [mediaList, search])

  const fileUrl = (doc: MediaDoc) => {
    if (doc.thumbnailURL) {
      return normalizeImageSrc(doc.thumbnailURL)
    }
    if (doc.url) {
      return normalizeImageSrc(doc.url)
    }
    return `${getPayloadApiPath()}/media/${doc.id}/file`
  }

  const handleFile = React.useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${base}/media`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || err.errors?.[0]?.message || res.statusText)
        }
        const data = await res.json()
        const doc: MediaDoc = data.doc ?? data
        if (doc?.id != null) {
          setMediaList((prev) => [...prev, doc])
          onChange(Number(doc.id))
          setModalOpen(false)
        }
      } finally {
        setUploading(false)
      }
    },
    [base, onChange]
  )

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const [singleDoc, setSingleDoc] = useState<MediaDoc | null>(null)
  const valueId = value === '' ? null : value
  React.useEffect(() => {
    if (valueId == null) {
      setSingleDoc(null)
      return
    }
    const inList = mediaList.find((m) => String(m.id) === String(valueId))
    if (inList) {
      setSingleDoc(inList)
      return
    }
    fetch(`${base}/media/${valueId}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { doc?: MediaDoc } | MediaDoc | null) => {
        const doc = data && typeof data === 'object'
          ? ('doc' in data && data.doc != null ? data.doc : 'id' in data ? (data as MediaDoc) : null)
          : null
        setSingleDoc(doc ?? null)
      })
      .catch(() => setSingleDoc(null))
  }, [valueId, base, mediaList])

  const selectedDisplay = valueId != null
    ? (mediaList.find((m) => String(m.id) === String(valueId)) ?? singleDoc ?? (initialDisplay && String(initialDisplay.id) === String(valueId) ? initialDisplay : null))
    : null
  const selectedUrl = selectedDisplay ? fileUrl(selectedDisplay) : null

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        {value !== '' ? (
          <div className="flex items-center gap-3 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-3 min-h-[80px]">
            <div className="relative w-16 h-16 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
              {selectedUrl ? (
                <Image
                  src={selectedUrl}
                  alt={selectedDisplay?.title || selectedDisplay?.filename || ''}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  …
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedDisplay?.title || selectedDisplay?.filename || `Media ${value}`}
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            Select image
          </button>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Select image"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select image</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <input
                type="text"
                placeholder="Search by title or filename…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`rounded border-2 border-dashed p-4 text-center text-sm transition-colors ${dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                  }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  id={`upload-${label.replace(/\s/g, '-')}`}
                  disabled={uploading}
                  onChange={onFileInput}
                />
                <label
                  htmlFor={`upload-${label.replace(/\s/g, '-')}`}
                  className="cursor-pointer text-gray-600 dark:text-gray-400"
                >
                  {uploading ? 'Uploading…' : 'Drop an image here or click to upload'}
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : filteredList.length === 0 ? (
                <p className="text-sm text-gray-500">No images found. Upload one above.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {filteredList.map((doc) => {
                    const url = fileUrl(doc)
                    const id = typeof doc.id === 'number' ? doc.id : Number(doc.id)
                    const isSelected = valueId === id || String(valueId) === String(doc.id)
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          onChange(Number(doc.id))
                          setModalOpen(false)
                        }}
                        className={`rounded border-2 p-1 text-left transition-colors ${isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                      >
                        <div className="relative aspect-square rounded bg-gray-100 dark:bg-gray-800 overflow-hidden mb-1">
                          <Image
                            src={url}
                            alt={doc.title || doc.filename || ''}
                            fill
                            sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 160px"
                            className="object-cover"
                            onError={(e) => {
                              ; (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={doc.title || doc.filename}>
                          {doc.title || doc.filename || `#${doc.id}`}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function toRelId(v: unknown): number | '' {
  if (v == null) return ''
  if (typeof v === 'number') return v
  if (typeof v === 'object' && v !== null && 'id' in v) return Number((v as { id: unknown }).id) || ''
  return Number(v) || ''
}

function toRelIds(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => toRelId(x))
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0)
}

function toOptionalPrice(v: unknown): number | '' {
  if (v == null || v === '') return ''
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : ''
}

function normalizeSellPricing(v: unknown): SeasonSellPricingForm {
  const source = v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const rawFormatPrices = Array.isArray(source.formatPrices) ? source.formatPrices : []
  const formatPrices = SELL_FORMAT_OPTIONS.map((format) => {
    const existing = rawFormatPrices.find((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
      return row.format === format
    })
    const row = existing && typeof existing === 'object' ? (existing as Record<string, unknown>) : {}
    return {
      _key: makeKey(),
      format,
      price: toOptionalPrice(row.price),
    }
  })
  const rawCcLanguagePrices = Array.isArray(source.ccLanguagePrices) ? source.ccLanguagePrices : []
  return {
    readyForSale: Boolean(source.readyForSale),
    formatPrices,
    hasCc: Boolean(source.hasCc),
    ccLanguagePrices: rawCcLanguagePrices.map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
      return {
        _key: makeKey(),
        language: toRelId(row.language),
        price: toOptionalPrice(row.price),
      }
    }),
    hasAd: Boolean(source.hasAd),
    adPrice: toOptionalPrice(source.adPrice),
  }
}

function buildSellPricingPayload(pricing: SeasonSellPricingForm, isIpProgram: boolean) {
  return {
    readyForSale: isIpProgram ? Boolean(pricing.readyForSale) : false,
    formatPrices: pricing.formatPrices
      .filter((row) => row.price !== '')
      .map((row) => ({
        format: row.format,
        price: Number(row.price),
      })),
    hasCc: Boolean(pricing.hasCc),
    ccLanguagePrices: pricing.hasCc
      ? pricing.ccLanguagePrices
          .filter((row) => row.language !== '' && row.price !== '')
          .map((row) => ({
            language: row.language,
            price: Number(row.price),
          }))
      : [],
    hasAd: Boolean(pricing.hasAd),
    adPrice: pricing.hasAd && pricing.adPrice !== '' ? Number(pricing.adPrice) : null,
  }
}

function payloadErrorMessage(error: unknown, fallback: string) {
  const record = error && typeof error === 'object' ? (error as Record<string, unknown>) : {}
  const topMessage = typeof record.message === 'string' ? record.message : ''
  const errors = Array.isArray(record.errors) ? record.errors : []
  const details = errors.flatMap((item) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const message = typeof row.message === 'string' ? row.message : ''
    const field = typeof row.field === 'string' ? row.field : typeof row.path === 'string' ? row.path : ''
    const data = row.data && typeof row.data === 'object' ? (row.data as Record<string, unknown>) : {}
    const nestedErrors = Array.isArray(data.errors) ? data.errors : []
    const nested = nestedErrors
      .map((nestedItem) => {
        const nestedRow = nestedItem && typeof nestedItem === 'object' ? (nestedItem as Record<string, unknown>) : {}
        const nestedMessage = typeof nestedRow.message === 'string' ? nestedRow.message : ''
        const nestedField = typeof nestedRow.field === 'string' ? nestedRow.field : typeof nestedRow.path === 'string' ? nestedRow.path : ''
        return nestedMessage ? `${nestedField ? `${nestedField}: ` : ''}${nestedMessage}` : ''
      })
      .filter(Boolean)

    if (nested.length > 0) return nested
    return message ? [`${field ? `${field}: ` : ''}${message}`] : []
  })

  return [topMessage, ...details].filter(Boolean).join(' | ') || fallback
}

function toMediaDoc(v: unknown): MediaDoc | null {
  if (v == null) return null
  if (typeof v === 'object' && v !== null && 'id' in v) {
    const o = v as Record<string, unknown>
    return { id: o.id as number | string, title: o.title as string | undefined, filename: o.filename as string | undefined, url: o.url as string | undefined, thumbnailURL: o.thumbnailURL as string | undefined, mimeType: o.mimeType as string | undefined }
  }
  return null
}
function toDateStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.slice(0, 10)
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return ''
}
/** Ensure datetime-local input value uses 4-digit year + no seconds */
function normalizeDateTimeLocal(v: string): string {
  const s = String(v || '').trim()
  if (!s) return ''

  // Accept YYYY-MM-DDTHH:mm or ISO variants with seconds / Z / expanded year
  const m = s.match(/^([+-]?\d{4,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return s

  const rawYearWithSign = m[1]
  const rawYear = rawYearWithSign.startsWith('+') ? rawYearWithSign.slice(1) : rawYearWithSign
  // If server sends expanded/zero-padded years (e.g. 002026) we want 2026 (last 4).
  // If user accidentally types extra digits into a 4-digit year field (e.g. 202666),
  // we want to keep the intended year 2026 (first 4), not 2666 (last 4).
  const yearDigits =
    rawYear.length > 4
      ? rawYear.startsWith('0')
        ? rawYear.slice(-4)
        : rawYear.slice(0, 4)
      : rawYear.padStart(4, '0')
  const year = yearDigits
  return `${year}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`
}
/** Format for datetime-local input: YYYY-MM-DDTHH:mm (local time) */
function toDateTimeStr(v: unknown): string {
  if (v == null) return ''
  const d = typeof v === 'string' ? new Date(v) : v instanceof Date ? v : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const y = String(d.getFullYear()).padStart(4, '0').slice(-4)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

type LexicalTextNode = { text?: string; children?: LexicalTextNode[] }
const EMPTY_AWARD_OPTIONS: AwardOption[] = []

function lexicalToPlainText(content: unknown): string {
  if (content == null) return ''
  const root = typeof content === 'object' && content !== null && 'root' in content
    ? (content as { root?: LexicalTextNode }).root
    : (content as LexicalTextNode)
  if (!root || typeof root !== 'object') return ''
  const collect = (node: LexicalTextNode): string => {
    if (node.text) return node.text
    return Array.isArray(node.children) ? node.children.map(collect).join(' ') : ''
  }
  return collect(root).trim()
}

function plainTextToLexical(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              text: trimmed,
              mode: 'normal',
              style: '',
              detail: 0,
              format: 0,
              version: 1,
            },
          ],
          direction: null,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: null,
    },
  }
}

function normalizeLexicalValue(value: unknown) {
  if (value && typeof value === 'object') return value
  if (typeof value === 'string') return plainTextToLexical(value)
  return null
}

function AwardDetailRichTextEditor({
  value,
  onChange,
}: {
  value: unknown
  onChange: (next: unknown) => void
}) {
  const [editor, setEditor] = React.useState<LexicalEditor | null>(null)
  const [mediaList, setMediaList] = React.useState<MediaDoc[]>([])
  const [mediaModalOpen, setMediaModalOpen] = React.useState(false)
  const [mediaInsertFormat, setMediaInsertFormat] = React.useState<ElementFormatType>('')
  const [mediaModalMode, setMediaModalMode] = React.useState<'single' | 'group' | 'embedImage'>('single')
  const [selectedImageGroup, setSelectedImageGroup] = React.useState<MediaDoc[]>([])
  const [mediaSearch, setMediaSearch] = React.useState('')
  const [mediaLoading, setMediaLoading] = React.useState(false)
  const [articleEmbedModalOpen, setArticleEmbedModalOpen] = React.useState(false)
  const [articleEmbedType, setArticleEmbedType] = React.useState<ArticleEmbedData['type']>('social')
  const [articleEmbedPlatform, setArticleEmbedPlatform] = React.useState('generic')
  const [articleEmbedTitle, setArticleEmbedTitle] = React.useState('')
  const [articleEmbedUrl, setArticleEmbedUrl] = React.useState('')
  const [articleEmbedCaption, setArticleEmbedCaption] = React.useState('')
  const [articleEmbedImage, setArticleEmbedImage] = React.useState<MediaDoc | null>(null)
  const [linkModalOpen, setLinkModalOpen] = React.useState(false)
  const [linkType, setLinkType] = React.useState<LinkType>('custom')
  const [linkText, setLinkText] = React.useState('')
  const [linkUrl, setLinkUrl] = React.useState('')
  const [linkNewTab, setLinkNewTab] = React.useState(false)
  const [linkCollection, setLinkCollection] = React.useState<LinkableCollection>('content')
  const [linkDocs, setLinkDocs] = React.useState<InternalLinkDoc[]>([])
  const [linkDocId, setLinkDocId] = React.useState<string>('')
  const [linkSearch, setLinkSearch] = React.useState('')
  const [linkDocsLoading, setLinkDocsLoading] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const editorNamespace = React.useId()
  const base = getPayloadApiBase()

  const initialEditorState = React.useMemo(() => {
    const normalized = normalizeLexicalValue(value)
    return normalized ? JSON.stringify(normalized) : undefined
  }, [])

  const applyBlock = (type: 'paragraph' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    editor?.focus(() => {
      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return
        if (type === 'paragraph') {
          $setBlocksType(selection, () => $createParagraphNode())
        } else if (type === 'quote') {
          $setBlocksType(selection, () => $createQuoteNode())
        } else {
          $setBlocksType(selection, () => $createHeadingNode(type))
        }
      })
    })
  }

  const openLinkModal = () => {
    let selectedText = ''
    editor?.getEditorState().read(() => {
      selectedText = $getSelection()?.getTextContent() ?? ''
    })
    setLinkText(selectedText)
    setLinkUrl('')
    setLinkNewTab(false)
    setLinkType('custom')
    setLinkCollection('content')
    setLinkDocId('')
    setLinkSearch('')
    setLinkModalOpen(true)
  }

  const submitLink = () => {
    if (!editor) return
    const text = linkText.trim()
    if (!text) return

    const fields: AwardLinkFields = linkType === 'internal'
      ? {
          doc: linkDocId ? { relationTo: linkCollection, value: Number.isNaN(Number(linkDocId)) ? linkDocId : Number(linkDocId) } : null,
          linkType: 'internal',
          newTab: linkNewTab,
        }
      : {
          doc: null,
          linkType: 'custom',
          newTab: linkNewTab,
          url: normalizeCustomUrl(linkUrl),
        }

    if (fields.linkType === 'custom' && !fields.url) return
    if (fields.linkType === 'internal' && !fields.doc?.value) return

    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection) && selection.isCollapsed()) {
        const linkNode = $createLinkNode({ fields: fields as any })
        linkNode.append($createTextNode(text))
        $insertNodes([linkNode])
        return
      }
      toggleAwardLink({ fields, text })
    })
    setLinkModalOpen(false)
  }

  const insertMedia = (doc: MediaDoc) => {
    if (!editor || doc.id == null) return
    editor.update(() => {
      const uploadNode = $createAwardUploadNode({
        data: {
          relationTo: 'media',
          value: typeof doc.id === 'number' ? doc.id : Number.isNaN(Number(doc.id)) ? doc.id : Number(doc.id),
          fields: {},
        },
      })
      uploadNode.setFormat(mediaInsertFormat)
      $insertNodes([uploadNode])
    })
    setMediaModalOpen(false)
    setMediaInsertFormat('')
  }

  const toggleGroupImage = (doc: MediaDoc) => {
    setSelectedImageGroup((prev) => {
      if (prev.some((item) => item.id === doc.id)) return prev.filter((item) => item.id !== doc.id)
      if (prev.length >= 3) return prev
      return [...prev, doc]
    })
  }

  const insertImageGroup = () => {
    if (!editor || selectedImageGroup.length === 0) return
    const count = selectedImageGroup.length
    editor.update(() => {
      $insertNodes([
        $createArticleBlockNode({
          fields: {
            blockName: '',
            blockType: 'articleImageGroup',
            layout: count >= 3 ? 'three' : count === 2 ? 'two' : 'normal',
            images: selectedImageGroup.slice(0, 3).map((doc) => ({
              image: typeof doc.id === 'number' ? doc.id : Number.isNaN(Number(doc.id)) ? doc.id : Number(doc.id),
              alt: doc.title || doc.filename || '',
            })),
          },
        }),
      ])
    })
    setSelectedImageGroup([])
    setMediaModalOpen(false)
  }

  const openArticleEmbedModal = () => {
    setArticleEmbedType('social')
    setArticleEmbedPlatform('generic')
    setArticleEmbedTitle('')
    setArticleEmbedUrl('')
    setArticleEmbedCaption('')
    setArticleEmbedImage(null)
    setArticleEmbedModalOpen(true)
  }

  const submitArticleEmbed = () => {
    if (!editor) return
    if (articleEmbedType === 'image' && !articleEmbedImage) return
    if (articleEmbedType !== 'image' && !articleEmbedUrl.trim()) return

    editor.update(() => {
      $insertNodes([
        $createArticleBlockNode({
          fields: {
            blockName: '',
            blockType: 'articleEmbed',
            caption: articleEmbedCaption.trim(),
            image: articleEmbedImage
              ? typeof articleEmbedImage.id === 'number'
                ? articleEmbedImage.id
                : Number.isNaN(Number(articleEmbedImage.id))
                  ? articleEmbedImage.id
                  : Number(articleEmbedImage.id)
              : null,
            platform: articleEmbedPlatform,
            title: articleEmbedTitle.trim(),
            type: articleEmbedType,
            url: articleEmbedUrl.trim(),
          },
        }),
      ])
    })
    setArticleEmbedModalOpen(false)
  }

  const loadMedia = React.useCallback(() => {
    if (!base) return
    setMediaLoading(true)
    fetch(`${base}/media?limit=250&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((data: { docs?: MediaDoc[] }) => setMediaList(data.docs ?? []))
      .catch(() => setMediaList([]))
      .finally(() => setMediaLoading(false))
  }, [base])

  React.useEffect(() => {
    if (mediaModalOpen) loadMedia()
  }, [mediaModalOpen, loadMedia])

  const loadLinkDocs = React.useCallback(() => {
    if (!base || !linkModalOpen || linkType !== 'internal') return
    const query = linkSearch.trim()
    const titleField = LINKABLE_COLLECTIONS.find((collection) => collection.slug === linkCollection)?.titleField ?? 'id'
    const searchParam = query
      ? `&where[or][0][${String(titleField)}][contains]=${encodeURIComponent(query)}&where[or][1][id][equals]=${encodeURIComponent(query)}`
      : ''
    setLinkDocsLoading(true)
    fetch(`${base}/${linkCollection}?limit=100&depth=0${searchParam}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((data: { docs?: InternalLinkDoc[] }) => setLinkDocs(data.docs ?? []))
      .catch(() => setLinkDocs([]))
      .finally(() => setLinkDocsLoading(false))
  }, [base, linkCollection, linkModalOpen, linkSearch, linkType])

  React.useEffect(() => {
    loadLinkDocs()
  }, [loadLinkDocs])

  const filteredMedia = React.useMemo(() => {
    const query = mediaSearch.trim().toLowerCase()
    if (!query) return mediaList
    return mediaList.filter((doc) =>
      (doc.title ?? '').toLowerCase().includes(query) ||
      (doc.filename ?? '').toLowerCase().includes(query)
    )
  }, [mediaList, mediaSearch])

  const mediaFileUrl = (doc: MediaDoc) => {
    if (doc.thumbnailURL) return normalizeImageSrc(doc.thumbnailURL)
    if (doc.url) return normalizeImageSrc(doc.url)
    return `${getPayloadApiPath()}/media/${doc.id}/file`
  }

  const handleImageFile = async (file: File) => {
    if (!editor || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${base}/media`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.errors?.[0]?.message || res.statusText)
      }
      const data = await res.json()
      const doc = data.doc ?? data
      if (doc?.id != null) {
        setMediaList((prev) => [...prev, doc])
        if (mediaModalMode === 'embedImage') {
          setArticleEmbedImage(doc)
        } else if (mediaModalMode === 'group') {
          setSelectedImageGroup((prev) => prev.length >= 3 ? prev : [...prev, doc])
        } else {
          insertMedia(doc)
        }
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const runEditorCommand = <T,>(
    command: Parameters<LexicalEditor['dispatchCommand']>[0],
    payload: T,
  ) => {
    if (!editor) return
    editor.focus(() => {
      editor.dispatchCommand(command, payload as never)
    })
  }

  const runListCommand = (listType: 'bullet' | 'number' | 'check') => {
    if (!editor) return
    editor.update(() => {
      $insertList(listType)
    })
  }

  const toolbarButtonClass = 'inline-flex h-8 items-center justify-center rounded border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
  const toolbarIconButtonClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded border border-transparent bg-white px-2 text-sm text-gray-800 hover:border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:bg-gray-700'

  return (
    <div className="rounded border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
      <LexicalComposer
        initialConfig={{
          namespace: `award-detail-${editorNamespace}`,
          editorState: initialEditorState,
          nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, PayloadLinkNode, AwardUploadNode, AwardImageGroupNode, ArticleBlockNode],
          onError(error) {
            throw error
          },
          theme: {
            heading: {
              h1: 'text-2xl font-bold',
              h2: 'text-xl font-bold',
              h3: 'text-lg font-semibold',
              h4: 'text-base font-semibold',
              h5: 'text-sm font-semibold',
              h6: 'text-xs font-semibold',
            },
            quote: 'border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-700 dark:text-gray-300',
            list: {
              ul: 'list-disc pl-6',
              ol: 'list-decimal pl-6',
              checklist: 'm-0 p-0',
              listitem: 'my-1 ml-4',
              listitemChecked: "relative my-1 ml-6 list-none line-through text-gray-500 before:absolute before:-left-6 before:top-0 before:h-4 before:w-4 before:rounded before:border before:border-blue-600 before:bg-blue-600 before:content-[''] after:absolute after:-left-[18px] after:top-[3px] after:h-2 after:w-1 after:rotate-45 after:border-b-2 after:border-r-2 after:border-white after:content-['']",
              listitemUnchecked: "relative my-1 ml-6 list-none before:absolute before:-left-6 before:top-0 before:h-4 before:w-4 before:rounded before:border before:border-gray-400 before:bg-white before:content-['']",
            },
            text: {
              bold: 'font-bold',
              italic: 'italic',
              underline: 'underline',
              strikethrough: 'line-through',
              subscript: 'align-sub text-[0.75em]',
              superscript: 'align-super text-[0.75em]',
              code: 'rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-gray-700',
            },
            link: 'text-blue-700 underline decoration-blue-500 decoration-2 underline-offset-2 hover:text-blue-800 dark:text-blue-300 dark:decoration-blue-300',
            upload: 'my-3 mx-[1%] inline-block w-[31%] max-w-[31%] align-top text-left max-sm:mx-0 max-sm:w-full max-sm:max-w-full',
          },
        }}
      >
        <div
          className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="flex overflow-hidden rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_TEXT_COMMAND, 'bold')}
              aria-label="Bold"
              title="Bold"
            >
              <span className="font-bold leading-none">B</span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_TEXT_COMMAND, 'italic')}
              aria-label="Italic"
              title="Italic"
            >
              <span className="italic leading-none">I</span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_TEXT_COMMAND, 'underline')}
              aria-label="Underline"
              title="Underline"
            >
              <span className="underline underline-offset-4 leading-none">U</span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
              aria-label="Strikethrough"
              title="Strikethrough"
            >
              <span className="line-through leading-none">S</span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_TEXT_COMMAND, 'subscript')}
              aria-label="Subscript"
              title="Subscript"
            >
              <span className="leading-none">X<sub>2</sub></span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_TEXT_COMMAND, 'superscript')}
              aria-label="Superscript"
              title="Superscript"
            >
              <span className="leading-none">X<sup>2</sup></span>
            </button>
          </div>
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={() => runEditorCommand(FORMAT_TEXT_COMMAND, 'code')}
            aria-label="Code"
            title="Code"
          >
            <span className="font-mono text-[11px] leading-none">{'<>'}</span>
          </button>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex overflow-hidden rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_ELEMENT_COMMAND, 'left')}
              aria-label="Align left"
              title="Align left"
            >
              <span className="grid w-4 gap-0.5">
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-3 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-2 bg-current" />
              </span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_ELEMENT_COMMAND, 'center')}
              aria-label="Align center"
              title="Align center"
            >
              <span className="grid w-4 justify-items-center gap-0.5">
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-3 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-2 bg-current" />
              </span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_ELEMENT_COMMAND, 'right')}
              aria-label="Align right"
              title="Align right"
            >
              <span className="grid w-4 justify-items-end gap-0.5">
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-3 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-2 bg-current" />
              </span>
            </button>
            <button
              type="button"
              className={toolbarIconButtonClass}
              onClick={() => runEditorCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
              aria-label="Justify"
              title="Justify"
            >
              <span className="grid w-4 gap-0.5">
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
              </span>
            </button>
          </div>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={() => applyBlock('paragraph')}
            aria-label="Paragraph"
            title="Paragraph"
          >
            <span className="font-serif text-base leading-none">¶</span>
          </button>
          {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((heading) => (
            <button key={heading} type="button" className={toolbarButtonClass} onClick={() => applyBlock(heading)}>{heading.toUpperCase()}</button>
          ))}
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={() => applyBlock('quote')}
            aria-label="Quote"
            title="Quote"
          >
            <span className="font-serif text-lg leading-none">“</span>
          </button>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={() => runListCommand('bullet')}
            aria-label="Bullet list"
            title="Bullet list"
          >
            <span className="grid w-5 gap-1" aria-hidden>
              <span className="grid grid-cols-[4px_1fr] items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-0.5 w-3.5 bg-current" />
              </span>
              <span className="grid grid-cols-[4px_1fr] items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-0.5 w-3.5 bg-current" />
              </span>
            </span>
          </button>
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={() => runListCommand('number')}
            aria-label="Numbered list"
            title="Numbered list"
          >
            <span className="grid w-6 gap-0.5 text-[10px] leading-none" aria-hidden>
              <span className="grid grid-cols-[8px_1fr] items-center gap-1">
                <span>1</span>
                <span className="h-0.5 w-3.5 bg-current" />
              </span>
              <span className="grid grid-cols-[8px_1fr] items-center gap-1">
                <span>2</span>
                <span className="h-0.5 w-3.5 bg-current" />
              </span>
            </span>
          </button>
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={() => runListCommand('check')}
            aria-label="Checklist"
            title="Checklist"
          >
            <span className="grid w-5 gap-1" aria-hidden>
              <span className="grid grid-cols-[8px_1fr] items-center gap-1">
                <span className="relative h-2 w-2 rounded-[2px] border border-current">
                  <span className="absolute left-[2px] top-0 h-1.5 w-1 rotate-45 border-b border-r border-current" />
                </span>
                <span className="h-0.5 w-3 bg-current" />
              </span>
              <span className="grid grid-cols-[8px_1fr] items-center gap-1">
                <span className="h-2 w-2 rounded-[2px] border border-current" />
                <span className="h-0.5 w-3 bg-current" />
              </span>
            </span>
          </button>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={openLinkModal}
            aria-label="Add link"
            title="Add link"
          >
            <span className="text-base leading-none">∞</span>
          </button>
          <button
            type="button"
            className={toolbarIconButtonClass}
            onClick={() => runEditorCommand(TOGGLE_LINK_COMMAND, null)}
            aria-label="Remove link"
            title="Remove link"
          >
            <span className="text-base leading-none">⊘</span>
          </button>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            className={toolbarButtonClass}
            disabled={uploading}
            onClick={() => {
              setMediaModalMode('single')
              setMediaInsertFormat('')
              setSelectedImageGroup([])
              setMediaModalOpen(true)
            }}
          >
            {uploading ? 'Uploading...' : '▧ Image'}
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={openArticleEmbedModal}
          >
            ◇ Embed
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            disabled={uploading}
            onClick={() => {
              setMediaModalMode('group')
              setMediaInsertFormat('')
              setSelectedImageGroup([])
              setMediaModalOpen(true)
            }}
          >
            ▦ Image row
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImageFile(file)
            }}
          />
        </div>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[180px] px-3 py-2 text-center outline-none prose prose-sm dark:prose-invert max-w-none [&>blockquote]:text-left [&>h1]:text-left [&>h2]:text-left [&>h3]:text-left [&>h4]:text-left [&>h5]:text-left [&>h6]:text-left [&>ol]:text-left [&>p]:text-left [&>ul]:text-left" />
          }
          placeholder={<div className="pointer-events-none -mt-[172px] px-3 py-2 text-sm text-gray-400">Award detail...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <AwardLinkCommandPlugin />
        <OnChangePlugin
          onChange={(editorState: EditorState, lexicalEditor: LexicalEditor) => {
            onChange(editorState.toJSON())
          }}
        />
        <EditorCapturePlugin onReady={setEditor} />
      </LexicalComposer>
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold">Edit link</h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 overflow-auto p-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Text to display</span>
                <input
                  type="text"
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </label>
              <div>
                <span className="mb-2 block text-sm font-medium">Link type</span>
                <div className="flex rounded border border-gray-300 dark:border-gray-600 overflow-hidden">
                  {(['custom', 'internal'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLinkType(type)}
                      className={`flex-1 px-3 py-2 text-sm ${linkType === type ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800'}`}
                    >
                      {type === 'custom' ? 'Custom URL' : 'Internal Link'}
                    </button>
                  ))}
                </div>
              </div>
              {linkType === 'custom' ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">URL</span>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(event) => setLinkUrl(event.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Collection</span>
                      <select
                        value={linkCollection}
                        onChange={(event) => {
                          setLinkCollection(event.target.value as LinkableCollection)
                          setLinkDocId('')
                        }}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                      >
                        {LINKABLE_COLLECTIONS.map((collection) => (
                          <option key={collection.slug} value={collection.slug}>{collection.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Search</span>
                      <input
                        type="search"
                        value={linkSearch}
                        onChange={(event) => setLinkSearch(event.target.value)}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                      />
                    </label>
                  </div>
                  <div className="max-h-60 overflow-auto rounded border border-gray-200 dark:border-gray-700">
                    {linkDocsLoading ? (
                      <div className="p-3 text-sm text-gray-500">Loading documents...</div>
                    ) : linkDocs.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No documents found.</div>
                    ) : (
                      linkDocs.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setLinkDocId(String(doc.id))}
                          className={`block w-full border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 dark:border-gray-800 ${linkDocId === String(doc.id) ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                          <span className="block truncate font-medium">{getInternalDocLabel(doc)}</span>
                          <span className="block text-xs text-gray-500">ID {doc.id}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(event) => setLinkNewTab(event.target.checked)}
                />
                Open in new tab
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitLink}
                className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
                disabled={!linkText.trim() || (linkType === 'custom' ? !linkUrl.trim() : !linkDocId)}
              >
                Apply link
              </button>
            </div>
          </div>
        </div>
      )}
      {articleEmbedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold">Article Embed</h3>
              <button
                type="button"
                onClick={() => setArticleEmbedModalOpen(false)}
                className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 overflow-auto p-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Type</span>
                <select
                  value={articleEmbedType}
                  onChange={(event) => setArticleEmbedType(event.target.value as ArticleEmbedData['type'])}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="image">Image</option>
                  <option value="video">Video URL</option>
                  <option value="social">Social Embed URL</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Platform</span>
                <select
                  value={articleEmbedPlatform}
                  onChange={(event) => setArticleEmbedPlatform(event.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                >
                  {['facebook', 'instagram', 'tiktok', 'x', 'youtube', 'vimeo', 'generic'].map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Title</span>
                <input
                  value={articleEmbedTitle}
                  onChange={(event) => setArticleEmbedTitle(event.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </label>
              {articleEmbedType === 'image' ? (
                <div>
                  <span className="mb-1 block text-sm font-medium">Image</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaModalMode('embedImage')
                        setMediaModalOpen(true)
                      }}
                      className="rounded bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      Select image
                    </button>
                    <span className="truncate text-sm text-gray-600 dark:text-gray-300">
                      {articleEmbedImage?.title || articleEmbedImage?.filename || (articleEmbedImage ? `Media ${articleEmbedImage.id}` : 'No image selected')}
                    </span>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">URL</span>
                  <input
                    value={articleEmbedUrl}
                    onChange={(event) => setArticleEmbedUrl(event.target.value)}
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                    placeholder="https://..."
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Caption</span>
                <textarea
                  value={articleEmbedCaption}
                  onChange={(event) => setArticleEmbedCaption(event.target.value)}
                  className="min-h-20 w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                type="button"
                onClick={() => setArticleEmbedModalOpen(false)}
                className="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitArticleEmbed}
                disabled={articleEmbedType === 'image' ? !articleEmbedImage : !articleEmbedUrl.trim()}
                className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
              >
                Insert embed
              </button>
            </div>
          </div>
        </div>
      )}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 p-4">
              <div>
                <h3 className="text-lg font-semibold">{mediaModalMode === 'group' ? 'Select image row' : 'Select image'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {mediaModalMode === 'group' ? `Choose 1-3 images. Selected ${selectedImageGroup.length}/3.` : 'Choose from Media or upload a new image.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMediaModalOpen(false)}
                className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 dark:border-gray-700 p-4">
              <input
                type="search"
                value={mediaSearch}
                onChange={(event) => setMediaSearch(event.target.value)}
                placeholder="Search media..."
                className="min-w-[240px] flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded bg-gray-700 text-white px-3 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload image'}
              </button>
            </div>
            <div className="overflow-auto p-4">
              {mediaLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading media...</div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No images found.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {filteredMedia.map((doc) => {
                    const selected = mediaModalMode === 'embedImage'
                      ? articleEmbedImage?.id === doc.id
                      : selectedImageGroup.some((item) => item.id === doc.id)
                    const disabled = mediaModalMode === 'group' && !selected && selectedImageGroup.length >= 3
                    return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        if (mediaModalMode === 'group') toggleGroupImage(doc)
                        else if (mediaModalMode === 'embedImage') {
                          setArticleEmbedImage(doc)
                          setMediaModalOpen(false)
                        } else insertMedia(doc)
                      }}
                      disabled={disabled}
                      className={`group rounded border overflow-hidden bg-gray-50 text-left hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-gray-800 ${selected ? 'border-blue-600 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <span className="relative block aspect-video bg-gray-100 dark:bg-gray-900">
                        <Image src={mediaFileUrl(doc)} alt="" fill sizes="180px" className="object-cover" />
                        {selected ? <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">Selected</span> : null}
                      </span>
                      <span className="block truncate px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200">
                        {doc.title || doc.filename || `Media ${doc.id}`}
                      </span>
                    </button>
                    )
                  })}
                </div>
              )}
            </div>
            {mediaModalMode === 'group' ? (
              <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageGroup([])
                    setMediaModalOpen(false)
                  }}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertImageGroup}
                  disabled={selectedImageGroup.length === 0}
                  className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  Insert image row
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function EditorCapturePlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()
  React.useEffect(() => {
    onReady(editor)
  }, [editor, onReady])
  return null
}

function buildSeasonAwardsPayload(season: SeasonForm) {
  if (!season.is_Award) return []
  return season.awards
    .filter((award) => award.awardName !== '' && award.awardYear !== '')
    .map((award) => ({
      ...(award.id ? { id: award.id } : {}),
      awardName: award.awardName,
      awardYear: Number(award.awardYear),
      awardDetail: normalizeLexicalValue(award.awardDetail),
      awardUpdatedAt: award.awardUpdatedAt || undefined,
    }))
}

export function ProgramsManagerAddForm(props?: {
  initialData?: EditInitialData
  programDbId?: number
  /** Field labels from payload.config (programs collection); when provided, labels match default page */
  programFieldLabels?: Record<string, string>
  awardOptions?: AwardOption[]
}) {
  const { initialData, programDbId, programFieldLabels, awardOptions: initialAwardOptions = EMPTY_AWARD_OPTIONS } = props ?? {}
  const isEdit = Boolean(programDbId && initialData)
  const L = (name: string, fallback: string) => programFieldLabels?.[name] ?? fallback

  const [programId, setProgramId] = useState('')
  const [slug, setSlug] = useState('')
  const [titleTh, setTitleTh] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [programContentType, setProgramContentType] = useState<string>('Series')
  const [categories, setCategories] = useState<number[]>([])
  const [comingSoon, setComingSoon] = useState(false)
  const [comingSoonDate, setComingSoonDate] = useState('')
  const [synopsisTh, setSynopsisTh] = useState('')
  const [synopsisEn, setSynopsisEn] = useState('')
  const [companyProduce, setCompanyProduce] = useState('')
  const [producer, setProducer] = useState('')
  const [artist, setArtist] = useState('')
  const [writer, setWriter] = useState('')
  const [targetGroup, setTargetGroup] = useState('')
  const [type, setType] = useState('')
  const [genre, setGenre] = useState<number[]>([])
  const [genre_sub, setGenre_sub] = useState<number[]>([])
  const [tags, setTags] = useState('')
  const [comment, setComment] = useState('')
  const [TrailerAirflowProxyPath, setTrailerAirflowProxyPath] = useState('')
  const [TrailerThumbnailAirflowProxyPath, setTrailerThumbnailAirflowProxyPath] = useState('')
  const [videoAirflowProxyPath, setVideoAirflowProxyPath] = useState('')
  const [videoThumbnailAirflowProxyPath, setVideoThumbnailAirflowProxyPath] = useState('')
  const [videoLink, setVideoLink] = useState('')
  const [trailerLink, setTrailerLink] = useState('')
  const [is_IP, setIs_IP] = useState(false)
  const [is_Feature, setIs_Feature] = useState(false)
  const [is_NEW, setIs_NEW] = useState(false)
  const [is_Schedule, setIs_Schedule] = useState(false)
  const [isNewHits, setIsNewHits] = useState(false)
  const [is_Detail, setIs_Detail] = useState(false)
  const [is_special_programs, setIs_special_programs] = useState(false)
  const [is_old_series, setIs_old_series] = useState(false)
  const [is_discontinued, setIs_discontinued] = useState(false)
  const [is_global_programs, setIs_global_programs] = useState(false)
  const [is_global_international, setIs_global_international] = useState(false)
  const [is_global_thai_dub, setIs_global_thai_dub] = useState(false)
  const [isUncut, setIsUncut] = useState(false)
  const [hasSoundtrack, setHasSoundtrack] = useState(false)
  const [hasAd, setHasAd] = useState(false)
  const [hasCc, setHasCc] = useState(false)
  const [hasSl, setHasSl] = useState(false)
  const [hasBigSign, setHasBigSign] = useState(false)
  const [firstRun, setFirstRun] = useState('')
  const [rerunDates, setRerunDates] = useState<string[]>([''])
  const [space, setSpace] = useState('')
  const [format, setFormat] = useState('')
  const [duration, setDuration] = useState<number | ''>('')
  const [onThaipbs, setOnThaipbs] = useState(false)
  const [onAltv, setOnAltv] = useState(false)
  const [onVipa, setOnVipa] = useState(false)
  const [onFacebook, setOnFacebook] = useState(false)
  const [onX, setOnX] = useState(false)
  const [onYoutube, setOnYoutube] = useState(false)
  const [onTiktok, setOnTiktok] = useState(false)
  const [views, setViews] = useState('')
  const [productionCountry, setProductionCountry] = useState('')
  const [productionYear, setProductionYear] = useState<number | ''>('')
  const [rightsTerritoriesAvailable, setRightsTerritoriesAvailable] = useState('')
  const [image, setImage] = useState<number | ''>('')
  const [coverImage, setCoverImage] = useState<number | ''>('')
  const [trailer, setTrailer] = useState<number | ''>('')
  const [video, setVideo] = useState<number | ''>('')
  const [initialImageDisplay, setInitialImageDisplay] = useState<MediaDoc | null>(null)
  const [initialCoverImageDisplay, setInitialCoverImageDisplay] = useState<MediaDoc | null>(null)
  const [seasons, setSeasons] = useState<SeasonForm[]>([emptySeason()])
  const [collapsedSeasons, setCollapsedSeasons] = useState<Set<string>>(new Set())
  const [collapsedEpisodes, setCollapsedEpisodes] = useState<Set<string>>(new Set())
  const [collapsedAwards, setCollapsedAwards] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loadedEdit, setLoadedEdit] = useState(false)
  const [languageOptions, setLanguageOptions] = useState<LanguageDoc[]>([])
  const [categoryOptions, setCategoryOptions] = useState<CategoryDoc[]>([])
  const [genreOptions, setGenreOptions] = useState<GenreDoc[]>([])
  const [subGenreOptions, setSubGenreOptions] = useState<SubGenreDoc[]>([])
  const [awardOptions, setAwardOptions] = useState<AwardOption[]>(initialAwardOptions)
  const [viewsHelperOpen, setViewsHelperOpen] = useState(false)

  React.useEffect(() => {
    const base = getApiBase()
    if (!base) return
    fetch(`${base}/languages?limit=200&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const docs = (data?.docs ?? []) as unknown
        if (!Array.isArray(docs)) return
        setLanguageOptions(
          docs
            .map((d) => ({
              id: Number((d as { id?: unknown }).id),
              code: (d as { code?: unknown }).code as string | undefined,
              label: (d as { label?: unknown }).label as string | undefined,
            }))
            .filter((d) => Number.isFinite(d.id) && d.id > 0)
        )
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    const base = getApiBase()
    if (!base) return
    fetch(`${base}/categories?limit=500&depth=0&sort=order`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const docs = (data?.docs ?? []) as unknown
        if (!Array.isArray(docs)) return
        setCategoryOptions(
          docs
            .map((d) => ({
              id: Number((d as { id?: unknown }).id),
              name: (d as { name?: unknown }).name as string | undefined,
              slug: (d as { slug?: unknown }).slug as string | undefined,
            }))
            .filter((d) => Number.isFinite(d.id) && d.id > 0)
        )
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    const base = getApiBase()
    if (!base) return
    fetch(`${base}/genres?limit=500&depth=0&sort=name`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const docs = (data?.docs ?? []) as unknown
        if (!Array.isArray(docs)) return
        setGenreOptions(
          docs
            .map((d) => ({
              id: Number((d as { id?: unknown }).id),
              name: (d as { name?: unknown }).name as string | undefined,
              slug: (d as { slug?: unknown }).slug as string | undefined,
            }))
            .filter((d) => Number.isFinite(d.id) && d.id > 0)
        )
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    const base = getApiBase()
    if (!base) return
    fetch(`${base}/subGenres?limit=500&depth=1&sort=name`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const docs = (data?.docs ?? []) as unknown
        if (!Array.isArray(docs)) return
        setSubGenreOptions(
          docs
            .map((d) => ({
              id: Number((d as { id?: unknown }).id),
              name: (d as { name?: unknown }).name as string | undefined,
              slug: (d as { slug?: unknown }).slug as string | undefined,
              genre: (d as { genre?: unknown }).genre as number | GenreDoc | null | undefined,
            }))
            .filter((d) => Number.isFinite(d.id) && d.id > 0)
        )
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    if (initialAwardOptions.length > 0) {
      setAwardOptions(initialAwardOptions)
      return
    }
    const base = getApiBase()
    if (!base) return
    fetch(`${base}/awards?limit=500&depth=0&sort=name`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const docs = (data?.docs ?? []) as unknown
        if (!Array.isArray(docs)) return
        setAwardOptions(
          docs
            .map((d) => ({
              id: Number((d as { id?: unknown }).id),
              name: String((d as { name?: unknown }).name ?? '').trim(),
            }))
            .filter((d) => Number.isFinite(d.id) && d.id > 0 && d.name)
        )
      })
      .catch(() => {})
  }, [initialAwardOptions])

  const toggleSeasonCollapsed = (seasonKey: string) => {
    setCollapsedSeasons((prev) => {
      const next = new Set(prev)
      if (next.has(seasonKey)) next.delete(seasonKey)
      else next.add(seasonKey)
      return next
    })
  }
  const toggleEpisodeCollapsed = (episodeKey: string) => {
    setCollapsedEpisodes((prev) => {
      const next = new Set(prev)
      if (next.has(episodeKey)) next.delete(episodeKey)
      else next.add(episodeKey)
      return next
    })
  }
  const toggleAwardCollapsed = (awardKey: string) => {
    setCollapsedAwards((prev) => {
      const next = new Set(prev)
      if (next.has(awardKey)) next.delete(awardKey)
      else next.add(awardKey)
      return next
    })
  }

  const collapseSeasonAwards = (season: SeasonForm) => {
    setCollapsedAwards((prev) => {
      const next = new Set(prev)
      season.awards.forEach((award) => next.add(award._key))
      return next
    })
  }

  const showSeasonAwards = (season: SeasonForm) => {
    setCollapsedAwards((prev) => {
      const next = new Set(prev)
      season.awards.forEach((award) => next.delete(award._key))
      return next
    })
  }

  React.useEffect(() => {
    if (!isEdit || !initialData || loadedEdit) return
    const p = initialData.program
    setProgramId(String(p.programId ?? ''))
    setSlug(String(p.slug ?? ''))
    setTitleTh(String(p.titleTh ?? ''))
    setTitleEn(String(p.titleEn ?? ''))
    setProgramContentType(String(p.programContentType ?? 'Series'))
    setCategories(relationIds((p as { categories?: unknown }).categories))
    setComingSoon(Boolean(p.comingSoon))
    setComingSoonDate(toDateStr(p.comingSoonDate))
    setSynopsisTh(String(p.synopsisTh ?? ''))
    setSynopsisEn(String(p.synopsisEn ?? ''))
    setCompanyProduce(String(p.companyProduce ?? ''))
    setProducer(String(p.producer ?? ''))
    setArtist(String(p.artist ?? ''))
    setWriter(String(p.writer ?? ''))
    setTargetGroup(String(p.targetGroup ?? ''))
    setType(String(p.type ?? ''))
    setGenre(relationIds((p as { genre?: unknown }).genre))
    setGenre_sub(relationIds((p as { genre_sub?: unknown }).genre_sub))
    setTags(String(p.tags ?? ''))
    setComment(String(p.comment ?? ''))
    setTrailerAirflowProxyPath(String(p.TrailerAirflowProxyPath ?? ''))
    setTrailerThumbnailAirflowProxyPath(String(p.TrailerThumbnailAirflowProxyPath ?? ''))
    setVideoAirflowProxyPath(String(p.videoAirflowProxyPath ?? ''))
    setVideoThumbnailAirflowProxyPath(String(p.videoThumbnailAirflowProxyPath ?? ''))
    setVideoLink(String(p.videoLink ?? ''))
    setTrailerLink(String(p.trailerLink ?? ''))
    setIs_IP(Boolean(p.is_IP))
    setIs_Feature(Boolean(p.is_Feature))
    setIs_NEW(Boolean((p as { is_NEW?: boolean }).is_NEW))
    setIs_Schedule(Boolean((p as { is_Schedule?: boolean }).is_Schedule))
    setIsNewHits(Boolean((p as { isNewHits?: boolean }).isNewHits))
    setIs_Detail(Boolean((p as { is_Detail?: boolean }).is_Detail))
    setIs_special_programs(Boolean((p as { is_special_programs?: boolean }).is_special_programs))
    setIs_old_series(Boolean((p as { is_old_series?: boolean }).is_old_series))
    setIs_discontinued(Boolean((p as { is_discontinued?: boolean }).is_discontinued))
    setIs_global_programs(Boolean((p as { is_global_programs?: boolean }).is_global_programs))
    setIs_global_international(Boolean((p as { is_global_international?: boolean }).is_global_international))
    setIs_global_thai_dub(Boolean((p as { is_global_thai_dub?: boolean }).is_global_thai_dub))
    setIsUncut(Boolean((p as { isUncut?: boolean }).isUncut))
    setHasSoundtrack(Boolean(p.hasSoundtrack))
    setHasAd(Boolean(p.hasAd))
    setHasCc(Boolean(p.hasCc))
    setHasSl(Boolean(p.hasSl))
    setHasBigSign(Boolean((p as { hasBigSign?: boolean }).hasBigSign))
    setFirstRun(normalizeDateTimeLocal(toDateTimeStr(p.firstRun)))
    setRerunDates(
      Array.isArray((p as { rerunDates?: Array<{ date?: string } | string> }).rerunDates) &&
        (p as { rerunDates: Array<{ date?: string } | string> }).rerunDates.length > 0
        ? (p as { rerunDates: Array<{ date?: string } | string> }).rerunDates.map((r) =>
          normalizeDateTimeLocal(toDateTimeStr(typeof r === 'object' && r != null ? (r as { date?: string }).date : r))
        )
        : ['']
    )
    setSpace(String(p.space ?? ''))
    setFormat(String(p.format ?? ''))
    setDuration(p.duration != null ? Number(p.duration) : '')
    setOnThaipbs(Boolean(p.onThaipbs))
    setOnAltv(Boolean(p.onAltv))
    setOnVipa(Boolean(p.onVipa))
    setOnFacebook(Boolean(p.onFacebook))
    setOnX(Boolean(p.onX))
    setOnYoutube(Boolean(p.onYoutube))
    setOnTiktok(Boolean(p.onTiktok))
    setViews(
      typeof p.views === 'object' && p.views !== null
        ? JSON.stringify(p.views as Record<string, unknown>, null, 2)
        : typeof p.views === 'string'
          ? p.views
          : ''
    )
    setProductionCountry(String(p.productionCountry ?? ''))
    setProductionYear(p.productionYear != null ? Number(p.productionYear) : '')
    setRightsTerritoriesAvailable(String(p.rightsTerritoriesAvailable ?? ''))
    setImage(toRelId(p.image))
    setCoverImage(toRelId(p.coverImage))
    setTrailer(toRelId((p as { trailer?: unknown }).trailer))
    setVideo(toRelId((p as { video?: unknown }).video))
    setInitialImageDisplay(toMediaDoc(p.image))
    setInitialCoverImageDisplay(toMediaDoc(p.coverImage))
    const seasonList = initialData.seasons ?? []
    if (seasonList.length > 0) {
      const next = seasonList.map((s) => {
        const seasonKey = makeKey()
        return {
          _key: seasonKey,
          id: s.id != null ? Number(s.id) : undefined,
          season: s.season != null ? Number(s.season) : ('' as number | ''),
          seasonName: String(s.seasonName ?? ''),
          seasonNameEn: String(s.seasonNameEn ?? ''),
          is_Award: Boolean((s as { is_Award?: unknown }).is_Award),
          awards: Array.isArray((s as { awards?: unknown }).awards)
            ? ((s as { awards: Array<Record<string, unknown>> }).awards).map((award) => ({
                _key: makeKey(),
                id: award.id != null ? String(award.id) : undefined,
                awardName: toRelId(award.awardName),
                awardYear: award.awardYear != null ? Number(award.awardYear) : ('' as number | ''),
                awardDetail: award.awardDetail ?? '',
                awardUpdatedAt: toDateTimeStr(award.awardUpdatedAt),
              }))
            : [],
          sellPricing: normalizeSellPricing((s as { sellPricing?: unknown }).sellPricing),
          hasCc: Boolean((s as { hasCc?: unknown }).hasCc),
          languages: toRelIds((s as { languages?: unknown }).languages),
          hasSoundtrack: Boolean((s as { hasSoundtrack?: unknown }).hasSoundtrack),
          languagesSoundtrack: toRelIds((s as { languagesSoundtrack?: unknown }).languagesSoundtrack),
          comingSoon: Boolean(s.comingSoon),
          comingSoonDate: toDateStr(s.comingSoonDate),
          synopsisTh: String(s.synopsisTh ?? ''),
          synopsisEn: String(s.synopsisEn ?? ''),
          TrailerAirflowProxyPath: String(s.TrailerAirflowProxyPath ?? ''),
          TrailerThumbnailAirflowProxyPath: String(s.TrailerThumbnailAirflowProxyPath ?? ''),
          videoAirflowProxyPath: String(s.videoAirflowProxyPath ?? ''),
          videoThumbnailAirflowProxyPath: String(s.videoThumbnailAirflowProxyPath ?? ''),
          videoLink: String(s.videoLink ?? ''),
          trailerLink: String(s.trailerLink ?? ''),
          coverImage: toRelId(s.coverImage),
          trailer: toRelId((s as { trailer?: unknown }).trailer),
          video: toRelId((s as { video?: unknown }).video),
          episodes: (s.episodes ?? []).map((e: Record<string, unknown>) => ({
            _key: makeKey(),
            id: e.id != null ? Number(e.id) : undefined,
            ep: e.ep != null ? Number(e.ep) : ('' as number | ''),
            epNameTh: String(e.epNameTh ?? ''),
            epNameEn: String(e.epNameEn ?? ''),
            comingSoon: Boolean(e.comingSoon),
            comingSoonDate: toDateStr(e.comingSoonDate),
            firstRun: normalizeDateTimeLocal(toDateTimeStr((e as { firstRun?: unknown }).firstRun)),
            rerunDates:
              Array.isArray((e as { rerunDates?: Array<{ date?: string } | string> }).rerunDates) &&
                (e as { rerunDates?: Array<{ date?: string } | string> }).rerunDates!.length > 0
                ? (e as { rerunDates: Array<{ date?: string } | string> }).rerunDates.map((r) =>
                  normalizeDateTimeLocal(toDateTimeStr(typeof r === 'object' && r != null ? (r as { date?: string }).date : r))
                )
                : [''],
            synopsisEpTh: String(e.synopsisEpTh ?? ''),
            synopsisEpEn: String(e.synopsisEpEn ?? ''),
            TrailerAirflowProxyPath: String(e.TrailerAirflowProxyPath ?? ''),
            TrailerThumbnailAirflowProxyPath: String(e.TrailerThumbnailAirflowProxyPath ?? ''),
            videoAirflowProxyPath: String(e.videoAirflowProxyPath ?? ''),
            videoThumbnailAirflowProxyPath: String(e.videoThumbnailAirflowProxyPath ?? ''),
            videoLink: String(e.videoLink ?? ''),
            trailerLink: String(e.trailerLink ?? ''),
            coverImage: toRelId(e.coverImage),
            trailer: toRelId((e as { trailer?: unknown }).trailer),
            video: toRelId((e as { video?: unknown }).video),
          })),
        }
      })
      setSeasons(next)
      setCollapsedSeasons(new Set(next.map((s) => s._key)))
      setCollapsedEpisodes(new Set(next.flatMap((s) => s.episodes.map((e) => e._key))))
      setCollapsedAwards(new Set(next.flatMap((s) => s.awards.map((award) => award._key))))
    } else {
      setSeasons([])
      setCollapsedSeasons(new Set())
      setCollapsedEpisodes(new Set())
      setCollapsedAwards(new Set())
    }
    setLoadedEdit(true)
  }, [isEdit, initialData, loadedEdit])

  const getApiBase = () => {
    return getPayloadApiBase()
  }

  const addSeason = () => {
    setSeasons((s) => [...s, emptySeason()])
  }

  const removeSeason = (index: number) => {
    setSeasons((s) => s.filter((_, i) => i !== index))
  }

  const moveSeason = (fromIndex: number, toIndex: number) => {
    setSeasons((prev) => {
      if (fromIndex === toIndex) return prev
      if (fromIndex < 0 || toIndex < 0) return prev
      if (fromIndex >= prev.length || toIndex >= prev.length) return prev
      const next = [...prev]
      const [row] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, row)
      return next
    })
  }

  const updateSeason = (index: number, updates: Partial<SeasonForm>) => {
    setSeasons((s) =>
      s.map((row, i) => (i === index ? { ...row, ...updates } : row))
    )
  }

  const addSeasonAward = (seasonIndex: number) => {
    const nextAward = emptySeasonAward()
    setSeasons((s) =>
      s.map((row, i) =>
        i === seasonIndex ? { ...row, awards: [...row.awards, nextAward] } : row
      )
    )
    setCollapsedAwards((prev) => {
      const next = new Set(prev)
      next.delete(nextAward._key)
      return next
    })
  }

  const updateSeasonAward = (
    seasonIndex: number,
    awardIndex: number,
    updates: Partial<SeasonAwardForm>
  ) => {
    setSeasons((s) =>
      s.map((row, i) => {
        if (i !== seasonIndex) return row
        return {
          ...row,
          awards: row.awards.map((award, j) =>
            j === awardIndex ? { ...award, ...updates } : award
          ),
        }
      })
    )
  }

  const removeSeasonAward = (seasonIndex: number, awardIndex: number) => {
    const awardKey = seasons[seasonIndex]?.awards[awardIndex]?._key
    setSeasons((s) =>
      s.map((row, i) =>
        i === seasonIndex
          ? { ...row, awards: row.awards.filter((_, j) => j !== awardIndex) }
          : row
      )
    )
    if (awardKey) {
      setCollapsedAwards((prev) => {
        const next = new Set(prev)
        next.delete(awardKey)
        return next
      })
    }
  }

  const updateSeasonSellPricing = (index: number, updates: Partial<SeasonSellPricingForm>) => {
    setSeasons((s) =>
      s.map((row, i) =>
        i === index
          ? { ...row, sellPricing: { ...row.sellPricing, ...updates } }
          : row
      )
    )
  }

  const updateSeasonFormatPrice = (
    seasonIndex: number,
    formatIndex: number,
    updates: Partial<SeasonSellPricingForm['formatPrices'][number]>
  ) => {
    setSeasons((s) =>
      s.map((row, i) => {
        if (i !== seasonIndex) return row
        return {
          ...row,
          sellPricing: {
            ...row.sellPricing,
            formatPrices: row.sellPricing.formatPrices.map((priceRow, pi) =>
              pi === formatIndex ? { ...priceRow, ...updates } : priceRow
            ),
          },
        }
      })
    )
  }

  const addSeasonCcLanguagePrice = (seasonIndex: number) => {
    setSeasons((s) =>
      s.map((row, i) =>
        i === seasonIndex
          ? {
              ...row,
              sellPricing: {
                ...row.sellPricing,
                ccLanguagePrices: [
                  ...row.sellPricing.ccLanguagePrices,
                  { _key: makeKey(), language: '', price: '' },
                ],
              },
            }
          : row
      )
    )
  }

  const updateSeasonCcLanguagePrice = (
    seasonIndex: number,
    priceIndex: number,
    updates: Partial<SeasonSellPricingForm['ccLanguagePrices'][number]>
  ) => {
    setSeasons((s) =>
      s.map((row, i) => {
        if (i !== seasonIndex) return row
        return {
          ...row,
          sellPricing: {
            ...row.sellPricing,
            ccLanguagePrices: row.sellPricing.ccLanguagePrices.map((priceRow, pi) =>
              pi === priceIndex ? { ...priceRow, ...updates } : priceRow
            ),
          },
        }
      })
    )
  }

  const removeSeasonCcLanguagePrice = (seasonIndex: number, priceIndex: number) => {
    setSeasons((s) =>
      s.map((row, i) =>
        i === seasonIndex
          ? {
              ...row,
              sellPricing: {
                ...row.sellPricing,
                ccLanguagePrices: row.sellPricing.ccLanguagePrices.filter((_, pi) => pi !== priceIndex),
              },
            }
          : row
      )
    )
  }

  const addEpisode = (seasonIndex: number) => {
    setSeasons((s) =>
      s.map((row, i) =>
        i === seasonIndex ? { ...row, episodes: [...row.episodes, emptyEpisode()] } : row
      )
    )
  }

  const removeEpisode = (seasonIndex: number, epIndex: number) => {
    setSeasons((s) =>
      s.map((row, i) => {
        if (i !== seasonIndex) return row
        return { ...row, episodes: row.episodes.filter((_, j) => j !== epIndex) }
      })
    )
  }

  const moveEpisode = (seasonIndex: number, fromIndex: number, toIndex: number) => {
    setSeasons((prev) =>
      prev.map((row, i) => {
        if (i !== seasonIndex) return row
        if (fromIndex === toIndex) return row
        if (fromIndex < 0 || toIndex < 0) return row
        if (fromIndex >= row.episodes.length || toIndex >= row.episodes.length) return row
        const eps = [...row.episodes]
        const [ep] = eps.splice(fromIndex, 1)
        eps.splice(toIndex, 0, ep)
        return { ...row, episodes: eps }
      })
    )
  }

  const updateEpisode = (
    seasonIndex: number,
    epIndex: number,
    updates: Partial<EpisodeForm>
  ) => {
    setSeasons((s) =>
      s.map((row, i) => {
        if (i !== seasonIndex) return row
        return {
          ...row,
          episodes: row.episodes.map((ep, j) =>
            j === epIndex ? { ...ep, ...updates } : ep
          ),
        }
      })
    )
  }

  const showFull =
    is_IP || is_NEW || is_Detail || is_special_programs || is_old_series || is_discontinued || is_global_programs
  const showScheduleOrFull = is_Schedule || showFull
  const showNewHitsOrFull = isNewHits || showFull
  const showAny = is_Feature || showScheduleOrFull || showNewHitsOrFull || showFull
  const is_normal_programs = !is_special_programs && !is_old_series && !is_discontinued && !is_global_programs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug.trim()) {
      setMessage({ type: 'error', text: 'Slug is required.' })
      return
    }
    const targetGroupAge = targetGroup.trim() === '' ? null : Number(targetGroup)
    if (
      targetGroupAge != null &&
      (!Number.isFinite(targetGroupAge) || targetGroupAge < 0)
    ) {
      setMessage({ type: 'error', text: 'Target group age must be a non-negative number.' })
      return
    }
    const invalidAwardSeason = (programContentType === 'Series' ? seasons : []).find(
      (season) =>
        season.is_Award &&
        (season.awards.length === 0 ||
          season.awards.some((award) => award.awardName === '' || award.awardYear === ''))
    )
    if (invalidAwardSeason) {
      setMessage({ type: 'error', text: 'Each award season needs at least one award with a name and year.' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    const base = getApiBase()
    try {
      if (isEdit && programDbId) {
        await fetch(`${base}/programs/${programDbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            programId: programId.trim() || null,
            slug: slug.trim(),
            titleTh: titleTh.trim() || null,
            titleEn: titleEn.trim() || null,
            programContentType: programContentType || null,
            categories,
            comingSoon,
            comingSoonDate: comingSoonDate || null,
            synopsisTh: synopsisTh.trim() || null,
            synopsisEn: synopsisEn.trim() || null,
            companyProduce: companyProduce.trim() || null,
            producer: producer.trim() || null,
            artist: artist.trim() || null,
            writer: writer.trim() || null,
            targetGroup: targetGroupAge,
            type: type || null,
            genre,
            genre_sub,
            tags: tags.trim() || null,
            comment: comment.trim() || null,
            TrailerAirflowProxyPath: TrailerAirflowProxyPath.trim() || null,
            TrailerThumbnailAirflowProxyPath: TrailerThumbnailAirflowProxyPath.trim() || null,
            videoAirflowProxyPath: videoAirflowProxyPath.trim() || null,
            videoThumbnailAirflowProxyPath: videoThumbnailAirflowProxyPath.trim() || null,
            videoLink: videoLink.trim() || null,
            trailerLink: trailerLink.trim() || null,
            is_IP,
            is_Feature,
            is_NEW,
            is_Schedule,
            isNewHits,
            is_Detail,
            is_special_programs,
            is_old_series,
            is_discontinued,
            is_global_programs,
            is_global_international: is_global_programs && is_global_international,
            is_global_thai_dub: is_global_programs && is_global_thai_dub,
            is_normal_programs,
            isUncut,
            hasSoundtrack: Boolean(hasSoundtrack),
            hasAd: Boolean(hasAd),
            hasCc: Boolean(hasCc),
            hasSl: Boolean(hasSl),
            hasBigSign: Boolean(hasBigSign),
            firstRun: firstRun ? new Date(firstRun).toISOString() : undefined,
            rerunDates: rerunDates
              .filter((s) => s.trim() !== '')
              .map((s) => ({ date: new Date(s).toISOString() })),
            space: space.trim() || null,
            format: format || null,
            duration: duration === '' ? undefined : Number(duration),
            onThaipbs,
            onAltv,
            onVipa,
            onFacebook,
            onX,
            onYoutube,
            onTiktok,
            views: parseViewsJson(views),
            productionCountry: productionCountry.trim() || null,
            productionYear: productionYear === '' ? undefined : Number(productionYear),
            rightsTerritoriesAvailable: rightsTerritoriesAvailable.trim() || null,
            image: image === '' ? null : image,
            coverImage: coverImage === '' ? null : coverImage,
            trailer: trailer === '' ? null : trailer,
            video: video === '' ? null : video,
          }),
        }).then((r) => { if (!r.ok) throw new Error(r.statusText) })
        if (programContentType === 'Series' && initialData?.seasons?.length) {
          const originalSeasons = (initialData.seasons ?? []) as Array<Record<string, unknown> & { id?: unknown; episodes?: Array<Record<string, unknown> & { id?: unknown }> }>
          const currentSeasonIds = new Set(
            seasons.filter((s) => s.id != null).map((s) => s.id as number)
          )
          const seasonsToDelete = originalSeasons.filter((s) => {
            const id = s.id != null ? Number(s.id) : null
            return id != null && !currentSeasonIds.has(id)
          })
          for (const seasonToDelete of seasonsToDelete) {
            const seasonId = Number(seasonToDelete.id)
            const episodeIds = (seasonToDelete.episodes ?? [])
              .map((e) => e.id != null ? Number(e.id) : null)
              .filter((id): id is number => id != null)
            for (const epId of episodeIds) {
              const r = await fetch(`${base}/episodes/${epId}`, {
                method: 'DELETE',
                credentials: 'include',
              })
              // Already removed on a previous save (initialData still lists old eps)
              if (!r.ok && r.status !== 404) {
                throw new Error((await r.json().catch(() => ({}))).message || r.statusText)
              }
            }
            const r = await fetch(`${base}/seasons/${seasonId}`, {
              method: 'DELETE',
              credentials: 'include',
            })
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText)
          }
        }
        const seriesSeasons = programContentType === 'Series' ? seasons : []
        const nextSeasons = seriesSeasons.map((s) => ({ ...s, episodes: s.episodes.map((e) => ({ ...e })) }))
        const seasonIdsForProgram: number[] = []
        for (let si = 0; si < seriesSeasons.length; si++) {
          const seasonRow = seriesSeasons[si]
          if (!hasSeasonData(seasonRow)) continue
          const seasonBody = {
            program: programDbId,
            season: seasonRow.season === '' ? undefined : Number(seasonRow.season),
            seasonName: seasonRow.seasonName.trim() || null,
            seasonNameEn: seasonRow.seasonNameEn.trim() || null,
            is_Award: seasonRow.is_Award,
            awards: buildSeasonAwardsPayload(seasonRow),
            sellPricing: buildSellPricingPayload(seasonRow.sellPricing, is_IP),
            hasCc: Boolean(seasonRow.hasCc),
            languages: seasonRow.languages,
            hasSoundtrack: Boolean(seasonRow.hasSoundtrack),
            languagesSoundtrack: seasonRow.languagesSoundtrack,
            comingSoon: seasonRow.comingSoon,
            comingSoonDate: seasonRow.comingSoonDate || null,
            synopsisTh: seasonRow.synopsisTh.trim() || null,
            synopsisEn: seasonRow.synopsisEn.trim() || null,
            TrailerAirflowProxyPath: seasonRow.TrailerAirflowProxyPath.trim() || null,
            TrailerThumbnailAirflowProxyPath: seasonRow.TrailerThumbnailAirflowProxyPath.trim() || null,
            videoAirflowProxyPath: seasonRow.videoAirflowProxyPath.trim() || null,
            videoThumbnailAirflowProxyPath: seasonRow.videoThumbnailAirflowProxyPath.trim() || null,
            videoLink: seasonRow.videoLink.trim() || null,
            trailerLink: seasonRow.trailerLink.trim() || null,
            coverImage: seasonRow.coverImage === '' ? null : seasonRow.coverImage,
            trailer: seasonRow.trailer === '' ? null : seasonRow.trailer,
            video: seasonRow.video === '' ? null : seasonRow.video,
          }
          let seasonId: number
          if (seasonRow.id != null) {
            const r = await fetch(`${base}/seasons/${seasonRow.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(seasonBody),
            })
            if (!r.ok) throw new Error(payloadErrorMessage(await r.json().catch(() => ({})), r.statusText))
            const data = await r.json()
            seasonId = (data.doc ?? data).id
          } else {
            const r = await fetch(`${base}/seasons`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(seasonBody),
            })
            if (!r.ok) throw new Error(payloadErrorMessage(await r.json().catch(() => ({})), r.statusText))
            const data = await r.json()
            seasonId = (data.doc ?? data).id
            nextSeasons[si].id = seasonId
          }
          seasonIdsForProgram.push(Number(seasonId))
          if (seasonRow.id != null && initialData?.seasons?.length) {
            const originalSeason = (initialData.seasons as Array<Record<string, unknown> & { id?: unknown; episodes?: Array<Record<string, unknown> & { id?: unknown }> }>).find(
              (s) => s.id != null && Number(s.id) === seasonRow.id
            )
            const originalEpIds = (originalSeason?.episodes ?? [])
              .map((e) => (e.id != null ? Number(e.id) : null))
              .filter((id): id is number => id != null)
            const currentEpIds = new Set(
              seasonRow.episodes.filter((ep) => ep.id != null).map((ep) => ep.id as number)
            )
            const epIdsToDelete = originalEpIds.filter((id) => !currentEpIds.has(id))
            for (const epId of epIdsToDelete) {
              const r = await fetch(`${base}/episodes/${epId}`, {
                method: 'DELETE',
                credentials: 'include',
              })
              if (!r.ok && r.status !== 404) {
                throw new Error((await r.json().catch(() => ({}))).message || r.statusText)
              }
            }
          }
          const episodeIdsForSeason: number[] = []
          for (let ei = 0; ei < seasonRow.episodes.length; ei++) {
            const epRow = seasonRow.episodes[ei]
            if (!hasEpisodeData(epRow)) continue
            const epBody = {
              season: seasonId,
              ep: epRow.ep === '' ? undefined : Number(epRow.ep),
              epNameTh: epRow.epNameTh.trim() || null,
              epNameEn: epRow.epNameEn.trim() || null,
              comingSoon: epRow.comingSoon,
              comingSoonDate: epRow.comingSoonDate || null,
              firstRun: epRow.firstRun ? new Date(epRow.firstRun).toISOString() : undefined,
              rerunDates: epRow.rerunDates
                .filter((s) => s.trim() !== '')
                .map((s) => ({ date: new Date(s).toISOString() })),
              synopsisEpTh: epRow.synopsisEpTh.trim() || null,
              synopsisEpEn: epRow.synopsisEpEn.trim() || null,
              TrailerAirflowProxyPath: epRow.TrailerAirflowProxyPath.trim() || null,
              TrailerThumbnailAirflowProxyPath: epRow.TrailerThumbnailAirflowProxyPath.trim() || null,
              videoAirflowProxyPath: epRow.videoAirflowProxyPath.trim() || null,
              videoThumbnailAirflowProxyPath: epRow.videoThumbnailAirflowProxyPath.trim() || null,
              videoLink: epRow.videoLink.trim() || null,
              trailerLink: epRow.trailerLink.trim() || null,
              coverImage: epRow.coverImage === '' ? null : epRow.coverImage,
              trailer: epRow.trailer === '' ? null : epRow.trailer,
              video: epRow.video === '' ? null : epRow.video,
            }
            if (epRow.id != null) {
              const r = await fetch(`${base}/episodes/${epRow.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(epBody),
              })
              if (!r.ok) throw new Error(payloadErrorMessage(await r.json().catch(() => ({})), r.statusText))
              episodeIdsForSeason.push(Number(epRow.id))
            } else {
              const r = await fetch(`${base}/episodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(epBody),
              })
              if (!r.ok) throw new Error(payloadErrorMessage(await r.json().catch(() => ({})), r.statusText))
              const epData = await r.json()
              const newEpId = (epData.doc ?? epData).id
              nextSeasons[si].episodes[ei].id = newEpId
              episodeIdsForSeason.push(Number(newEpId))
            }
          }

          // IMPORTANT: Payload does not auto-sync inverse relationships.
          // Keep `seasons.episodes` in sync with `episodes.season`.
          await fetch(`${base}/seasons/${seasonId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              episodes: episodeIdsForSeason,
            }),
          }).then(async (r) => {
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText)
          })
        }
        // Keep `programs.seasons` in sync with `seasons.program`.
        await fetch(`${base}/programs/${programDbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            seasons: seasonIdsForProgram,
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText)
        })
        if (programContentType === 'Series') setSeasons(nextSeasons)
        setMessage({ type: 'success', text: 'Program updated successfully.' })
        return
      }

      const programRes = await fetch(`${base}/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          programId: programId.trim() || null,
          slug: slug.trim(),
          titleTh: titleTh.trim() || null,
          titleEn: titleEn.trim() || null,
          programContentType: programContentType || null,
          categories,
          comingSoon,
          comingSoonDate: comingSoonDate || null,
          synopsisTh: synopsisTh.trim() || null,
          synopsisEn: synopsisEn.trim() || null,
          companyProduce: companyProduce.trim() || null,
          producer: producer.trim() || null,
          artist: artist.trim() || null,
          writer: writer.trim() || null,
          targetGroup: targetGroupAge,
          type: type || null,
          genre,
          genre_sub,
          tags: tags.trim() || null,
          comment: comment.trim() || null,
          TrailerAirflowProxyPath: TrailerAirflowProxyPath.trim() || null,
          TrailerThumbnailAirflowProxyPath: TrailerThumbnailAirflowProxyPath.trim() || null,
          videoAirflowProxyPath: videoAirflowProxyPath.trim() || null,
          videoThumbnailAirflowProxyPath: videoThumbnailAirflowProxyPath.trim() || null,
          videoLink: videoLink.trim() || null,
          trailerLink: trailerLink.trim() || null,
          is_IP,
          is_Feature,
          is_NEW,
          is_Schedule,
          isNewHits,
          is_Detail,
          is_special_programs,
          is_old_series,
          is_discontinued,
          is_global_programs,
          is_global_international: is_global_programs && is_global_international,
          is_global_thai_dub: is_global_programs && is_global_thai_dub,
          is_normal_programs,
          isUncut,
          hasSoundtrack: Boolean(hasSoundtrack),
          hasAd: Boolean(hasAd),
          hasCc: Boolean(hasCc),
          hasSl: Boolean(hasSl),
          hasBigSign: Boolean(hasBigSign),
          firstRun: firstRun ? new Date(firstRun).toISOString() : undefined,
          rerunDates: rerunDates
            .filter((s) => s.trim() !== '')
            .map((s) => ({ date: new Date(s).toISOString() })),
          space: space.trim() || null,
          format: format || null,
          duration: duration === '' ? undefined : Number(duration),
          onThaipbs,
          onAltv,
          onVipa,
          onFacebook,
          onX,
          onYoutube,
          onTiktok,
          views: parseViewsJson(views),
          productionCountry: productionCountry.trim() || null,
          productionYear: productionYear === '' ? undefined : Number(productionYear),
          rightsTerritoriesAvailable: rightsTerritoriesAvailable.trim() || null,
          image: image === '' ? null : image,
          coverImage: coverImage === '' ? null : coverImage,
          trailer: trailer === '' ? null : trailer,
          video: video === '' ? null : video,
        }),
      })
      if (!programRes.ok) {
        const err = await programRes.json().catch(() => ({}))
        throw new Error(err.message || err.errors?.[0]?.message || programRes.statusText)
      }
      const program = await programRes.json()
      const programDoc = program.doc ?? program

      const createdSeasonIds: number[] = []
      for (const seasonRow of programContentType === 'Series' ? seasons : []) {
        if (!hasSeasonData(seasonRow)) continue
        const seasonRes = await fetch(`${base}/seasons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            program: programDoc.id,
            season: seasonRow.season === '' ? undefined : Number(seasonRow.season),
            seasonName: seasonRow.seasonName.trim() || null,
            seasonNameEn: seasonRow.seasonNameEn.trim() || null,
            is_Award: seasonRow.is_Award,
            awards: buildSeasonAwardsPayload(seasonRow),
            sellPricing: buildSellPricingPayload(seasonRow.sellPricing, is_IP),
            hasCc: Boolean(seasonRow.hasCc),
            languages: seasonRow.languages,
            hasSoundtrack: Boolean(seasonRow.hasSoundtrack),
            languagesSoundtrack: seasonRow.languagesSoundtrack,
            comingSoon: seasonRow.comingSoon,
            comingSoonDate: seasonRow.comingSoonDate || null,
            synopsisTh: seasonRow.synopsisTh.trim() || null,
            synopsisEn: seasonRow.synopsisEn.trim() || null,
            TrailerAirflowProxyPath: seasonRow.TrailerAirflowProxyPath.trim() || null,
            TrailerThumbnailAirflowProxyPath: seasonRow.TrailerThumbnailAirflowProxyPath.trim() || null,
            videoAirflowProxyPath: seasonRow.videoAirflowProxyPath.trim() || null,
            videoThumbnailAirflowProxyPath: seasonRow.videoThumbnailAirflowProxyPath.trim() || null,
            videoLink: seasonRow.videoLink.trim() || null,
            trailerLink: seasonRow.trailerLink.trim() || null,
            coverImage: seasonRow.coverImage === '' ? null : seasonRow.coverImage,
            trailer: seasonRow.trailer === '' ? null : seasonRow.trailer,
            video: seasonRow.video === '' ? null : seasonRow.video,
          }),
        })
        if (!seasonRes.ok) {
          const err = await seasonRes.json().catch(() => ({}))
          throw new Error(payloadErrorMessage(err, seasonRes.statusText))
        }
        const season = await seasonRes.json()
        const seasonDoc = season.doc ?? season
        const createdEpisodeIds: number[] = []

        for (const epRow of seasonRow.episodes) {
          if (!hasEpisodeData(epRow)) continue
          const epRes = await fetch(`${base}/episodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              season: seasonDoc.id,
              ep: epRow.ep === '' ? undefined : Number(epRow.ep),
              epNameTh: epRow.epNameTh.trim() || null,
              epNameEn: epRow.epNameEn.trim() || null,
              comingSoon: epRow.comingSoon,
              comingSoonDate: epRow.comingSoonDate || null,
              firstRun: epRow.firstRun ? new Date(epRow.firstRun).toISOString() : undefined,
              rerunDates: epRow.rerunDates
                .filter((s) => s.trim() !== '')
                .map((s) => ({ date: new Date(s).toISOString() })),
              synopsisEpTh: epRow.synopsisEpTh.trim() || null,
              synopsisEpEn: epRow.synopsisEpEn.trim() || null,
              TrailerAirflowProxyPath: epRow.TrailerAirflowProxyPath.trim() || null,
              TrailerThumbnailAirflowProxyPath: epRow.TrailerThumbnailAirflowProxyPath.trim() || null,
              videoAirflowProxyPath: epRow.videoAirflowProxyPath.trim() || null,
              videoThumbnailAirflowProxyPath: epRow.videoThumbnailAirflowProxyPath.trim() || null,
              videoLink: epRow.videoLink.trim() || null,
              trailerLink: epRow.trailerLink.trim() || null,
              coverImage: epRow.coverImage === '' ? null : epRow.coverImage,
              trailer: epRow.trailer === '' ? null : epRow.trailer,
              video: epRow.video === '' ? null : epRow.video,
            }),
          })
          if (!epRes.ok) {
            const err = await epRes.json().catch(() => ({}))
            throw new Error(payloadErrorMessage(err, epRes.statusText))
          }
          const ep = await epRes.json()
          const epDoc = ep.doc ?? ep
          if (epDoc?.id != null) createdEpisodeIds.push(Number(epDoc.id))
        }

        // Keep `seasons.episodes` in sync with `episodes.season`.
        await fetch(`${base}/seasons/${seasonDoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            episodes: createdEpisodeIds,
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText)
        })

        createdSeasonIds.push(Number(seasonDoc.id))
      }

      // Keep `programs.seasons` in sync with `seasons.program`.
      if (programContentType === 'Series') {
        await fetch(`${base}/programs/${programDoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            seasons: createdSeasonIds,
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText)
        })
      }

      setMessage({
        type: 'success',
        text: `Program "${programId || titleTh || titleEn || slug || 'Program'}" created with ${seasons.length} season(s). You can add images and more in the Programs collection.`,
      })
      setProgramId('')
      setSlug('')
      setTitleTh('')
      setTitleEn('')
      setComingSoon(false)
      setComingSoonDate('')
      setSynopsisTh('')
      setSynopsisEn('')
      setCompanyProduce('')
      setProducer('')
      setArtist('')
      setWriter('')
      setCategories([])
      setTargetGroup('')
      setType('')
      setGenre([])
      setGenre_sub([])
      setTags('')
      setComment('')
      setTrailerAirflowProxyPath('')
      setTrailerThumbnailAirflowProxyPath('')
      setVideoAirflowProxyPath('')
      setVideoThumbnailAirflowProxyPath('')
      setVideoLink('')
      setTrailerLink('')
      setIs_IP(false)
      setIs_Feature(false)
      setIs_NEW(false)
      setIs_Schedule(false)
      setIsNewHits(false)
      setIs_Detail(false)
      setIs_special_programs(false)
      setIs_old_series(false)
      setIs_discontinued(false)
      setFirstRun('')
      setRerunDates([''])
      setSpace('')
      setFormat('')
      setDuration('')
      setOnThaipbs(false)
      setOnAltv(false)
      setOnVipa(false)
      setOnFacebook(false)
      setOnX(false)
      setOnYoutube(false)
      setOnTiktok(false)
      setViews('')
      setProductionCountry('')
      setProductionYear('')
      setRightsTerritoriesAvailable('')
      setImage('')
      setCoverImage('')
      setSeasons([emptySeason()])
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const totalEpisodes = seasons.reduce((sum, season) => sum + season.episodes.length, 0)
  const completedProgramFields = [
    programId,
    slug,
    titleTh,
    titleEn,
    genre,
    type,
    firstRun,
  ].filter((value) => String(value ?? '').trim() !== '').length
  const enabledFlags = [
    is_IP,
    is_Feature,
    is_NEW,
    is_Schedule,
    isNewHits,
    is_Detail,
    is_special_programs,
    is_old_series,
    is_discontinued,
    is_global_programs,
  ].filter(Boolean).length
  const viewsJsonTemplate = `{
  "2025-02": {
    "X": 100,
    "Instagram": 100,
    "TikTok": 100,
    "Youtube": 100000,
    "Facebook": 100
  },
  "2025-01": {
    "X": 80,
    "Youtube": 90000
  }
}`
  const viewsJsonInvalid = (() => {
    const trimmed = views.trim()
    if (!trimmed) return false
    return parseViewsJson(trimmed) === undefined
  })()
  const formatViewsJson = () => {
    const parsed = parseViewsJson(views)
    if (!parsed) return
    setViews(JSON.stringify(parsed, null, 2))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7 w-full max-w-full pb-16 text-neutral-900 dark:text-neutral-100"
      data-program-manager-form
    >
      <style>{`
        [data-program-manager-form] input:not([type='checkbox']):not([type='radio']),
        [data-program-manager-form] select,
        [data-program-manager-form] textarea {
          width: 100%;
          border: 1px solid rgb(212 212 216);
          border-radius: 12px;
          background: rgb(255 255 255);
          color: rgb(24 24 27);
          box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
          transition: color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
        }
        [data-program-manager-form] input:not([type='checkbox']):not([type='radio']),
        [data-program-manager-form] select {
          height: 3rem;
          min-height: 3rem;
          padding: 0 1rem;
          font-size: 0.8125rem;
          line-height: 1.25rem;
        }
        [data-program-manager-form] textarea {
          min-height: 6rem;
          padding: 0.875rem 1rem;
          font-size: 0.8125rem;
          line-height: 1.35rem;
        }
        [data-program-manager-form] input::placeholder,
        [data-program-manager-form] textarea::placeholder {
          color: rgb(113 113 122 / 0.8);
        }
        [data-program-manager-form] input:not([type='checkbox']):not([type='radio']):focus,
        [data-program-manager-form] select:focus,
        [data-program-manager-form] textarea:focus {
          border-color: rgb(24 24 27);
          box-shadow: 0 0 0 3px rgb(24 24 27 / 0.12), 0 1px 2px rgb(0 0 0 / 0.05);
          outline: none;
        }
        [data-program-manager-form] input:disabled,
        [data-program-manager-form] select:disabled,
        [data-program-manager-form] textarea:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        [data-program-manager-form] input[readonly],
        [data-program-manager-form] textarea[readonly] {
          cursor: not-allowed;
          background: rgb(244 244 245 / 0.8);
        }
        [data-program-manager-form] input[aria-invalid='true'],
        [data-program-manager-form] select[aria-invalid='true'],
        [data-program-manager-form] textarea[aria-invalid='true'] {
          border-color: rgb(220 38 38 / 0.6);
          box-shadow: 0 0 0 3px rgb(220 38 38 / 0.1);
        }
        [data-program-manager-form] input[type='file'] {
          padding: 0;
        }
        [data-program-manager-form] input[type='file']::file-selector-button {
          height: 100%;
          border: 0;
          border-right: 1px solid rgb(214 219 226);
          background: transparent;
          padding: 0 0.75rem;
          color: rgb(24 24 27);
          font: inherit;
          font-weight: 500;
        }
        [data-program-manager-form] input[type='checkbox'] {
          accent-color: rgb(22 163 74);
          height: 1rem;
          width: 1rem;
        }
        [data-program-manager-form] label.block,
        [data-program-manager-form] label.block span,
        [data-program-manager-form] .block.text-sm.font-medium,
        [data-program-manager-form] .block.text-xs.font-medium {
          color: rgb(24 24 27);
          font-size: 0.9375rem;
          font-weight: 700;
          line-height: 1.35rem;
        }
        [data-program-manager-form] label.block,
        [data-program-manager-form] label > span:first-child {
          letter-spacing: 0;
        }
        [data-program-manager-form] .block.text-xs.font-medium {
          font-size: 0.875rem;
        }
        [data-program-manager-form] label.flex:has(> input[type='checkbox']) {
          min-height: 2.5rem;
          align-items: center;
          border: 1px solid rgb(229 231 235);
          border-radius: 12px;
          background: rgb(255 255 255);
          padding: 0.75rem 0.875rem;
          box-shadow: 0 1px 1px rgb(0 0 0 / 0.02);
          transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
        }
        [data-program-manager-form] label.flex:has(> input[type='checkbox']):hover {
          border-color: rgb(187 247 208);
          background: rgb(240 253 244);
        }
        [data-program-manager-form] label.flex:has(> input[type='checkbox']:checked) {
          border-color: rgb(34 197 94);
          background: rgb(240 253 244);
          box-shadow: 0 0 0 1px rgb(34 197 94 / 0.14);
        }
        [data-program-manager-form] button {
          border-radius: 12px;
          transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
        }
        [data-program-manager-form] button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgb(34 197 94 / 0.18);
        }
        @media (prefers-color-scheme: dark) {
          [data-program-manager-form] input:not([type='checkbox']):not([type='radio']),
          [data-program-manager-form] select,
          [data-program-manager-form] textarea {
            border-color: rgb(63 63 70);
            background: rgb(9 9 11);
            color: rgb(244 244 245);
            box-shadow: 0 1px 2px rgb(0 0 0 / 0.22);
          }
          [data-program-manager-form] input::placeholder,
          [data-program-manager-form] textarea::placeholder {
            color: rgb(161 161 170 / 0.75);
          }
          [data-program-manager-form] input:not([type='checkbox']):not([type='radio']):focus,
          [data-program-manager-form] select:focus,
          [data-program-manager-form] textarea:focus {
            border-color: rgb(212 212 216);
            box-shadow: 0 0 0 3px rgb(212 212 216 / 0.18), 0 1px 2px rgb(0 0 0 / 0.22);
          }
          [data-program-manager-form] input[readonly],
          [data-program-manager-form] textarea[readonly] {
            background: rgb(39 39 42 / 0.8);
          }
          [data-program-manager-form] label.block,
          [data-program-manager-form] label.block span,
          [data-program-manager-form] .block.text-sm.font-medium,
          [data-program-manager-form] .block.text-xs.font-medium {
            color: rgb(244 244 245);
          }
          [data-program-manager-form] label.flex:has(> input[type='checkbox']) {
            border-color: rgb(55 65 81);
            background: rgb(17 24 39);
          }
          [data-program-manager-form] label.flex:has(> input[type='checkbox']):hover,
          [data-program-manager-form] label.flex:has(> input[type='checkbox']:checked) {
            border-color: rgb(34 197 94);
            background: rgb(6 78 59 / 0.28);
          }
        }
      `}</style>
      <div className="sticky top-0 z-20 -mx-1 overflow-hidden rounded-3xl border border-neutral-200 bg-white/95 px-4 py-3 shadow-2xl shadow-neutral-900/10 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 dark:shadow-black/30 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Mode</div>
              <div className="font-semibold">{programContentType || 'Series'}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Core fields</div>
              <div className="font-semibold">{completedProgramFields}/7</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Structure</div>
              <div className="font-semibold">{seasons.length} season{seasons.length === 1 ? '' : 's'} / {totalEpisodes} ep</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Flags</div>
              <div className="font-semibold">{enabledFlags} enabled</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="h-12 border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Top
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 bg-neutral-900 px-6 font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save program' : 'Create program')}
            </button>
          </div>
        </div>
        {message && (
          <div
            className={`mt-4 rounded-2xl border p-4 text-sm ${message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
              }`}
          >
            {message.text}
          </div>
        )}
      </div>
      {/* Program section */}
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/20">
        <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-green-700 dark:text-green-400">Program record</p>
              <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">Core information</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Required: slug. Add title and content flags to unlock focused fields.</p>
          </div>
        </div>
        <div className="space-y-5 p-5">
          <div className="rounded-2xl border border-neutral-200 border-l-4 border-l-emerald-500 bg-emerald-50/40 p-4 dark:border-neutral-800 dark:border-l-emerald-400 dark:bg-emerald-950/10">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">Basic Information</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Identify the program and choose the primary content category.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
          {showAny && (
            <div>
              <label className="block text-sm font-medium mb-1">{L('programId', 'Program ID')}</label>
              <input
                type="text"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{L('slug', 'Slug')} *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              required
            />
          </div>
          {showAny && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{L('programContentType', 'Content type')}</label>
              <select
                value={programContentType}
                onChange={(e) => setProgramContentType(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
              >
                <option value="Series">Series</option>
                <option value="Movie">Movie</option>
              </select>
            </div>
          )}
          {showAny && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{L('categories', 'Categories')}</label>
              <CategoryMultiDropdown
                options={categoryOptions}
                value={categories}
                onChange={setCategories}
              />
            </div>
          )}
          {(showScheduleOrFull || showNewHitsOrFull || is_Feature) && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{L('titleTh', 'Title (Thai)')}</label>
                <input
                  type="text"
                  value={titleTh}
                  onChange={(e) => setTitleTh(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('titleEn', 'Title (English)')}</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('genre', 'Genres')}</label>
                <TaxonomyMultiDropdown
                  emptyLabel="Select genres..."
                  noOptionsLabel="No genres yet"
                  options={genreOptions}
                  value={genre}
                  onChange={setGenre}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('genre_sub', 'Sub-genres')}</label>
                <TaxonomyMultiDropdown
                  emptyLabel="Select sub-genres..."
                  noOptionsLabel="No sub-genres yet"
                  options={subGenreOptions}
                  value={genre_sub}
                  onChange={setGenre_sub}
                />
              </div>
            </>
          )}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 border-l-4 border-l-sky-500 bg-sky-50/40 p-4 dark:border-neutral-800 dark:border-l-sky-400 dark:bg-sky-950/10">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-sky-900 dark:text-sky-200">Display Flags & Availability</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Control where this program appears and which feature badges apply.</p>
            </div>
          <div className="sm:col-span-2 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-gray-800 dark:bg-gray-900">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={is_IP} onChange={(e) => setIs_IP(e.target.checked)} />
              <span className="text-sm">Is IP</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={is_Feature} onChange={(e) => setIs_Feature(e.target.checked)} />
              <span className="text-sm">Is Feature</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={is_NEW} onChange={(e) => setIs_NEW(e.target.checked)} />
              <span className="text-sm">Is NEW</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={is_Schedule} onChange={(e) => setIs_Schedule(e.target.checked)} />
              <span className="text-sm">Is Schedule</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isNewHits} onChange={(e) => setIsNewHits(e.target.checked)} />
              <span className="text-sm">Is New Hits</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={is_Detail} onChange={(e) => setIs_Detail(e.target.checked)} />
              <span className="text-sm">Is Detail</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={is_special_programs}
                onChange={(e) => setIs_special_programs(e.target.checked)}
              />
              <span className="text-sm">Is Special Programs</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={is_old_series}
                onChange={(e) => setIs_old_series(e.target.checked)}
              />
              <span className="text-sm">Is Old Series</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={is_discontinued}
                onChange={(e) => setIs_discontinued(e.target.checked)}
              />
              <span className="text-sm">Is Discontinued</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={is_global_programs}
                onChange={(e) => {
                  setIs_global_programs(e.target.checked)
                  if (!e.target.checked) {
                    setIs_global_international(false)
                    setIs_global_thai_dub(false)
                  }
                }}
              />
              <span className="text-sm">Is Global Programs</span>
            </label>
            {is_global_programs && (
              <>
                <label className="flex items-center gap-2 pl-6">
                  <input
                    type="checkbox"
                    checked={is_global_international}
                    onChange={(e) => setIs_global_international(e.target.checked)}
                  />
                  <span className="text-sm">INTERNATIONAL</span>
                </label>
                <label className="flex items-center gap-2 pl-6">
                  <input
                    type="checkbox"
                    checked={is_global_thai_dub}
                    onChange={(e) => setIs_global_thai_dub(e.target.checked)}
                  />
                  <span className="text-sm">Thai Dub</span>
                </label>
              </>
            )}
          </div>
          </div>

          {(showScheduleOrFull || showNewHitsOrFull || is_Feature) && (
            <div className="rounded-2xl border border-neutral-200 border-l-4 border-l-amber-500 bg-amber-50/40 p-4 dark:border-neutral-800 dark:border-l-amber-400 dark:bg-amber-950/10">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Playback Features & Schedule</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Set accessibility features and broadcast dates.</p>
              </div>
              {false && (<>
              <div>
                <label className="block text-sm font-medium mb-1">{L('titleTh', 'Title (Thai)')}</label>
                <input
                  type="text"
                  value={titleTh}
                  onChange={(e) => setTitleTh(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('titleEn', 'Title (English)')}</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('genre', 'Genres')}</label>
                <TaxonomyMultiDropdown
                  emptyLabel="Select genres..."
                  noOptionsLabel="No genres yet"
                  options={genreOptions}
                  value={genre}
                  onChange={setGenre}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('genre_sub', 'Sub-genres')}</label>
                <TaxonomyMultiDropdown
                  emptyLabel="Select sub-genres..."
                  noOptionsLabel="No sub-genres yet"
                  options={subGenreOptions}
                  value={genre_sub}
                  onChange={setGenre_sub}
                />
              </div>
              </>)}
              <div className="sm:col-span-2 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-gray-800 dark:bg-gray-900">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isUncut} onChange={(e) => setIsUncut(e.target.checked)} />
                  <span className="text-sm">Is uncut</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasSoundtrack} onChange={(e) => setHasSoundtrack(e.target.checked)} />
                  <span className="text-sm">Has soundtrack</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasAd} onChange={(e) => setHasAd(e.target.checked)} />
                  <span className="text-sm">Has ad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasCc} onChange={(e) => setHasCc(e.target.checked)} />
                  <span className="text-sm">Has CC</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasSl} onChange={(e) => setHasSl(e.target.checked)} />
                  <span className="text-sm">Has SL</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasBigSign} onChange={(e) => setHasBigSign(e.target.checked)} />
                  <span className="text-sm">Has BigSign</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">First run (Date and Time)</label>
                <input
                  type="datetime-local"
                  value={firstRun}
                  onChange={(e) => setFirstRun(e.target.value)}
                  onBlur={() => setFirstRun((v) => normalizeDateTimeLocal(v))}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              {showScheduleOrFull && !showFull && (
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <input
                    type="number"
                    min={0}
                    value={duration === '' ? '' : duration}
                    onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Rerun dates and times</label>
                <div className="space-y-2">
                  {rerunDates.map((value, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="datetime-local"
                        value={value}
                        onChange={(e) =>
                          setRerunDates((prev) => {
                            const next = [...prev]
                            next[i] = e.target.value
                            return next
                          })
                        }
                        onBlur={() =>
                          setRerunDates((prev) => {
                            const next = [...prev]
                            next[i] = normalizeDateTimeLocal(next[i] || '')
                            return next
                          })
                        }
                        className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRerunDates((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : ['']))
                        }
                        className="rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRerunDates((prev) => [...prev, ''])}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Add rerun date
                  </button>
                </div>
              </div>
            </div>
          )}

          {showNewHitsOrFull && (
            <details className="rounded-2xl border border-neutral-200 border-l-4 border-l-violet-500 bg-violet-50/40 p-4 dark:border-neutral-800 dark:border-l-violet-400 dark:bg-violet-950/10" open>
              <summary className="cursor-pointer list-none">
                <div>
                  <h3 className="text-lg font-bold text-violet-900 dark:text-violet-200">Key Metrics</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Add monthly channel views. Optional helper stays collapsed unless needed.</p>
                </div>
              </summary>
              <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium">Views (JSON)</label>
                <button
                  type="button"
                  onClick={() => setViewsHelperOpen((open) => !open)}
                  className="border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {viewsHelperOpen ? 'Hide JSON helper' : 'Show JSON helper'}
                </button>
              </div>
              {viewsHelperOpen && (
                <div className="mb-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">Need a JSON starter?</p>
                      <p>
                        JSON is written as month keys with channel view counts inside. Keep names in double quotes,
                        use numbers without commas, and put a comma between each line except the last one in a group.
                      </p>
                      <pre className="max-h-44 overflow-auto rounded-xl bg-white p-3 font-mono text-xs leading-5 text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
{viewsJsonTemplate}
                      </pre>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViews(viewsJsonTemplate)}
                        className="border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        Use template
                      </button>
                      <button
                        type="button"
                        onClick={formatViewsJson}
                        disabled={!views.trim() || viewsJsonInvalid}
                        className="border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        Format JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <textarea
                value={views}
                onChange={(e) => setViews(e.target.value)}
                placeholder={'{"2025-02": {"X": 100, "ig": 100, "tiktok": 100, "Youtube": 100000, "facebook": 100}, "2025-01": {"X": 80, "Youtube": 90000}}'}
                rows={6}
                aria-invalid={viewsJsonInvalid}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 font-mono text-sm"
              />
              {viewsJsonInvalid ? (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  This is not valid JSON yet. Check double quotes, commas, and curly braces before saving.
                </p>
              ) : (
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  View counts by month-year. Example month key: &quot;2025-02&quot;. Example channel value: &quot;Youtube&quot;: 100000.
                </p>
              )}
              </div>
            </details>
          )}

          {showAny && (
            <details className="rounded-2xl border border-neutral-200 border-l-4 border-l-rose-500 bg-rose-50/40 p-4 dark:border-neutral-800 dark:border-l-rose-400 dark:bg-rose-950/10" open>
              <summary className="cursor-pointer list-none">
                <div>
                  <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">Images & Attachments</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Upload or select the main images used by the program.</p>
                </div>
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MediaPicker
                label="Image"
                value={image}
                onChange={setImage}
                className="sm:col-span-2"
                initialDisplay={initialImageDisplay}
              />
              <MediaPicker
                label="Cover image"
                value={coverImage}
                onChange={setCoverImage}
                className="sm:col-span-2"
                initialDisplay={initialCoverImageDisplay}
              />

              </div>
            </details>
          )}

          {showFull && (
            <details className="rounded-2xl border border-neutral-200 border-l-4 border-l-teal-500 bg-teal-50/40 p-4 dark:border-neutral-800 dark:border-l-teal-400 dark:bg-teal-950/10" open>
              <summary className="cursor-pointer list-none">
                <div>
                  <h3 className="text-lg font-bold text-teal-900 dark:text-teal-200">Synopsis & Credits</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Describe the program and record the production credits.</p>
                </div>
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex gap-4 items-center flex-wrap">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={comingSoon} onChange={(e) => setComingSoon(e.target.checked)} />
                  <span className="text-sm">Coming soon</span>
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1">{L('comingSoonDate', 'Coming soon date')}</label>
                  <input
                    type="date"
                    value={comingSoonDate}
                    onChange={(e) => setComingSoonDate(e.target.value)}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">{L('synopsisTh', 'Synopsis (Thai)')}</label>
                <textarea
                  value={synopsisTh}
                  onChange={(e) => setSynopsisTh(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">{L('synopsisEn', 'Synopsis (English)')}</label>
                <textarea
                  value={synopsisEn}
                  onChange={(e) => setSynopsisEn(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('companyProduce', 'Company produce')}</label>
                <input
                  type="text"
                  value={companyProduce}
                  onChange={(e) => setCompanyProduce(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('producer', 'Producer')}</label>
                <input
                  type="text"
                  value={producer}
                  onChange={(e) => setProducer(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('artist', 'Artist')}</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('writer', 'Writer')}</label>
                <input
                  type="text"
                  value={writer}
                  onChange={(e) => setWriter(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('type', 'Type')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                >
                  <option value="">—</option>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('tags', 'Tags')}</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              </div>
            </details>
          )}

          {showFull && (
            <details className="rounded-2xl border border-neutral-200 border-l-4 border-l-indigo-500 bg-indigo-50/40 p-4 dark:border-neutral-800 dark:border-l-indigo-400 dark:bg-indigo-950/10" open>
              <summary className="cursor-pointer list-none">
                <div>
                  <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">Media Assets</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Attach trailer/video assets from Airflow, URLs, and video relations.</p>
                </div>
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <AirflowVideoAndThumbnailPicker
                  valueVideo={TrailerAirflowProxyPath}
                  valueThumbnail={TrailerThumbnailAirflowProxyPath}
                  onChangeVideo={setTrailerAirflowProxyPath}
                  onChangeThumbnail={setTrailerThumbnailAirflowProxyPath}
                  labelVideo="Trailer Airflow Proxy Path"
                  labelThumbnail="Trailer Thumbnail Airflow Proxy Path"
                  buttonLabel="Search & pick trailer"
                  modalTitle="Search Airflow — Trailer & Thumbnail"
                />
                {programContentType === 'Movie' && (
                  <AirflowVideoAndThumbnailPicker
                    valueVideo={videoAirflowProxyPath}
                    valueThumbnail={videoThumbnailAirflowProxyPath}
                    onChangeVideo={setVideoAirflowProxyPath}
                    onChangeThumbnail={setVideoThumbnailAirflowProxyPath}
                  />
                )}
              {programContentType === 'Movie' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Trailer link (URL)</label>
                  <input
                    type="url"
                    value={trailerLink}
                    onChange={(e) => setTrailerLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </div>
              ) :
                (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Trailer link (URL)</label>
                    <input
                      type="url"
                      value={trailerLink}
                      onChange={(e) => setTrailerLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                    />
                  </div>
                )}
              {programContentType === 'Movie' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Video link (URL)</label>
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </div>
              )}
              <VideoRelationPicker
                label="Trailer (Videos relation)"
                value={trailer}
                onChange={setTrailer}
                className="sm:col-span-2"
              />
              {programContentType === 'Movie' && (
                <VideoRelationPicker
                  label="Video (Videos relation)"
                  value={video}
                  onChange={setVideo}
                  className="sm:col-span-2"
                />
              )}
              </div>
            </details>
          )}

          {showFull && (
            <details className="rounded-2xl border border-neutral-200 border-l-4 border-l-cyan-500 bg-cyan-50/40 p-4 dark:border-neutral-800 dark:border-l-cyan-400 dark:bg-cyan-950/10" open>
              <summary className="cursor-pointer list-none">
                <div>
                  <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-200">Distribution & Rights</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Set format, platforms, production information, and rights availability.</p>
                </div>
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Media Space</label>
                <input
                  type="text"
                  value={space}
                  onChange={(e) => setSpace(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                >
                  {FORMAT_OPTIONS.map((o) => (
                    <option key={o || 'none'} value={o}>{o || 'None'}</option>
                  ))}
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <input
                    type="number"
                    min={0}
                    value={duration === '' ? '' : duration}
                    onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('targetGroup', 'Older than age')}</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  step={1}
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  placeholder="18"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Platforms</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'onThaipbs', label: 'ThaiPBS', set: setOnThaipbs, val: onThaipbs },
                    { key: 'onVipa', label: 'VIPA', set: setOnVipa, val: onVipa },
                    { key: 'onFacebook', label: 'Facebook', set: setOnFacebook, val: onFacebook },
                    { key: 'onX', label: 'X', set: setOnX, val: onX },
                    { key: 'onYoutube', label: 'YouTube', set: setOnYoutube, val: onYoutube },
                    { key: 'onTiktok', label: 'TikTok', set: setOnTiktok, val: onTiktok },
                  ].map(({ key, label, set, val }) => (
                    <label key={key} className="flex items-center gap-2">
                      <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Production country</label>
                <input
                  type="text"
                  value={productionCountry}
                  onChange={(e) => setProductionCountry(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Production year</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={productionYear === '' ? '' : productionYear}
                  onChange={(e) => setProductionYear(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Rights territories available</label>
                <textarea
                  value={rightsTerritoriesAvailable}
                  onChange={(e) => setRightsTerritoriesAvailable(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                />
              </div>
              </div>
            </details>
          )}
        </div>
      </section>

      {showFull && programContentType === 'Series' && (
        <>
          {/* Seasons */}
          <section className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/20">
              <div className="flex flex-col gap-4 border-b border-neutral-100 bg-neutral-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">Series structure</p>
                  <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">Seasons and episodes</h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Create nested season, episode, pricing, captions, awards, and media metadata.</p>
                </div>
              <button
                type="button"
                onClick={addSeason}
                className="h-12 bg-neutral-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                + Add season
              </button>
              </div>
            </div>

            {seasons.map((seasonRow, si) => {
              const seasonCollapsed = collapsedSeasons.has(seasonRow._key)
              return (
                <div
                  key={seasonRow._key}
                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/20"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSeasonCollapsed(seasonRow._key)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSeasonCollapsed(seasonRow._key) } }}
                    className="w-full flex items-center justify-between gap-4 border-b border-neutral-100 bg-neutral-50 p-4 text-left transition-colors cursor-pointer hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400 select-none" aria-hidden>
                        {seasonCollapsed ? '▶' : '▼'}
                      </span>
                      <h3 className="font-medium">Season {seasonRow.season === '' ? '(new)' : seasonRow.season}{seasonRow.seasonName ? ` — ${seasonRow.seasonName}` : ''}</h3>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveSeason(si, si - 1) }}
                        disabled={si === 0}
                        className="border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        aria-label="Move season up"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveSeason(si, si + 1) }}
                        disabled={si === seasons.length - 1}
                        className="border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        aria-label="Move season down"
                        title="Move down"
                      >
                        ↓
                      </button>
                      {seasons.length >= 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const seasonLabel = `Season ${seasonRow.season === '' ? '(new)' : seasonRow.season}${seasonRow.seasonName ? ` — ${seasonRow.seasonName}` : ''}`
                            if (window.confirm(`Remove ${seasonLabel}? All episodes in it will be removed.`)) removeSeason(si)
                          }}
                          className="text-red-600 hover:underline text-sm ml-2"
                        >
                          Remove season
                        </button>
                      )}
                    </div>
                  </div>
                  {!seasonCollapsed && (
                    <div className="px-5 py-5">
                      <div className="grid gap-4 sm:grid-cols-2 mb-4">
                        <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-emerald-500 bg-emerald-50/30 p-4 dark:border-neutral-700 dark:border-l-emerald-400 dark:bg-emerald-950/10">
                          <div className="mb-4">
                            <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Season Basics</h4>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Number and name this season in Thai and English.</p>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Season #</label>
                          <input
                            type="number"
                            min={1}
                            value={seasonRow.season === '' ? '' : seasonRow.season}
                            onChange={(e) =>
                              updateSeason(si, {
                                season: e.target.value === '' ? '' : Number(e.target.value),
                              })
                            }
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Season name (Thai)</label>
                          <input
                            type="text"
                            value={seasonRow.seasonName}
                            onChange={(e) => updateSeason(si, { seasonName: e.target.value })}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Season name (English)</label>
                          <input
                            type="text"
                            value={seasonRow.seasonNameEn}
                            onChange={(e) => updateSeason(si, { seasonNameEn: e.target.value })}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                          />
                        </div>
                          </div>
                        </div>
                        <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-amber-500 bg-amber-50/30 p-4 dark:border-neutral-700 dark:border-l-amber-400 dark:bg-amber-950/10">
                          <div className="mb-4">
                            <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">Awards</h4>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Record season-level awards and supporting award details.</p>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={seasonRow.is_Award}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  updateSeason(si, {
                                    is_Award: checked,
                                    awards: checked && seasonRow.awards.length === 0 ? [emptySeasonAward()] : seasonRow.awards,
                                  })
                                }}
                              />
                              <span className="text-sm font-medium">Is Award</span>
                            </label>
                            {seasonRow.is_Award && (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => showSeasonAwards(seasonRow)}
                                  disabled={seasonRow.awards.length === 0}
                                  className="border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                >
                                  Show all
                                </button>
                                <button
                                  type="button"
                                  onClick={() => collapseSeasonAwards(seasonRow)}
                                  disabled={seasonRow.awards.length === 0}
                                  className="border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                >
                                  Collapse all
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addSeasonAward(si)}
                                  className="bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
                                >
                                  + Add award
                                </button>
                              </div>
                            )}
                          </div>
                          {seasonRow.is_Award && (
                            <div className="space-y-3">
                              {seasonRow.awards.map((award, ai) => {
                                const awardCollapsed = collapsedAwards.has(award._key)
                                const selectedAwardName = awardOptions.find((option) => option.id === award.awardName)?.name
                                const awardSummary = selectedAwardName || `Award ${ai + 1}`
                                return (
                                  <div key={award._key} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => toggleAwardCollapsed(award._key)}
                                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAwardCollapsed(award._key) } }}
                                      className="flex cursor-pointer items-center justify-between gap-3 p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                      <span className="flex min-w-0 items-center gap-2">
                                        <span className="text-neutral-500 dark:text-neutral-400 select-none" aria-hidden>
                                          {awardCollapsed ? '>' : 'v'}
                                        </span>
                                        <span className="truncate text-sm font-semibold">
                                          {awardSummary}
                                          {award.awardYear !== '' ? ` - ${award.awardYear}` : ''}
                                        </span>
                                      </span>
                                      <div className="flex shrink-0 items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); toggleAwardCollapsed(award._key) }}
                                          className="border border-neutral-300 bg-white px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                        >
                                          {awardCollapsed ? 'Show' : 'Collapse'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); removeSeasonAward(si, ai) }}
                                          className="border border-neutral-300 bg-neutral-100 px-2 py-1 text-xs hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                    {!awardCollapsed && (
                                      <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
                                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px] items-end">
                                          <div>
                                            <label className="block text-xs font-medium mb-1">Award name</label>
                                            <select
                                              value={award.awardName === '' ? '' : award.awardName}
                                              onChange={(e) =>
                                                updateSeasonAward(si, ai, {
                                                  awardName: e.target.value === '' ? '' : Number(e.target.value),
                                                })
                                              }
                                              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                                            >
                                              <option value="">Select award...</option>
                                              {awardOptions.map((option) => (
                                                <option key={option.id} value={option.id}>{option.name}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium mb-1">Year received</label>
                                            <input
                                              type="number"
                                              min={0}
                                              value={award.awardYear === '' ? '' : award.awardYear}
                                              onChange={(e) =>
                                                updateSeasonAward(si, ai, {
                                                  awardYear: e.target.value === '' ? '' : Number(e.target.value),
                                                })
                                              }
                                              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                                            />
                                          </div>
                                        </div>
                                        <div className="mt-3">
                                          <label className="block text-xs font-medium mb-1">Award detail</label>
                                          <AwardDetailRichTextEditor
                                            value={award.awardDetail}
                                            onChange={(next) => updateSeasonAward(si, ai, { awardDetail: next })}
                                          />
                                        </div>
                                        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                          Updated: {award.awardUpdatedAt ? new Date(award.awardUpdatedAt).toLocaleString() : 'After save'}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              {awardOptions.length === 0 && (
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                  Add award names in the Awards collection before selecting them here.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-sky-500 bg-sky-50/30 p-4 dark:border-neutral-700 dark:border-l-sky-400 dark:bg-sky-950/10">
                          <div className="mb-4">
                            <h4 className="text-base font-bold text-sky-900 dark:text-sky-200">Accessibility & Availability</h4>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Set caption, soundtrack, language, and coming-soon availability for this season.</p>
                          </div>
                          <div className="flex gap-4 items-center flex-wrap">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seasonRow.hasCc}
                              onChange={(e) => updateSeason(si, { hasCc: e.target.checked })}
                            />
                            <span className="text-sm">Has CC</span>
                          </label>
                          <div className="min-w-[260px]">
                            <label className="block text-sm font-medium mb-1">Languages</label>
                            <LanguageMultiDropdown
                              options={languageOptions}
                              value={seasonRow.languages}
                              onChange={(next) => updateSeason(si, { languages: next })}
                            />
                          </div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seasonRow.hasSoundtrack}
                              onChange={(e) => {
                                const checked = e.target.checked
                                updateSeason(si, {
                                  hasSoundtrack: checked,
                                  // Keep the relation semantics: if user unchecks, clear selected languages.
                                  languagesSoundtrack: checked ? seasonRow.languagesSoundtrack : [],
                                })
                              }}
                            />
                            <span className="text-sm">Has soundtrack</span>
                          </label>
                          <div className="min-w-[260px]">
                            <label className="block text-sm font-medium mb-1">Soundtrack languages</label>
                            <LanguageMultiDropdown
                              options={languageOptions}
                              value={seasonRow.languagesSoundtrack}
                              onChange={(next) => updateSeason(si, { languagesSoundtrack: next })}
                            />
                          </div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={seasonRow.comingSoon}
                              onChange={(e) => updateSeason(si, { comingSoon: e.target.checked })}
                            />
                            <span className="text-sm">Coming soon</span>
                          </label>
                          <div>
                            <label className="block text-sm font-medium mb-1">Coming soon date</label>
                            <input
                              type="date"
                              value={seasonRow.comingSoonDate}
                              onChange={(e) =>
                                updateSeason(si, { comingSoonDate: e.target.value })
                              }
                              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                            />
                          </div>
                          </div>
                        </div>
                        <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-lime-500 bg-lime-50/30 p-4 dark:border-neutral-700 dark:border-l-lime-400 dark:bg-lime-950/10">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                            <h4 className="text-base font-bold text-lime-900 dark:text-lime-200">Sell price</h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                One price setting for this season. Ready for sale is available when the program is IP.
                              </p>
                            </div>
                            <label className={`flex items-center gap-2 text-sm ${!is_IP ? 'opacity-60' : ''}`}>
                              <input
                                type="checkbox"
                                checked={is_IP && seasonRow.sellPricing.readyForSale}
                                disabled={!is_IP}
                                onChange={(e) => updateSeasonSellPricing(si, { readyForSale: e.target.checked })}
                              />
                              <span>Ready for sale</span>
                            </label>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {seasonRow.sellPricing.formatPrices.map((priceRow, pi) => (
                              <div key={priceRow._key}>
                                <label className="block text-xs font-medium mb-1">{priceRow.format} price</label>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={priceRow.price}
                                  onChange={(e) =>
                                    updateSeasonFormatPrice(si, pi, {
                                      price: e.target.value === '' ? '' : Number(e.target.value),
                                    })
                                  }
                                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="flex items-center gap-2 text-sm mb-2">
                                <input
                                  type="checkbox"
                                  checked={seasonRow.sellPricing.hasCc}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    updateSeasonSellPricing(si, {
                                      hasCc: checked,
                                      ccLanguagePrices: checked ? seasonRow.sellPricing.ccLanguagePrices : [],
                                    })
                                  }}
                                />
                                <span>Sale includes CC</span>
                              </label>
                              {seasonRow.sellPricing.hasCc && (
                                <div className="space-y-2">
                                  {seasonRow.sellPricing.ccLanguagePrices.map((priceRow, pi) => (
                                    <div key={priceRow._key} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                                      <select
                                        value={priceRow.language}
                                        onChange={(e) =>
                                          updateSeasonCcLanguagePrice(si, pi, {
                                            language: e.target.value === '' ? '' : Number(e.target.value),
                                          })
                                        }
                                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm"
                                      >
                                        <option value="">Select language</option>
                                        {languageOptions.map((language) => (
                                          <option key={language.id} value={language.id}>
                                            {language.label || language.code || `#${language.id}`}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        placeholder="Price"
                                        value={priceRow.price}
                                        onChange={(e) =>
                                          updateSeasonCcLanguagePrice(si, pi, {
                                            price: e.target.value === '' ? '' : Number(e.target.value),
                                          })
                                        }
                                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeSeasonCcLanguagePrice(si, pi)}
                                        className="border border-neutral-300 bg-neutral-100 px-2 py-2 text-xs hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addSeasonCcLanguagePrice(si)}
                                    className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-xs hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                  >
                                    Add CC language price
                                  </button>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="flex items-center gap-2 text-sm mb-2">
                                <input
                                  type="checkbox"
                                  checked={seasonRow.sellPricing.hasAd}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    updateSeasonSellPricing(si, {
                                      hasAd: checked,
                                      adPrice: checked ? seasonRow.sellPricing.adPrice : '',
                                    })
                                  }}
                                />
                                <span>Sale includes AD</span>
                              </label>
                              {seasonRow.sellPricing.hasAd && (
                                <div>
                                  <label className="block text-xs font-medium mb-1">AD price</label>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={seasonRow.sellPricing.adPrice}
                                    onChange={(e) =>
                                      updateSeasonSellPricing(si, {
                                        adPrice: e.target.value === '' ? '' : Number(e.target.value),
                                      })
                                    }
                                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-teal-500 bg-teal-50/30 p-4 dark:border-neutral-700 dark:border-l-teal-400 dark:bg-teal-950/10">
                          <div className="mb-4">
                            <h4 className="text-base font-bold text-teal-900 dark:text-teal-200">Season Synopsis</h4>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Add Thai and English descriptions for this season.</p>
                          </div>
                          <div className="grid gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Synopsis Season (Thai)</label>
                          <textarea
                            value={seasonRow.synopsisTh}
                            onChange={(e) => updateSeason(si, { synopsisTh: e.target.value })}
                            rows={2}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Synopsis Season (English)</label>
                          <textarea
                            value={seasonRow.synopsisEn}
                            onChange={(e) => updateSeason(si, { synopsisEn: e.target.value })}
                            rows={2}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                          />
                        </div>
                          </div>
                        </div>
                        <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-indigo-500 bg-indigo-50/30 p-4 dark:border-neutral-700 dark:border-l-indigo-400 dark:bg-indigo-950/10">
                          <div className="mb-4">
                            <h4 className="text-base font-bold text-indigo-900 dark:text-indigo-200">Season Media</h4>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Attach trailer/video assets, links, video relations, and cover image.</p>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                        <AirflowVideoAndThumbnailPicker
                          valueVideo={seasonRow.TrailerAirflowProxyPath}
                          valueThumbnail={seasonRow.TrailerThumbnailAirflowProxyPath}
                          onChangeVideo={(v) => updateSeason(si, { TrailerAirflowProxyPath: v })}
                          onChangeThumbnail={(v) => updateSeason(si, { TrailerThumbnailAirflowProxyPath: v })}
                          labelVideo="Trailer Airflow Proxy Path"
                          labelThumbnail="Trailer Thumbnail Airflow Proxy Path"
                          buttonLabel="Search & pick trailer"
                          modalTitle="Search Airflow — Trailer & Thumbnail"
                        />
                        <AirflowVideoAndThumbnailPicker
                          valueVideo={seasonRow.videoAirflowProxyPath}
                          valueThumbnail={seasonRow.videoThumbnailAirflowProxyPath}
                          onChangeVideo={(v) => updateSeason(si, { videoAirflowProxyPath: v })}
                          onChangeThumbnail={(v) => updateSeason(si, { videoThumbnailAirflowProxyPath: v })}
                        />
                        <div>
                          <label className="block text-sm font-medium mb-1">Trailer link (URL)</label>
                          <input
                            type="url"
                            value={seasonRow.trailerLink}
                            onChange={(e) => updateSeason(si, { trailerLink: e.target.value })}
                            placeholder="https://..."
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Video link (URL)</label>
                          <input
                            type="url"
                            value={seasonRow.videoLink}
                            onChange={(e) => updateSeason(si, { videoLink: e.target.value })}
                            placeholder="https://..."
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                          />
                        </div>

                        <VideoRelationPicker
                          label="Trailer (Videos relation)"
                          value={seasonRow.trailer}
                          onChange={(v) => updateSeason(si, { trailer: v })}
                          className="sm:col-span-2"
                        />
                        <VideoRelationPicker
                          label="Video (Videos relation)"
                          value={seasonRow.video}
                          onChange={(v) => updateSeason(si, { video: v })}
                          className="sm:col-span-2"
                        />
                        <div className="sm:col-span-2">
                          <MediaPicker
                            label="Cover image"
                            value={seasonRow.coverImage}
                            onChange={(v) => updateSeason(si, { coverImage: v })}
                          />
                        </div>
                          </div>
                        </div>
                      </div>

                      {/* Episodes in this season */}
                      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">Episodes</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{seasonRow.episodes.length} episode{seasonRow.episodes.length === 1 ? '' : 's'} in this season</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addEpisode(si)}
                            className="bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
                          >
                            + Add episode
                          </button>
                        </div>
                        {seasonRow.episodes.map((epRow, ei) => {
                          const episodeCollapsed = collapsedEpisodes.has(epRow._key)
                          return (
                            <div
                              key={epRow._key}
                              className="mb-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleEpisodeCollapsed(epRow._key)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEpisodeCollapsed(epRow._key) } }}
                                className="w-full flex items-center justify-between gap-4 border-b border-neutral-100 bg-white p-3 text-left transition-colors cursor-pointer hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-neutral-500 dark:text-neutral-400 select-none text-xs" aria-hidden>
                                    {episodeCollapsed ? '▶' : '▼'}
                                  </span>
                                  <span className="text-sm font-medium">Episode {epRow.ep === '' ? '(new)' : epRow.ep}{epRow.epNameTh || epRow.epNameEn ? ` — ${epRow.epNameTh || epRow.epNameEn}` : ''}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); moveEpisode(si, ei, ei - 1) }}
                                    disabled={ei === 0}
                                    className="border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                    aria-label="Move episode up"
                                    title="Move up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); moveEpisode(si, ei, ei + 1) }}
                                    disabled={ei === seasonRow.episodes.length - 1}
                                    className="border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                    aria-label="Move episode down"
                                    title="Move down"
                                  >
                                    ↓
                                  </button>
                                  {seasonRow.episodes.length >= 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const epLabel = `Episode ${epRow.ep === '' ? '(new)' : epRow.ep}${epRow.epNameTh || epRow.epNameEn ? ` — ${epRow.epNameTh || epRow.epNameEn}` : ''}`
                                        if (window.confirm(`Remove ${epLabel}?`)) removeEpisode(si, ei)
                                      }}
                                      className="text-red-600 hover:underline text-sm ml-2"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                              {!episodeCollapsed && (
                                <div className="p-4 pt-4">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-emerald-500 bg-emerald-50/30 p-4 dark:border-neutral-800 dark:border-l-emerald-400 dark:bg-emerald-950/10">
                                      <div className="mb-3">
                                        <h5 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Episode Basics</h5>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Number and name this episode.</p>
                                      </div>
                                      <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Ep #</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={epRow.ep === '' ? '' : epRow.ep}
                                        onChange={(e) =>
                                          updateEpisode(si, ei, {
                                            ep:
                                              e.target.value === '' ? '' : Number(e.target.value),
                                          })
                                        }
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Name (Thai)</label>
                                      <input
                                        type="text"
                                        value={epRow.epNameTh}
                                        onChange={(e) =>
                                          updateEpisode(si, ei, { epNameTh: e.target.value })
                                        }
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Name (English)</label>
                                      <input
                                        type="text"
                                        value={epRow.epNameEn}
                                        onChange={(e) =>
                                          updateEpisode(si, ei, { epNameEn: e.target.value })
                                        }
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                      </div>
                                    </div>
                                    <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-amber-500 bg-amber-50/30 p-4 dark:border-neutral-800 dark:border-l-amber-400 dark:bg-amber-950/10">
                                      <div className="mb-3">
                                        <h5 className="text-base font-bold text-amber-900 dark:text-amber-200">Episode Schedule</h5>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Set coming-soon status, first run, and rerun dates.</p>
                                      </div>
                                      <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Coming soon date</label>
                                      <input
                                        type="date"
                                        value={epRow.comingSoonDate}
                                        onChange={(e) =>
                                          updateEpisode(si, ei, { comingSoonDate: e.target.value })
                                        }
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`ep-coming-${si}-${ei}`}
                                        checked={epRow.comingSoon}
                                        onChange={(e) =>
                                          updateEpisode(si, ei, { comingSoon: e.target.checked })
                                        }
                                      />
                                      <label htmlFor={`ep-coming-${si}-${ei}`} className="text-sm">
                                        Coming soon
                                      </label>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium mb-1">First run (Date and Time)</label>
                                      <input
                                        type="datetime-local"
                                        value={epRow.firstRun}
                                        onChange={(e) => updateEpisode(si, ei, { firstRun: e.target.value })}
                                        onBlur={() => updateEpisode(si, ei, { firstRun: normalizeDateTimeLocal(epRow.firstRun) })}
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-xs font-medium mb-1">Rerun dates and times</label>
                                      <div className="space-y-2">
                                        {epRow.rerunDates.map((value, ri) => (
                                          <div key={ri} className="flex gap-2 items-center">
                                            <input
                                              type="datetime-local"
                                              value={value}
                                              onChange={(e) => {
                                                const next = [...epRow.rerunDates]
                                                next[ri] = e.target.value
                                                updateEpisode(si, ei, { rerunDates: next })
                                              }}
                                              onBlur={() => {
                                                const next = [...epRow.rerunDates]
                                                next[ri] = normalizeDateTimeLocal(next[ri] || '')
                                                updateEpisode(si, ei, { rerunDates: next })
                                              }}
                                              className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const next = epRow.rerunDates.length > 1
                                                  ? epRow.rerunDates.filter((_, j) => j !== ri)
                                                  : ['']
                                                updateEpisode(si, ei, { rerunDates: next })
                                              }}
                                              className="rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1.5 text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => updateEpisode(si, ei, { rerunDates: [...epRow.rerunDates, ''] })}
                                          className="rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1.5 text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                          Add rerun date
                                        </button>
                                      </div>
                                    </div>
                                      </div>
                                    </div>
                                    <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-teal-500 bg-teal-50/30 p-4 dark:border-neutral-800 dark:border-l-teal-400 dark:bg-teal-950/10">
                                      <div className="mb-3">
                                        <h5 className="text-base font-bold text-teal-900 dark:text-teal-200">Episode Synopsis</h5>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Add Thai and English descriptions for this episode.</p>
                                      </div>
                                      <div className="grid gap-3">
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Synopsis Episode (Thai)</label>
                                      <textarea
                                        value={epRow.synopsisEpTh}
                                        onChange={(e) =>
                                          updateEpisode(si, ei, { synopsisEpTh: e.target.value })
                                        }
                                        rows={2}
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Synopsis Episode (English)</label>
                                      <textarea
                                        value={epRow.synopsisEpEn}
                                        onChange={(e) =>
                                          updateEpisode(si, ei, { synopsisEpEn: e.target.value })
                                        }
                                        rows={2}
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                      </div>
                                    </div>
                                    <div className="sm:col-span-2 rounded-2xl border border-neutral-200 border-l-4 border-l-indigo-500 bg-indigo-50/30 p-4 dark:border-neutral-800 dark:border-l-indigo-400 dark:bg-indigo-950/10">
                                      <div className="mb-3">
                                        <h5 className="text-base font-bold text-indigo-900 dark:text-indigo-200">Episode Media</h5>
                                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Attach trailer/video assets, links, video relations, and cover image.</p>
                                      </div>
                                      <div className="grid gap-3 sm:grid-cols-2">
                                    <AirflowVideoAndThumbnailPicker
                                      valueVideo={epRow.TrailerAirflowProxyPath}
                                      valueThumbnail={epRow.TrailerThumbnailAirflowProxyPath}
                                      onChangeVideo={(v) => updateEpisode(si, ei, { TrailerAirflowProxyPath: v })}
                                      onChangeThumbnail={(v) => updateEpisode(si, ei, { TrailerThumbnailAirflowProxyPath: v })}
                                      labelVideo="Trailer Airflow Proxy Path"
                                      labelThumbnail="Trailer Thumbnail Airflow Proxy Path"
                                      buttonLabel="Search & pick trailer"
                                      modalTitle="Search Airflow — Trailer & Thumbnail"
                                      className="text-sm"
                                    />
                                    <AirflowVideoAndThumbnailPicker
                                      valueVideo={epRow.videoAirflowProxyPath}
                                      valueThumbnail={epRow.videoThumbnailAirflowProxyPath}
                                      onChangeVideo={(v) => updateEpisode(si, ei, { videoAirflowProxyPath: v })}
                                      onChangeThumbnail={(v) => updateEpisode(si, ei, { videoThumbnailAirflowProxyPath: v })}
                                      className="text-sm"
                                    />
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Trailer link (URL)</label>
                                      <input
                                        type="url"
                                        value={epRow.trailerLink}
                                        onChange={(e) => updateEpisode(si, ei, { trailerLink: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium mb-1">Video link (URL)</label>
                                      <input
                                        type="url"
                                        value={epRow.videoLink}
                                        onChange={(e) => updateEpisode(si, ei, { videoLink: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
                                      />
                                    </div>
                                    <VideoRelationPicker
                                      label="Trailer (Videos relation)"
                                      value={epRow.trailer}
                                      onChange={(v) => updateEpisode(si, ei, { trailer: v })}
                                      className="sm:col-span-2"
                                    />
                                    <VideoRelationPicker
                                      label="Video (Videos relation)"
                                      value={epRow.video}
                                      onChange={(v) => updateEpisode(si, ei, { video: v })}
                                      className="sm:col-span-2"
                                    />
                                    <div className="sm:col-span-2">
                                      <MediaPicker
                                        label="Cover image"
                                        value={epRow.coverImage}
                                        onChange={(v) => updateEpisode(si, ei, { coverImage: v })}
                                        className="text-sm"
                                      />
                                    </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </form>
  )
}
