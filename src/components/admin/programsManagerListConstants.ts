/** Shared by ProgramsManagerList (server) and ProgramsManagerListToolbar (client). No 'use client'. */

export type FilterCondition = { field: string; operator: string; value: string }

/** Programs per page: min, max, default and options for the dropdown. */
export const PER_PAGE_MIN = 10
export const PER_PAGE_MAX = 200
export const PER_PAGE_DEFAULT = 20
/** Options for "per page" dropdown (10, 20, 50, 100, 150, 200). */
export const PER_PAGE_OPTIONS = [10, 20, 50, 100, 150, 200] as const

/** All columns available in the Programs Manager list (like default Payload list column picker). */
export interface ProgramsListColumnDef {
  id: string
  label: string
  /** Sort key for list query; omit for cover, actions, and non-sortable fields (e.g. relationship). */
  sortKey?: string
}

export const PROGRAMS_LIST_COLUMNS: ProgramsListColumnDef[] = [
  { id: 'cover', label: 'Cover / Image' },
  { id: 'programId', label: 'Program ID', sortKey: 'programId' },
  { id: 'slug', label: 'Slug', sortKey: 'slug' },
  { id: 'is_NEW', label: 'Is NEW', sortKey: 'is_NEW' },
  { id: 'is_Schedule', label: 'Is Schedule', sortKey: 'is_Schedule' },
  { id: 'isNewHits', label: 'Is New Hits', sortKey: 'isNewHits' },
  { id: 'is_Award', label: 'Is Award', sortKey: 'is_Award' },
  { id: 'is_Detail', label: 'Is Detail', sortKey: 'is_Detail' },
  { id: 'is_special_programs', label: 'Is Special Programs', sortKey: 'is_special_programs' },
  { id: 'is_old_series', label: 'Is Old Series', sortKey: 'is_old_series' },
  { id: 'is_global_programs', label: 'Is Global Programs', sortKey: 'is_global_programs' },
  { id: 'is_global_international', label: 'INTERNATIONAL', sortKey: 'is_global_international' },
  { id: 'is_global_thai_dub', label: 'Thai Dub', sortKey: 'is_global_thai_dub' },
  { id: 'is_normal_programs', label: 'Is Normal Programs', sortKey: 'is_normal_programs' },
  { id: 'titleTh', label: 'Title (Thai)', sortKey: 'titleTh' },
  { id: 'titleEn', label: 'Title (English)', sortKey: 'titleEn' },
  { id: '_displayTitle', label: 'Display Title', sortKey: '_displayTitle' },
  { id: 'programContentType', label: 'Content Type', sortKey: 'programContentType' },
  { id: 'comingSoon', label: 'Coming Soon', sortKey: 'comingSoon' },
  { id: 'comingSoonDate', label: 'Coming Soon Date', sortKey: 'comingSoonDate' },
  { id: 'synopsisTh', label: 'Synopsis (Thai)', sortKey: 'synopsisTh' },
  { id: 'synopsisEn', label: 'Synopsis (English)', sortKey: 'synopsisEn' },
  { id: 'companyProduce', label: 'Company Produce', sortKey: 'companyProduce' },
  { id: 'producer', label: 'Producer', sortKey: 'producer' },
  { id: 'artist', label: 'Artist', sortKey: 'artist' },
  { id: 'writer', label: 'Writer', sortKey: 'writer' },
  { id: 'targetGroup', label: 'Older Than Age', sortKey: 'targetGroup' },
  { id: 'type', label: 'Type', sortKey: 'type' },
  { id: 'genre', label: 'Genres' },
  { id: 'genre_sub', label: 'Sub-genres' },
  { id: 'tags', label: 'Tags', sortKey: 'tags' },
  { id: 'comment', label: 'Comment', sortKey: 'comment' },
  { id: 'image', label: 'Image' },
  { id: 'coverImage', label: 'Cover Image' },
  { id: 'TrailerAirflowProxyPath', label: 'Trailer Airflow Path', sortKey: 'TrailerAirflowProxyPath' },
  { id: 'TrailerThumbnailAirflowProxyPath', label: 'Trailer Thumbnail Airflow Path', sortKey: 'TrailerThumbnailAirflowProxyPath' },
  { id: 'videoAirflowProxyPath', label: 'Video Airflow Path', sortKey: 'videoAirflowProxyPath' },
  { id: 'videoThumbnailAirflowProxyPath', label: 'Video Thumbnail Airflow Path', sortKey: 'videoThumbnailAirflowProxyPath' },
  { id: 'videoLink', label: 'Video Link', sortKey: 'videoLink' },
  { id: 'trailerLink', label: 'Trailer Link', sortKey: 'trailerLink' },
  { id: 'is_IP', label: 'Is IP', sortKey: 'is_IP' },
  { id: 'is_Feature', label: 'Is Feature', sortKey: 'is_Feature' },
  { id: 'isUncut', label: 'Is Uncut', sortKey: 'isUncut' },
  { id: 'firstRun', label: 'First Run', sortKey: 'firstRun' },
  { id: 'space', label: 'Media Space', sortKey: 'space' },
  { id: 'format', label: 'Format', sortKey: 'format' },
  { id: 'duration', label: 'Duration', sortKey: 'duration' },
  { id: 'onThaipbs', label: 'On ThaiPBS', sortKey: 'onThaipbs' },
  { id: 'onAltv', label: 'On ALTV', sortKey: 'onAltv' },
  { id: 'onVipa', label: 'On VIPA', sortKey: 'onVipa' },
  { id: 'onFacebook', label: 'On Facebook', sortKey: 'onFacebook' },
  { id: 'onX', label: 'On X', sortKey: 'onX' },
  { id: 'onYoutube', label: 'On YouTube', sortKey: 'onYoutube' },
  { id: 'onTiktok', label: 'On TikTok', sortKey: 'onTiktok' },
  { id: 'views', label: 'Views', sortKey: 'views' },
  { id: 'productionCountry', label: 'Production Country', sortKey: 'productionCountry' },
  { id: 'productionYear', label: 'Production Year', sortKey: 'productionYear' },
  { id: 'rightsTerritoriesAvailable', label: 'Rights Territories', sortKey: 'rightsTerritoriesAvailable' },
  { id: 'audioChannel1_2', label: 'Audio Channel 1/2', sortKey: 'audioChannel1_2' },
  { id: 'audioChannel3_4', label: 'Audio Channel 3/4', sortKey: 'audioChannel3_4' },
  { id: 'closeCaption1', label: 'Close Caption 1', sortKey: 'closeCaption1' },
  { id: 'closeCaption2', label: 'Close Caption 2', sortKey: 'closeCaption2' },
  { id: 'closeCaption3', label: 'Close Caption 3', sortKey: 'closeCaption3' },
  { id: 'subtitle1', label: 'Subtitle 1', sortKey: 'subtitle1' },
  { id: 'file_type', label: 'File Type', sortKey: 'file_type' },
  { id: 'version', label: 'Version', sortKey: 'version' },
  { id: 'file_ext', label: 'File Extension', sortKey: 'file_ext' },
  { id: 'is_infosheet_write', label: 'Infosheet Write', sortKey: 'is_infosheet_write' },
  { id: 'asset_create', label: 'Asset Create', sortKey: 'asset_create' },
  { id: 'asset_update', label: 'Asset Update', sortKey: 'asset_update' },
  { id: 'createdAt', label: 'Created', sortKey: 'createdAt' },
  { id: 'updatedAt', label: 'Updated', sortKey: 'updatedAt' },
  { id: 'seasons', label: 'Seasons' },
  { id: 'actions', label: 'Actions' },
]

/** Default visible columns when none are specified (like default list). */
export const DEFAULT_VISIBLE_COLUMN_IDS = [
  'cover',
  'programId',
  'titleTh',
  'titleEn',
  'programContentType',
  'is_normal_programs',
  'is_global_programs',
  'is_global_international',
  'is_global_thai_dub',
  'updatedAt',
  'actions',
] as const

/** All column ids (for validation). */
export const ALL_COLUMN_IDS = PROGRAMS_LIST_COLUMNS.map((c) => c.id)

/** Legacy export for backward compatibility; prefer DEFAULT_VISIBLE_COLUMN_IDS. */
export const COLUMN_IDS = DEFAULT_VISIBLE_COLUMN_IDS

/** Filter field type and options for Add filter (all filterable columns). */
export type FilterFieldType = 'text' | 'select' | 'number' | 'date' | 'checkbox'

export interface ProgramsFilterFieldDef {
  field: string
  label: string
  type: FilterFieldType
  options?: { label: string; value: string }[]
}

/** All program fields that can be used in "Add filter", with type and select options. */
export const PROGRAMS_FILTER_FIELDS: ProgramsFilterFieldDef[] = [
  { field: 'programId', label: 'Program ID', type: 'text' },
  { field: 'slug', label: 'Slug', type: 'text' },
  { field: 'is_NEW', label: 'Is NEW', type: 'checkbox' },
  { field: 'is_Schedule', label: 'Is Schedule', type: 'checkbox' },
  { field: 'isNewHits', label: 'Is New Hits', type: 'checkbox' },
  { field: 'is_Award', label: 'Is Award', type: 'checkbox' },
  { field: 'is_Detail', label: 'Is Detail', type: 'checkbox' },
  { field: 'is_special_programs', label: 'Is Special Programs', type: 'checkbox' },
  { field: 'is_old_series', label: 'Is Old Series', type: 'checkbox' },
  { field: 'is_global_programs', label: 'Is Global Programs', type: 'checkbox' },
  { field: 'is_global_international', label: 'INTERNATIONAL', type: 'checkbox' },
  { field: 'is_global_thai_dub', label: 'Thai Dub', type: 'checkbox' },
  { field: 'is_normal_programs', label: 'Is Normal Programs', type: 'checkbox' },
  { field: 'titleTh', label: 'Title (Thai)', type: 'text' },
  { field: 'titleEn', label: 'Title (English)', type: 'text' },
  { field: '_displayTitle', label: 'Display Title', type: 'text' },
  {
    field: 'programContentType',
    label: 'Content Type',
    type: 'select',
    options: [
      { label: 'Series', value: 'Series' },
      { label: 'Movie', value: 'Movie' },
    ],
  },
  { field: 'comingSoon', label: 'Coming Soon', type: 'checkbox' },
  { field: 'comingSoonDate', label: 'Coming Soon Date', type: 'date' },
  { field: 'synopsisTh', label: 'Synopsis (Thai)', type: 'text' },
  { field: 'synopsisEn', label: 'Synopsis (English)', type: 'text' },
  { field: 'companyProduce', label: 'Company Produce', type: 'text' },
  { field: 'producer', label: 'Producer', type: 'text' },
  { field: 'artist', label: 'Artist', type: 'text' },
  { field: 'writer', label: 'Writer', type: 'text' },
  { field: 'targetGroup', label: 'Older Than Age', type: 'number' },
  {
    field: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { label: 'Short Clip', value: 'Short Clip' },
      { label: 'Trailer', value: 'Trailer' },
      { label: 'PodCast', value: 'PodCast' },
      { label: 'Spot', value: 'Spot' },
      { label: 'Filler', value: 'Filler' },
      { label: 'Demo', value: 'Demo' },
      { label: 'Program', value: 'Program' },
      { label: 'Picture', value: 'Picture' },
      { label: 'Poster', value: 'Poster' },
      { label: 'Footage', value: 'Footage' },
    ],
  },
  { field: 'genre', label: 'Genres', type: 'text' },
  { field: 'genre_sub', label: 'Sub-genres', type: 'text' },
  { field: 'tags', label: 'Tags', type: 'text' },
  { field: 'comment', label: 'Comment', type: 'text' },
  { field: 'TrailerAirflowProxyPath', label: 'Trailer Airflow Path', type: 'text' },
  { field: 'TrailerThumbnailAirflowProxyPath', label: 'Trailer Thumbnail Airflow Path', type: 'text' },
  { field: 'videoAirflowProxyPath', label: 'Video Airflow Path', type: 'text' },
  { field: 'videoThumbnailAirflowProxyPath', label: 'Video Thumbnail Airflow Path', type: 'text' },
  { field: 'videoLink', label: 'Video Link', type: 'text' },
  { field: 'trailerLink', label: 'Trailer Link', type: 'text' },
  { field: 'is_IP', label: 'Is IP', type: 'checkbox' },
  { field: 'is_Feature', label: 'Is Feature', type: 'checkbox' },
  { field: 'isUncut', label: 'Is Uncut', type: 'checkbox' },
  { field: 'firstRun', label: 'First Run', type: 'date' },
  { field: 'space', label: 'Media Space', type: 'text' },
  {
    field: 'format',
    label: 'Format',
    type: 'select',
    options: [
      { label: 'None', value: '' },
      { label: 'HD', value: 'HD' },
      { label: 'UHD 4K', value: 'UHD 4K' },
    ],
  },
  { field: 'duration', label: 'Duration', type: 'number' },
  { field: 'onThaipbs', label: 'On ThaiPBS', type: 'checkbox' },
  { field: 'onAltv', label: 'On ALTV', type: 'checkbox' },
  { field: 'onVipa', label: 'On VIPA', type: 'checkbox' },
  { field: 'onFacebook', label: 'On Facebook', type: 'checkbox' },
  { field: 'onX', label: 'On X', type: 'checkbox' },
  { field: 'onYoutube', label: 'On YouTube', type: 'checkbox' },
  { field: 'onTiktok', label: 'On TikTok', type: 'checkbox' },
  { field: 'views', label: 'Views', type: 'text' },
  { field: 'productionCountry', label: 'Production Country', type: 'text' },
  { field: 'productionYear', label: 'Production Year', type: 'number' },
  { field: 'rightsTerritoriesAvailable', label: 'Rights Territories', type: 'text' },
  {
    field: 'audioChannel1_2',
    label: 'Audio Channel 1/2',
    type: 'select',
    options: [
      { label: 'None', value: '' },
      { label: 'Full Mix_Thai', value: 'Full Mix_Thai' },
      { label: 'Full Mix_English', value: 'Full Mix_English' },
      { label: 'Full Mix_Japanese', value: 'Full Mix_Japanese' },
      { label: 'Full Mix_Chinese', value: 'Full Mix_Chinese' },
      { label: 'Music & Effect', value: 'Music & Effect' },
    ],
  },
  {
    field: 'audioChannel3_4',
    label: 'Audio Channel 3/4',
    type: 'select',
    options: [
      { label: 'None', value: '' },
      { label: 'Full Mix_Thai', value: 'Full Mix_Thai' },
      { label: 'Full Mix_English', value: 'Full Mix_English' },
      { label: 'Full Mix_Japanese', value: 'Full Mix_Japanese' },
      { label: 'Full Mix_Chinese', value: 'Full Mix_Chinese' },
      { label: 'Music & Effect', value: 'Music & Effect' },
    ],
  },
  {
    field: 'closeCaption1',
    label: 'Close Caption 1',
    type: 'select',
    options: [
      { label: 'Thai', value: 'Thai' },
      { label: 'Eng', value: 'Eng' },
      { label: 'Myanmar', value: 'Myanmar' },
      { label: 'Chinese', value: 'Chinese' },
      { label: 'Japan', value: 'Japan' },
      { label: 'None', value: '' },
    ],
  },
  {
    field: 'closeCaption2',
    label: 'Close Caption 2',
    type: 'select',
    options: [
      { label: 'Thai', value: 'Thai' },
      { label: 'Eng', value: 'Eng' },
      { label: 'Myanmar', value: 'Myanmar' },
      { label: 'Chinese', value: 'Chinese' },
      { label: 'Japan', value: 'Japan' },
      { label: 'None', value: '' },
    ],
  },
  {
    field: 'closeCaption3',
    label: 'Close Caption 3',
    type: 'select',
    options: [
      { label: 'Thai', value: 'Thai' },
      { label: 'Eng', value: 'Eng' },
      { label: 'Myanmar', value: 'Myanmar' },
      { label: 'Chinese', value: 'Chinese' },
      { label: 'Japan', value: 'Japan' },
      { label: 'None', value: '' },
    ],
  },
  {
    field: 'subtitle1',
    label: 'Subtitle 1',
    type: 'select',
    options: [
      { label: 'Burn Thai-Sub Into Video', value: 'Burn Thai-Sub Into Video' },
      { label: 'Burn Eng-Sub Into Video', value: 'Burn Eng-Sub Into Video' },
      { label: 'Thai-Sub Sidecar File', value: 'Thai-Sub Sidecar File' },
      { label: 'Eng-Sub Sidecar File', value: 'Eng-Sub Sidecar File' },
      { label: 'Interviewer Local-Sub', value: 'Interviewer Local-Sub' },
      { label: 'None', value: '' },
    ],
  },
  { field: 'file_type', label: 'File Type', type: 'text' },
  { field: 'version', label: 'Version', type: 'number' },
  { field: 'file_ext', label: 'File Extension', type: 'text' },
  { field: 'is_infosheet_write', label: 'Infosheet Write', type: 'checkbox' },
  { field: 'asset_create', label: 'Asset Create', type: 'date' },
  { field: 'asset_update', label: 'Asset Update', type: 'date' },
  { field: 'createdAt', label: 'Created', type: 'date' },
  { field: 'updatedAt', label: 'Updated', type: 'date' },
]
