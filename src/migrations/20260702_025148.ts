import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  if (process.env.PAYLOAD_DB_SCHEMA !== 'pavillions') {
    return
  }

  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "pavillions";
   CREATE TYPE "pavillions"."enum_users_allowed_admin_pages" AS ENUM('dashboard', 'season-sales', 'programs-manager', 'add-program-season-ep', 'programs-manager-edit', 'programs-detail-upload', 'trends-upload', 'large-video-upload');
  CREATE TYPE "pavillions"."enum_users_collection_permissions_operations" AS ENUM('read', 'create', 'update', 'delete');
  CREATE TYPE "pavillions"."enum_users_collection_permissions_collection" AS ENUM('users', 'roleProfiles', 'userGroups', 'media', 'videos', 'landing', 'trends', 'content', 'header', 'footer', 'languages', 'awards', 'programs', 'vipaPrograms', 'seasons', 'episodes');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_users" AS ENUM('email', 'role', 'roles', 'groups', 'ownedPrograms', 'ownedVipaPrograms', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_roleprofiles" AS ENUM('name', 'users', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_usergroups" AS ENUM('name', 'users', 'ownedPrograms', 'ownedVipaPrograms', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_media" AS ENUM('title', 'alt');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_videos" AS ENUM('title', 'alt');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_landing" AS ENUM('title', 'heroImage');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_trends" AS ENUM('type', 'title', 'link', 'image', 'boxHeight');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_content" AS ENUM('slug', 'titleTh', 'titleEn', 'topicSections', 'contentTh', 'contentEn');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_header" AS ENUM('titleTh', 'titleEn', 'items');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_footer" AS ENUM('titleTh', 'titleEn', 'items');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_languages" AS ENUM('code', 'label');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_awards" AS ENUM('name');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_programs" AS ENUM('programId', 'slug', 'titleTh', 'titleEn', 'programContentType', 'comingSoon', 'comingSoonDate', 'synopsisTh', 'synopsisEn', 'companyProduce', 'producer', 'artist', 'writer', 'targetGroup', 'programType', 'genre', 'subGenre', 'tags', 'comment', 'image', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink', 'is_IP', 'is_Feature', 'is_NEW', 'is_Schedule', 'isNewHits', 'is_Award', 'is_special_programs', 'is_old_series', 'is_global_programs', 'is_global_international', 'is_global_thai_dub', 'is_normal_programs', 'is_Detail', 'hasSoundtrack', 'hasAd', 'hasCc', 'hasSl', 'hasBigSign', 'isUncut', 'firstRun', 'rerunDates', 'space', 'format', 'duration', 'onThaipbs', 'onAltv', 'onVipa', 'onFacebook', 'onX', 'onYoutube', 'onTiktok', 'views', 'productionCountry', 'productionYear', 'rightsTerritoriesAvailable', 'audioChannel1', 'audioChannel2', 'closeCaption1', 'closeCaption2', 'closeCaption3', 'subtitle1', 'file_type', 'version', 'file_ext', 'is_infosheet_write', 'asset_create', 'asset_update', 'seasons');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_vipaprograms" AS ENUM('titleTh', 'titleEn', 'isNEW', 'isSchedule', 'isNewHits', 'is_special_programs', 'is_old_series', 'isFeature', 'is_IP', 'isThaiProgram', 'isInterProgram', 'image', 'coverImage', 'vipaLink', 'genre', 'tags', 'firstRun', 'rerunDates', 'duration', 'hasSoundtrack', 'hasAd', 'hasCc', 'hasSl', 'hasBigSign', 'isUncut', 'epCount', 'views');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_seasons" AS ENUM('program', 'season', 'seasonName', 'seasonNameEn', 'is_Award', 'awards', 'hasCc', 'languages', 'hasSoundtrack', 'languagesSoundtrack', 'comingSoon', 'comingSoonDate', 'synopsisTh', 'synopsisEn', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink', 'sellPricing', 'episodes');
  CREATE TYPE "pavillions"."enum_users_field_permissions_fields_episodes" AS ENUM('season', 'ep', 'epNameTh', 'epNameEn', 'comingSoon', 'comingSoonDate', 'firstRun', 'rerunDates', 'synopsisEpTh', 'synopsisEpEn', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink');
  CREATE TYPE "pavillions"."enum_users_field_permissions_collection" AS ENUM('users', 'roleProfiles', 'userGroups', 'media', 'videos', 'landing', 'trends', 'content', 'header', 'footer', 'languages', 'awards', 'programs', 'vipaPrograms', 'seasons', 'episodes');
  CREATE TYPE "pavillions"."enum_users_role" AS ENUM('super-admin', 'user');
  CREATE TYPE "pavillions"."enum_role_profiles_allowed_admin_pages" AS ENUM('dashboard', 'season-sales', 'programs-manager', 'add-program-season-ep', 'programs-manager-edit', 'programs-detail-upload', 'trends-upload', 'large-video-upload');
  CREATE TYPE "pavillions"."enum_role_profiles_collection_permissions_operations" AS ENUM('read', 'create', 'update', 'delete');
  CREATE TYPE "pavillions"."enum_role_profiles_collection_permissions_collection" AS ENUM('users', 'roleProfiles', 'userGroups', 'media', 'videos', 'landing', 'trends', 'content', 'header', 'footer', 'languages', 'awards', 'programs', 'vipaPrograms', 'seasons', 'episodes');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_users" AS ENUM('email', 'role', 'roles', 'groups', 'ownedPrograms', 'ownedVipaPrograms', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_roleprofiles" AS ENUM('name', 'users', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_usergroups" AS ENUM('name', 'users', 'ownedPrograms', 'ownedVipaPrograms', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_media" AS ENUM('title', 'alt');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_videos" AS ENUM('title', 'alt');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_landing" AS ENUM('title', 'heroImage');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_trends" AS ENUM('type', 'title', 'link', 'image', 'boxHeight');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_content" AS ENUM('slug', 'titleTh', 'titleEn', 'topicSections', 'contentTh', 'contentEn');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_header" AS ENUM('titleTh', 'titleEn', 'items');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_footer" AS ENUM('titleTh', 'titleEn', 'items');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_languages" AS ENUM('code', 'label');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_awards" AS ENUM('name');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_programs" AS ENUM('programId', 'slug', 'titleTh', 'titleEn', 'programContentType', 'comingSoon', 'comingSoonDate', 'synopsisTh', 'synopsisEn', 'companyProduce', 'producer', 'artist', 'writer', 'targetGroup', 'programType', 'genre', 'subGenre', 'tags', 'comment', 'image', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink', 'is_IP', 'is_Feature', 'is_NEW', 'is_Schedule', 'isNewHits', 'is_Award', 'is_special_programs', 'is_old_series', 'is_global_programs', 'is_global_international', 'is_global_thai_dub', 'is_normal_programs', 'is_Detail', 'hasSoundtrack', 'hasAd', 'hasCc', 'hasSl', 'hasBigSign', 'isUncut', 'firstRun', 'rerunDates', 'space', 'format', 'duration', 'onThaipbs', 'onAltv', 'onVipa', 'onFacebook', 'onX', 'onYoutube', 'onTiktok', 'views', 'productionCountry', 'productionYear', 'rightsTerritoriesAvailable', 'audioChannel1', 'audioChannel2', 'closeCaption1', 'closeCaption2', 'closeCaption3', 'subtitle1', 'file_type', 'version', 'file_ext', 'is_infosheet_write', 'asset_create', 'asset_update', 'seasons');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_vipaprograms" AS ENUM('titleTh', 'titleEn', 'isNEW', 'isSchedule', 'isNewHits', 'is_special_programs', 'is_old_series', 'isFeature', 'is_IP', 'isThaiProgram', 'isInterProgram', 'image', 'coverImage', 'vipaLink', 'genre', 'tags', 'firstRun', 'rerunDates', 'duration', 'hasSoundtrack', 'hasAd', 'hasCc', 'hasSl', 'hasBigSign', 'isUncut', 'epCount', 'views');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_seasons" AS ENUM('program', 'season', 'seasonName', 'seasonNameEn', 'is_Award', 'awards', 'hasCc', 'languages', 'hasSoundtrack', 'languagesSoundtrack', 'comingSoon', 'comingSoonDate', 'synopsisTh', 'synopsisEn', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink', 'sellPricing', 'episodes');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_episodes" AS ENUM('season', 'ep', 'epNameTh', 'epNameEn', 'comingSoon', 'comingSoonDate', 'firstRun', 'rerunDates', 'synopsisEpTh', 'synopsisEpEn', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink');
  CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_collection" AS ENUM('users', 'roleProfiles', 'userGroups', 'media', 'videos', 'landing', 'trends', 'content', 'header', 'footer', 'languages', 'awards', 'programs', 'vipaPrograms', 'seasons', 'episodes');
  CREATE TYPE "pavillions"."enum_user_groups_allowed_admin_pages" AS ENUM('dashboard', 'season-sales', 'programs-manager', 'add-program-season-ep', 'programs-manager-edit', 'programs-detail-upload', 'trends-upload', 'large-video-upload');
  CREATE TYPE "pavillions"."enum_user_groups_collection_permissions_operations" AS ENUM('read', 'create', 'update', 'delete');
  CREATE TYPE "pavillions"."enum_user_groups_collection_permissions_collection" AS ENUM('users', 'roleProfiles', 'userGroups', 'media', 'videos', 'landing', 'trends', 'content', 'header', 'footer', 'languages', 'awards', 'programs', 'vipaPrograms', 'seasons', 'episodes');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_users" AS ENUM('email', 'role', 'roles', 'groups', 'ownedPrograms', 'ownedVipaPrograms', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_roleprofiles" AS ENUM('name', 'users', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_usergroups" AS ENUM('name', 'users', 'ownedPrograms', 'ownedVipaPrograms', 'allowedAdminPages', 'collectionPermissions', 'fieldPermissions');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_media" AS ENUM('title', 'alt');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_videos" AS ENUM('title', 'alt');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_landing" AS ENUM('title', 'heroImage');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_trends" AS ENUM('type', 'title', 'link', 'image', 'boxHeight');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_content" AS ENUM('slug', 'titleTh', 'titleEn', 'topicSections', 'contentTh', 'contentEn');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_header" AS ENUM('titleTh', 'titleEn', 'items');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_footer" AS ENUM('titleTh', 'titleEn', 'items');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_languages" AS ENUM('code', 'label');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_awards" AS ENUM('name');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_programs" AS ENUM('programId', 'slug', 'titleTh', 'titleEn', 'programContentType', 'comingSoon', 'comingSoonDate', 'synopsisTh', 'synopsisEn', 'companyProduce', 'producer', 'artist', 'writer', 'targetGroup', 'programType', 'genre', 'subGenre', 'tags', 'comment', 'image', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink', 'is_IP', 'is_Feature', 'is_NEW', 'is_Schedule', 'isNewHits', 'is_Award', 'is_special_programs', 'is_old_series', 'is_global_programs', 'is_global_international', 'is_global_thai_dub', 'is_normal_programs', 'is_Detail', 'hasSoundtrack', 'hasAd', 'hasCc', 'hasSl', 'hasBigSign', 'isUncut', 'firstRun', 'rerunDates', 'space', 'format', 'duration', 'onThaipbs', 'onAltv', 'onVipa', 'onFacebook', 'onX', 'onYoutube', 'onTiktok', 'views', 'productionCountry', 'productionYear', 'rightsTerritoriesAvailable', 'audioChannel1', 'audioChannel2', 'closeCaption1', 'closeCaption2', 'closeCaption3', 'subtitle1', 'file_type', 'version', 'file_ext', 'is_infosheet_write', 'asset_create', 'asset_update', 'seasons');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_vipaprograms" AS ENUM('titleTh', 'titleEn', 'isNEW', 'isSchedule', 'isNewHits', 'is_special_programs', 'is_old_series', 'isFeature', 'is_IP', 'isThaiProgram', 'isInterProgram', 'image', 'coverImage', 'vipaLink', 'genre', 'tags', 'firstRun', 'rerunDates', 'duration', 'hasSoundtrack', 'hasAd', 'hasCc', 'hasSl', 'hasBigSign', 'isUncut', 'epCount', 'views');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_seasons" AS ENUM('program', 'season', 'seasonName', 'seasonNameEn', 'is_Award', 'awards', 'hasCc', 'languages', 'hasSoundtrack', 'languagesSoundtrack', 'comingSoon', 'comingSoonDate', 'synopsisTh', 'synopsisEn', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink', 'sellPricing', 'episodes');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_episodes" AS ENUM('season', 'ep', 'epNameTh', 'epNameEn', 'comingSoon', 'comingSoonDate', 'firstRun', 'rerunDates', 'synopsisEpTh', 'synopsisEpEn', 'coverImage', 'trailer', 'video', 'TrailerAirflowProxyPath', 'TrailerThumbnailAirflowProxyPath', 'videoAirflowProxyPath', 'videoThumbnailAirflowProxyPath', 'videoLink', 'trailerLink');
  CREATE TYPE "pavillions"."enum_user_groups_field_permissions_collection" AS ENUM('users', 'roleProfiles', 'userGroups', 'media', 'videos', 'landing', 'trends', 'content', 'header', 'footer', 'languages', 'awards', 'programs', 'vipaPrograms', 'seasons', 'episodes');
  CREATE TYPE "pavillions"."enum_trends_type" AS ENUM('facebook', 'youtube', 'instagram', 'tiktok', 'x', 'others');
  CREATE TYPE "pavillions"."enum_header_items_item_type" AS ENUM('link', 'content');
  CREATE TYPE "pavillions"."enum_footer_items_item_type" AS ENUM('link', 'content');
  CREATE TYPE "pavillions"."enum_programs_program_content_type" AS ENUM('Series', 'Movie');
  CREATE TYPE "pavillions"."enum_programs_target_group" AS ENUM('อายุ 3-6 ปี', 'อายุ 7-12 ปี', 'อายุ 13-17 ปี', 'อายุ 18-24 ปี', 'อายุ 25-34 ปี', 'อายุ 35-44 ปี', 'อายุ 45-54 ปี', 'อายุ 55 ปีขึ้นไป');
  CREATE TYPE "pavillions"."enum_programs_type" AS ENUM('Short Clip', 'Trailer', 'PodCast', 'Spot', 'Filler', 'Demo', 'Program', 'Picture', 'Poster', 'Footage');
  CREATE TYPE "pavillions"."enum_programs_genre" AS ENUM('Drama&Sitcom', 'Variety&Lifestyle', 'Documentary', 'News&Facture', 'Music', 'Special Program', 'Food&Travel', 'Kids&Family', 'Animation');
  CREATE TYPE "pavillions"."enum_programs_genre_sub" AS ENUM('Agricultural&Local', 'Arts&Culture', 'Knowledge&Education', 'Entertainment', 'Lauguage', 'Inspiration&People', 'Nature&Environment', 'Biography', 'Pets&Animal', 'Travel&Adventure', 'Health&Medical&Wellness', 'Political', 'History', 'Crime', 'Science&Technology', 'Senior Program', 'News', 'Philosophy');
  CREATE TYPE "pavillions"."enum_programs_format" AS ENUM('', 'HD', 'UHD 4K');
  CREATE TYPE "pavillions"."enum_programs_audiochannel1_2" AS ENUM('', 'Full Mix_Thai', 'Full Mix_English', 'Full Mix_Japanese', 'Full Mix_Chinese', 'Music & Effect');
  CREATE TYPE "pavillions"."enum_programs_audiochannel3_4" AS ENUM('', 'Full Mix_Thai', 'Full Mix_English', 'Full Mix_Japanese', 'Full Mix_Chinese', 'Music & Effect');
  CREATE TYPE "pavillions"."enum_programs_close_caption1" AS ENUM('Thai', 'Eng', 'Myanmar', 'Chinese', 'Japan', '');
  CREATE TYPE "pavillions"."enum_programs_close_caption2" AS ENUM('Thai', 'Eng', 'Myanmar', 'Chinese', 'Japan', '');
  CREATE TYPE "pavillions"."enum_programs_close_caption3" AS ENUM('Thai', 'Eng', 'Myanmar', 'Chinese', 'Japan', '');
  CREATE TYPE "pavillions"."enum_programs_subtitle1" AS ENUM('Burn Thai-Sub Into Video', 'Burn Eng-Sub Into Video', 'Thai-Sub Sidecar File', 'Eng-Sub Sidecar File', 'Interviewer Local-Sub', '');
  CREATE TYPE "pavillions"."enum_vipa_programs_genre" AS ENUM('Drama&Sitcom', 'Variety&Lifestyle', 'Documentary', 'News&Facture', 'Music', 'Special Program', 'Food&Travel', 'Kids&Family', 'Animation');
  CREATE TYPE "pavillions"."enum_seasons_sell_pricing_format_prices_format" AS ENUM('HD', 'UHD 4K');
  CREATE TABLE "pavillions"."users_allowed_admin_pages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "pavillions"."enum_users_allowed_admin_pages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_collection_permissions_operations" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_collection_permissions_operations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_collection_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "pavillions"."enum_users_collection_permissions_collection" NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_users" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_users",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_roleprofiles" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_roleprofiles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_usergroups" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_usergroups",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_media" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_media",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_videos" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_videos",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_landing" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_landing",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_trends" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_trends",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_content" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_content",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_header" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_header",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_footer" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_footer",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_languages" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_languages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_awards" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_awards",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_programs" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_programs",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_vipaprograms" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_vipaprograms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions_fields_episodes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_users_field_permissions_fields_episodes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."users_field_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "pavillions"."enum_users_field_permissions_collection" NOT NULL,
  	"all_fields" boolean DEFAULT false
  );
  
  CREATE TABLE "pavillions"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "pavillions"."enum_users_role" DEFAULT 'user' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "pavillions"."users_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pavillions"."users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"role_profiles_id" integer,
  	"user_groups_id" integer,
  	"programs_id" integer,
  	"vipa_programs_id" integer,
  	"users_id" integer,
  	"media_id" integer,
  	"videos_id" integer,
  	"landing_id" integer,
  	"trends_id" integer,
  	"content_id" integer,
  	"header_id" integer,
  	"footer_id" integer,
  	"languages_id" integer,
  	"awards_id" integer,
  	"seasons_id" integer,
  	"episodes_id" integer
  );
  
  CREATE TABLE "pavillions"."role_profiles_allowed_admin_pages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "pavillions"."enum_role_profiles_allowed_admin_pages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_collection_permissions_operations" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_collection_permissions_operations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_collection_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "pavillions"."enum_role_profiles_collection_permissions_collection" NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_users" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_users",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_roleprofiles" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_roleprofiles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_usergroups" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_usergroups",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_media" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_media",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_videos" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_videos",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_landing" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_landing",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_trends" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_trends",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_content" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_content",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_header" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_header",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_footer" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_footer",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_languages" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_languages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_awards" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_awards",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_programs" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_programs",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_vipaprograms" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_vipaprograms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_episodes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_role_profiles_field_permissions_fields_episodes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_field_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "pavillions"."enum_role_profiles_field_permissions_collection" NOT NULL,
  	"all_fields" boolean DEFAULT false
  );
  
  CREATE TABLE "pavillions"."role_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."role_profiles_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pavillions"."role_profiles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"role_profiles_id" integer,
  	"user_groups_id" integer,
  	"media_id" integer,
  	"videos_id" integer,
  	"landing_id" integer,
  	"trends_id" integer,
  	"content_id" integer,
  	"header_id" integer,
  	"footer_id" integer,
  	"languages_id" integer,
  	"awards_id" integer,
  	"programs_id" integer,
  	"vipa_programs_id" integer,
  	"seasons_id" integer,
  	"episodes_id" integer
  );
  
  CREATE TABLE "pavillions"."user_groups_allowed_admin_pages" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "pavillions"."enum_user_groups_allowed_admin_pages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_collection_permissions_operations" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_collection_permissions_operations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_collection_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "pavillions"."enum_user_groups_collection_permissions_collection" NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_users" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_users",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_roleprofiles" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_roleprofiles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_usergroups" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_usergroups",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_media" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_media",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_videos" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_videos",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_landing" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_landing",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_trends" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_trends",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_content" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_content",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_header" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_header",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_footer" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_footer",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_languages" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_languages",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_awards" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_awards",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_programs" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_programs",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_vipaprograms" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_vipaprograms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions_fields_episodes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "pavillions"."enum_user_groups_field_permissions_fields_episodes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_field_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "pavillions"."enum_user_groups_field_permissions_collection" NOT NULL,
  	"all_fields" boolean DEFAULT false
  );
  
  CREATE TABLE "pavillions"."user_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."user_groups_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pavillions"."user_groups_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"programs_id" integer,
  	"vipa_programs_id" integer,
  	"role_profiles_id" integer,
  	"user_groups_id" integer,
  	"media_id" integer,
  	"videos_id" integer,
  	"landing_id" integer,
  	"trends_id" integer,
  	"content_id" integer,
  	"header_id" integer,
  	"footer_id" integer,
  	"languages_id" integer,
  	"awards_id" integer,
  	"seasons_id" integer,
  	"episodes_id" integer
  );
  
  CREATE TABLE "pavillions"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "pavillions"."videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "pavillions"."landing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Landing' NOT NULL,
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."trends" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "pavillions"."enum_trends_type" NOT NULL,
  	"title" varchar,
  	"link" varchar NOT NULL,
  	"image_id" integer,
  	"box_height" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."content_topic_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"topic_th" varchar,
  	"topic_en" varchar,
  	"content_th" varchar,
  	"content_en" varchar
  );
  
  CREATE TABLE "pavillions"."content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"title_th" varchar,
  	"title_en" varchar,
  	"content_th" jsonb,
  	"content_en" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."header_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_type" "pavillions"."enum_header_items_item_type" NOT NULL,
  	"link_url" varchar,
  	"link_label_th" varchar,
  	"link_label_en" varchar,
  	"content_id" integer
  );
  
  CREATE TABLE "pavillions"."header" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title_th" varchar,
  	"title_en" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."footer_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_type" "pavillions"."enum_footer_items_item_type" NOT NULL,
  	"link_url" varchar,
  	"link_label_th" varchar,
  	"link_label_en" varchar,
  	"content_id" integer
  );
  
  CREATE TABLE "pavillions"."footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title_th" varchar,
  	"title_en" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."languages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"label" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."awards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."programs_rerun_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "pavillions"."programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"program_id" varchar,
  	"slug" varchar NOT NULL,
  	"title_th" varchar,
  	"title_en" varchar,
  	"_displaytitle" varchar,
  	"program_content_type" "pavillions"."enum_programs_program_content_type",
  	"coming_soon" boolean,
  	"coming_soon_date" timestamp(3) with time zone,
  	"synopsis_th" varchar,
  	"synopsis_en" varchar,
  	"company_produce" varchar,
  	"producer" varchar,
  	"artist" varchar,
  	"writer" varchar,
  	"target_group" "pavillions"."enum_programs_target_group",
  	"type" "pavillions"."enum_programs_type",
  	"genre" "pavillions"."enum_programs_genre",
  	"genre_sub" "pavillions"."enum_programs_genre_sub",
  	"tags" varchar,
  	"comment" varchar,
  	"image_id" integer,
  	"cover_image_id" integer,
  	"trailer_id" integer,
  	"video_id" integer,
  	"trailer_airflow_proxy_path" varchar,
  	"trailer_thumbnail_airflow_proxy_path" varchar,
  	"video_airflow_proxy_path" varchar,
  	"video_thumbnail_airflow_proxy_path" varchar,
  	"video_link" varchar,
  	"trailer_link" varchar,
  	"is_ip" boolean,
  	"is_feature" boolean,
  	"is_new" boolean,
  	"is_schedule" boolean,
  	"is_new_hits" boolean,
  	"is_award" boolean,
  	"is_special_programs" boolean,
  	"is_old_series" boolean,
  	"is_global_programs" boolean,
  	"is_global_international" boolean,
  	"is_global_thai_dub" boolean,
  	"is_normal_programs" boolean DEFAULT true,
  	"is_detail" boolean,
  	"has_soundtrack" boolean,
  	"has_ad" boolean,
  	"has_cc" boolean,
  	"has_sl" boolean,
  	"has_big_sign" boolean,
  	"is_uncut" boolean,
  	"first_run" timestamp(3) with time zone,
  	"space" varchar,
  	"format" "pavillions"."enum_programs_format",
  	"duration" numeric,
  	"on_thaipbs" boolean,
  	"on_altv" boolean,
  	"on_vipa" boolean,
  	"on_facebook" boolean,
  	"on_x" boolean,
  	"on_youtube" boolean,
  	"on_tiktok" boolean,
  	"views" jsonb,
  	"production_country" varchar,
  	"production_year" numeric,
  	"rights_territories_available" varchar,
  	"audiochannel1_2" "pavillions"."enum_programs_audiochannel1_2",
  	"audiochannel3_4" "pavillions"."enum_programs_audiochannel3_4",
  	"close_caption1" "pavillions"."enum_programs_close_caption1",
  	"close_caption2" "pavillions"."enum_programs_close_caption2",
  	"close_caption3" "pavillions"."enum_programs_close_caption3",
  	"subtitle1" "pavillions"."enum_programs_subtitle1",
  	"file_type" varchar,
  	"version" numeric,
  	"file_ext" varchar,
  	"is_infosheet_write" boolean,
  	"asset_create" timestamp(3) with time zone,
  	"asset_update" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."programs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"seasons_id" integer
  );
  
  CREATE TABLE "pavillions"."vipa_programs_rerun_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "pavillions"."vipa_programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title_th" varchar,
  	"title_en" varchar,
  	"_displaytitle" varchar,
  	"is_n_e_w" boolean,
  	"is_schedule" boolean,
  	"is_new_hits" boolean,
  	"is_special_programs" boolean,
  	"is_old_series" boolean,
  	"is_feature" boolean,
  	"is_ip" boolean,
  	"is_thai_program" boolean,
  	"is_inter_program" boolean,
  	"image_id" integer,
  	"cover_image_id" integer,
  	"vipa_link" varchar,
  	"genre" "pavillions"."enum_vipa_programs_genre",
  	"tags" varchar,
  	"first_run" timestamp(3) with time zone,
  	"duration" numeric,
  	"has_soundtrack" boolean,
  	"has_ad" boolean,
  	"has_cc" boolean,
  	"has_sl" boolean,
  	"has_big_sign" boolean,
  	"is_uncut" boolean,
  	"ep_count" numeric,
  	"views" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."seasons_awards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"award_name_id" integer,
  	"award_year" numeric,
  	"award_detail" jsonb,
  	"award_updated_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "pavillions"."seasons_sell_pricing_format_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"format" "pavillions"."enum_seasons_sell_pricing_format_prices_format" NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "pavillions"."seasons_sell_pricing_cc_language_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language_id" integer,
  	"price" numeric
  );
  
  CREATE TABLE "pavillions"."seasons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"program_id" integer NOT NULL,
  	"season" numeric,
  	"season_name" varchar,
  	"season_name_en" varchar,
  	"is_award" boolean,
  	"has_cc" boolean DEFAULT false,
  	"has_soundtrack" boolean DEFAULT false,
  	"coming_soon" boolean,
  	"coming_soon_date" timestamp(3) with time zone,
  	"synopsis_th" varchar,
  	"synopsis_en" varchar,
  	"cover_image_id" integer,
  	"trailer_id" integer,
  	"video_id" integer,
  	"trailer_airflow_proxy_path" varchar,
  	"trailer_thumbnail_airflow_proxy_path" varchar,
  	"video_airflow_proxy_path" varchar,
  	"video_thumbnail_airflow_proxy_path" varchar,
  	"video_link" varchar,
  	"trailer_link" varchar,
  	"sell_pricing_ready_for_sale" boolean DEFAULT false,
  	"sell_pricing_has_cc" boolean DEFAULT false,
  	"sell_pricing_has_ad" boolean DEFAULT false,
  	"sell_pricing_ad_price" numeric,
  	"_displaytitle" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."seasons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"languages_id" integer,
  	"episodes_id" integer
  );
  
  CREATE TABLE "pavillions"."episodes_rerun_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "pavillions"."episodes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"season_id" integer NOT NULL,
  	"ep" numeric,
  	"ep_name_th" varchar,
  	"ep_name_en" varchar,
  	"coming_soon" boolean,
  	"coming_soon_date" timestamp(3) with time zone,
  	"first_run" timestamp(3) with time zone,
  	"synopsis_ep_th" varchar,
  	"synopsis_ep_en" varchar,
  	"cover_image_id" integer,
  	"trailer_id" integer,
  	"video_id" integer,
  	"trailer_airflow_proxy_path" varchar,
  	"trailer_thumbnail_airflow_proxy_path" varchar,
  	"video_airflow_proxy_path" varchar,
  	"video_thumbnail_airflow_proxy_path" varchar,
  	"video_link" varchar,
  	"trailer_link" varchar,
  	"_displaytitle" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "pavillions"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"role_profiles_id" integer,
  	"user_groups_id" integer,
  	"media_id" integer,
  	"videos_id" integer,
  	"landing_id" integer,
  	"trends_id" integer,
  	"content_id" integer,
  	"header_id" integer,
  	"footer_id" integer,
  	"languages_id" integer,
  	"awards_id" integer,
  	"programs_id" integer,
  	"vipa_programs_id" integer,
  	"seasons_id" integer,
  	"episodes_id" integer
  );
  
  CREATE TABLE "pavillions"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "pavillions"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pavillions"."users_allowed_admin_pages" ADD CONSTRAINT "users_allowed_admin_pages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_collection_permissions_operations" ADD CONSTRAINT "users_collection_permissions_operations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_collection_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_collection_permissions" ADD CONSTRAINT "users_collection_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_users" ADD CONSTRAINT "users_field_permissions_fields_users_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_roleprofiles" ADD CONSTRAINT "users_field_permissions_fields_roleprofiles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_usergroups" ADD CONSTRAINT "users_field_permissions_fields_usergroups_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_media" ADD CONSTRAINT "users_field_permissions_fields_media_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_videos" ADD CONSTRAINT "users_field_permissions_fields_videos_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_landing" ADD CONSTRAINT "users_field_permissions_fields_landing_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_trends" ADD CONSTRAINT "users_field_permissions_fields_trends_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_content" ADD CONSTRAINT "users_field_permissions_fields_content_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_header" ADD CONSTRAINT "users_field_permissions_fields_header_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_footer" ADD CONSTRAINT "users_field_permissions_fields_footer_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_languages" ADD CONSTRAINT "users_field_permissions_fields_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_awards" ADD CONSTRAINT "users_field_permissions_fields_awards_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_programs" ADD CONSTRAINT "users_field_permissions_fields_programs_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_vipaprograms" ADD CONSTRAINT "users_field_permissions_fields_vipaprograms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_seasons" ADD CONSTRAINT "users_field_permissions_fields_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions_fields_episodes" ADD CONSTRAINT "users_field_permissions_fields_episodes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_field_permissions" ADD CONSTRAINT "users_field_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_texts" ADD CONSTRAINT "users_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_role_profiles_fk" FOREIGN KEY ("role_profiles_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_user_groups_fk" FOREIGN KEY ("user_groups_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_vipa_programs_fk" FOREIGN KEY ("vipa_programs_id") REFERENCES "pavillions"."vipa_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "pavillions"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "pavillions"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_landing_fk" FOREIGN KEY ("landing_id") REFERENCES "pavillions"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_trends_fk" FOREIGN KEY ("trends_id") REFERENCES "pavillions"."trends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_content_fk" FOREIGN KEY ("content_id") REFERENCES "pavillions"."content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_header_fk" FOREIGN KEY ("header_id") REFERENCES "pavillions"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_footer_fk" FOREIGN KEY ("footer_id") REFERENCES "pavillions"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "pavillions"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "pavillions"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_episodes_fk" FOREIGN KEY ("episodes_id") REFERENCES "pavillions"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_allowed_admin_pages" ADD CONSTRAINT "role_profiles_allowed_admin_pages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_collection_permissions_operations" ADD CONSTRAINT "role_profiles_collection_permissions_operations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_collection_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_collection_permissions" ADD CONSTRAINT "role_profiles_collection_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_users" ADD CONSTRAINT "role_profiles_field_permissions_fields_users_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_roleprofiles" ADD CONSTRAINT "role_profiles_field_permissions_fields_roleprofiles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_usergroups" ADD CONSTRAINT "role_profiles_field_permissions_fields_usergroups_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_media" ADD CONSTRAINT "role_profiles_field_permissions_fields_media_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_videos" ADD CONSTRAINT "role_profiles_field_permissions_fields_videos_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_landing" ADD CONSTRAINT "role_profiles_field_permissions_fields_landing_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_trends" ADD CONSTRAINT "role_profiles_field_permissions_fields_trends_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_content" ADD CONSTRAINT "role_profiles_field_permissions_fields_content_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_header" ADD CONSTRAINT "role_profiles_field_permissions_fields_header_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_footer" ADD CONSTRAINT "role_profiles_field_permissions_fields_footer_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_languages" ADD CONSTRAINT "role_profiles_field_permissions_fields_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_awards" ADD CONSTRAINT "role_profiles_field_permissions_fields_awards_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_programs" ADD CONSTRAINT "role_profiles_field_permissions_fields_programs_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_vipaprograms" ADD CONSTRAINT "role_profiles_field_permissions_fields_vipaprograms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_seasons" ADD CONSTRAINT "role_profiles_field_permissions_fields_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_episodes" ADD CONSTRAINT "role_profiles_field_permissions_fields_episodes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_field_permissions" ADD CONSTRAINT "role_profiles_field_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_texts" ADD CONSTRAINT "role_profiles_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_role_profiles_fk" FOREIGN KEY ("role_profiles_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_user_groups_fk" FOREIGN KEY ("user_groups_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "pavillions"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "pavillions"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_landing_fk" FOREIGN KEY ("landing_id") REFERENCES "pavillions"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_trends_fk" FOREIGN KEY ("trends_id") REFERENCES "pavillions"."trends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_content_fk" FOREIGN KEY ("content_id") REFERENCES "pavillions"."content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_header_fk" FOREIGN KEY ("header_id") REFERENCES "pavillions"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_footer_fk" FOREIGN KEY ("footer_id") REFERENCES "pavillions"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "pavillions"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "pavillions"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_vipa_programs_fk" FOREIGN KEY ("vipa_programs_id") REFERENCES "pavillions"."vipa_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_episodes_fk" FOREIGN KEY ("episodes_id") REFERENCES "pavillions"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_allowed_admin_pages" ADD CONSTRAINT "user_groups_allowed_admin_pages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_collection_permissions_operations" ADD CONSTRAINT "user_groups_collection_permissions_operations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_collection_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_collection_permissions" ADD CONSTRAINT "user_groups_collection_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_users" ADD CONSTRAINT "user_groups_field_permissions_fields_users_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_roleprofiles" ADD CONSTRAINT "user_groups_field_permissions_fields_roleprofiles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_usergroups" ADD CONSTRAINT "user_groups_field_permissions_fields_usergroups_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_media" ADD CONSTRAINT "user_groups_field_permissions_fields_media_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_videos" ADD CONSTRAINT "user_groups_field_permissions_fields_videos_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_landing" ADD CONSTRAINT "user_groups_field_permissions_fields_landing_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_trends" ADD CONSTRAINT "user_groups_field_permissions_fields_trends_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_content" ADD CONSTRAINT "user_groups_field_permissions_fields_content_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_header" ADD CONSTRAINT "user_groups_field_permissions_fields_header_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_footer" ADD CONSTRAINT "user_groups_field_permissions_fields_footer_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_languages" ADD CONSTRAINT "user_groups_field_permissions_fields_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_awards" ADD CONSTRAINT "user_groups_field_permissions_fields_awards_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_programs" ADD CONSTRAINT "user_groups_field_permissions_fields_programs_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_vipaprograms" ADD CONSTRAINT "user_groups_field_permissions_fields_vipaprograms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_seasons" ADD CONSTRAINT "user_groups_field_permissions_fields_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions_fields_episodes" ADD CONSTRAINT "user_groups_field_permissions_fields_episodes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_field_permissions" ADD CONSTRAINT "user_groups_field_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_texts" ADD CONSTRAINT "user_groups_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_vipa_programs_fk" FOREIGN KEY ("vipa_programs_id") REFERENCES "pavillions"."vipa_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_role_profiles_fk" FOREIGN KEY ("role_profiles_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_user_groups_fk" FOREIGN KEY ("user_groups_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "pavillions"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "pavillions"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_landing_fk" FOREIGN KEY ("landing_id") REFERENCES "pavillions"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_trends_fk" FOREIGN KEY ("trends_id") REFERENCES "pavillions"."trends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_content_fk" FOREIGN KEY ("content_id") REFERENCES "pavillions"."content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_header_fk" FOREIGN KEY ("header_id") REFERENCES "pavillions"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_footer_fk" FOREIGN KEY ("footer_id") REFERENCES "pavillions"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "pavillions"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "pavillions"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_episodes_fk" FOREIGN KEY ("episodes_id") REFERENCES "pavillions"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."landing" ADD CONSTRAINT "landing_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."trends" ADD CONSTRAINT "trends_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."content_topic_sections" ADD CONSTRAINT "content_topic_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."header_items" ADD CONSTRAINT "header_items_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "pavillions"."content"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."header_items" ADD CONSTRAINT "header_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."footer_items" ADD CONSTRAINT "footer_items_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "pavillions"."content"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."footer_items" ADD CONSTRAINT "footer_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."programs_rerun_dates" ADD CONSTRAINT "programs_rerun_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."programs" ADD CONSTRAINT "programs_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."programs" ADD CONSTRAINT "programs_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."programs" ADD CONSTRAINT "programs_trailer_id_videos_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."programs" ADD CONSTRAINT "programs_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."vipa_programs_rerun_dates" ADD CONSTRAINT "vipa_programs_rerun_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."vipa_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."vipa_programs" ADD CONSTRAINT "vipa_programs_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."vipa_programs" ADD CONSTRAINT "vipa_programs_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_awards" ADD CONSTRAINT "seasons_awards_award_name_id_awards_id_fk" FOREIGN KEY ("award_name_id") REFERENCES "pavillions"."awards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_awards" ADD CONSTRAINT "seasons_awards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_sell_pricing_format_prices" ADD CONSTRAINT "seasons_sell_pricing_format_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_sell_pricing_cc_language_prices" ADD CONSTRAINT "seasons_sell_pricing_cc_language_prices_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "pavillions"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_sell_pricing_cc_language_prices" ADD CONSTRAINT "seasons_sell_pricing_cc_language_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons" ADD CONSTRAINT "seasons_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "pavillions"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons" ADD CONSTRAINT "seasons_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons" ADD CONSTRAINT "seasons_trailer_id_videos_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons" ADD CONSTRAINT "seasons_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_rels" ADD CONSTRAINT "seasons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_rels" ADD CONSTRAINT "seasons_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "pavillions"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."seasons_rels" ADD CONSTRAINT "seasons_rels_episodes_fk" FOREIGN KEY ("episodes_id") REFERENCES "pavillions"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."episodes_rerun_dates" ADD CONSTRAINT "episodes_rerun_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."episodes" ADD CONSTRAINT "episodes_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "pavillions"."seasons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."episodes" ADD CONSTRAINT "episodes_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."episodes" ADD CONSTRAINT "episodes_trailer_id_videos_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."episodes" ADD CONSTRAINT "episodes_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_role_profiles_fk" FOREIGN KEY ("role_profiles_id") REFERENCES "pavillions"."role_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_groups_fk" FOREIGN KEY ("user_groups_id") REFERENCES "pavillions"."user_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "pavillions"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "pavillions"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landing_fk" FOREIGN KEY ("landing_id") REFERENCES "pavillions"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trends_fk" FOREIGN KEY ("trends_id") REFERENCES "pavillions"."trends"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_fk" FOREIGN KEY ("content_id") REFERENCES "pavillions"."content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_header_fk" FOREIGN KEY ("header_id") REFERENCES "pavillions"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_footer_fk" FOREIGN KEY ("footer_id") REFERENCES "pavillions"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "pavillions"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "pavillions"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vipa_programs_fk" FOREIGN KEY ("vipa_programs_id") REFERENCES "pavillions"."vipa_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seasons_fk" FOREIGN KEY ("seasons_id") REFERENCES "pavillions"."seasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_episodes_fk" FOREIGN KEY ("episodes_id") REFERENCES "pavillions"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "pavillions"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_allowed_admin_pages_order_idx" ON "pavillions"."users_allowed_admin_pages" USING btree ("order");
  CREATE INDEX "users_allowed_admin_pages_parent_idx" ON "pavillions"."users_allowed_admin_pages" USING btree ("parent_id");
  CREATE INDEX "users_collection_permissions_operations_order_idx" ON "pavillions"."users_collection_permissions_operations" USING btree ("order");
  CREATE INDEX "users_collection_permissions_operations_parent_idx" ON "pavillions"."users_collection_permissions_operations" USING btree ("parent_id");
  CREATE INDEX "users_collection_permissions_order_idx" ON "pavillions"."users_collection_permissions" USING btree ("_order");
  CREATE INDEX "users_collection_permissions_parent_id_idx" ON "pavillions"."users_collection_permissions" USING btree ("_parent_id");
  CREATE INDEX "users_field_permissions_fields_users_order_idx" ON "pavillions"."users_field_permissions_fields_users" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_users_parent_idx" ON "pavillions"."users_field_permissions_fields_users" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_roleprofiles_order_idx" ON "pavillions"."users_field_permissions_fields_roleprofiles" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_roleprofiles_parent_idx" ON "pavillions"."users_field_permissions_fields_roleprofiles" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_usergroups_order_idx" ON "pavillions"."users_field_permissions_fields_usergroups" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_usergroups_parent_idx" ON "pavillions"."users_field_permissions_fields_usergroups" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_media_order_idx" ON "pavillions"."users_field_permissions_fields_media" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_media_parent_idx" ON "pavillions"."users_field_permissions_fields_media" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_videos_order_idx" ON "pavillions"."users_field_permissions_fields_videos" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_videos_parent_idx" ON "pavillions"."users_field_permissions_fields_videos" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_landing_order_idx" ON "pavillions"."users_field_permissions_fields_landing" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_landing_parent_idx" ON "pavillions"."users_field_permissions_fields_landing" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_trends_order_idx" ON "pavillions"."users_field_permissions_fields_trends" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_trends_parent_idx" ON "pavillions"."users_field_permissions_fields_trends" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_content_order_idx" ON "pavillions"."users_field_permissions_fields_content" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_content_parent_idx" ON "pavillions"."users_field_permissions_fields_content" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_header_order_idx" ON "pavillions"."users_field_permissions_fields_header" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_header_parent_idx" ON "pavillions"."users_field_permissions_fields_header" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_footer_order_idx" ON "pavillions"."users_field_permissions_fields_footer" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_footer_parent_idx" ON "pavillions"."users_field_permissions_fields_footer" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_languages_order_idx" ON "pavillions"."users_field_permissions_fields_languages" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_languages_parent_idx" ON "pavillions"."users_field_permissions_fields_languages" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_awards_order_idx" ON "pavillions"."users_field_permissions_fields_awards" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_awards_parent_idx" ON "pavillions"."users_field_permissions_fields_awards" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_programs_order_idx" ON "pavillions"."users_field_permissions_fields_programs" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_programs_parent_idx" ON "pavillions"."users_field_permissions_fields_programs" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_vipaprograms_order_idx" ON "pavillions"."users_field_permissions_fields_vipaprograms" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_vipaprograms_parent_idx" ON "pavillions"."users_field_permissions_fields_vipaprograms" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_seasons_order_idx" ON "pavillions"."users_field_permissions_fields_seasons" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_seasons_parent_idx" ON "pavillions"."users_field_permissions_fields_seasons" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_fields_episodes_order_idx" ON "pavillions"."users_field_permissions_fields_episodes" USING btree ("order");
  CREATE INDEX "users_field_permissions_fields_episodes_parent_idx" ON "pavillions"."users_field_permissions_fields_episodes" USING btree ("parent_id");
  CREATE INDEX "users_field_permissions_order_idx" ON "pavillions"."users_field_permissions" USING btree ("_order");
  CREATE INDEX "users_field_permissions_parent_id_idx" ON "pavillions"."users_field_permissions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "pavillions"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "pavillions"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "pavillions"."users" USING btree ("email");
  CREATE INDEX "users_texts_order_parent" ON "pavillions"."users_texts" USING btree ("order","parent_id");
  CREATE INDEX "users_rels_order_idx" ON "pavillions"."users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "pavillions"."users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "pavillions"."users_rels" USING btree ("path");
  CREATE INDEX "users_rels_role_profiles_id_idx" ON "pavillions"."users_rels" USING btree ("role_profiles_id");
  CREATE INDEX "users_rels_user_groups_id_idx" ON "pavillions"."users_rels" USING btree ("user_groups_id");
  CREATE INDEX "users_rels_programs_id_idx" ON "pavillions"."users_rels" USING btree ("programs_id");
  CREATE INDEX "users_rels_vipa_programs_id_idx" ON "pavillions"."users_rels" USING btree ("vipa_programs_id");
  CREATE INDEX "users_rels_users_id_idx" ON "pavillions"."users_rels" USING btree ("users_id");
  CREATE INDEX "users_rels_media_id_idx" ON "pavillions"."users_rels" USING btree ("media_id");
  CREATE INDEX "users_rels_videos_id_idx" ON "pavillions"."users_rels" USING btree ("videos_id");
  CREATE INDEX "users_rels_landing_id_idx" ON "pavillions"."users_rels" USING btree ("landing_id");
  CREATE INDEX "users_rels_trends_id_idx" ON "pavillions"."users_rels" USING btree ("trends_id");
  CREATE INDEX "users_rels_content_id_idx" ON "pavillions"."users_rels" USING btree ("content_id");
  CREATE INDEX "users_rels_header_id_idx" ON "pavillions"."users_rels" USING btree ("header_id");
  CREATE INDEX "users_rels_footer_id_idx" ON "pavillions"."users_rels" USING btree ("footer_id");
  CREATE INDEX "users_rels_languages_id_idx" ON "pavillions"."users_rels" USING btree ("languages_id");
  CREATE INDEX "users_rels_awards_id_idx" ON "pavillions"."users_rels" USING btree ("awards_id");
  CREATE INDEX "users_rels_seasons_id_idx" ON "pavillions"."users_rels" USING btree ("seasons_id");
  CREATE INDEX "users_rels_episodes_id_idx" ON "pavillions"."users_rels" USING btree ("episodes_id");
  CREATE INDEX "role_profiles_allowed_admin_pages_order_idx" ON "pavillions"."role_profiles_allowed_admin_pages" USING btree ("order");
  CREATE INDEX "role_profiles_allowed_admin_pages_parent_idx" ON "pavillions"."role_profiles_allowed_admin_pages" USING btree ("parent_id");
  CREATE INDEX "role_profiles_collection_permissions_operations_order_idx" ON "pavillions"."role_profiles_collection_permissions_operations" USING btree ("order");
  CREATE INDEX "role_profiles_collection_permissions_operations_parent_idx" ON "pavillions"."role_profiles_collection_permissions_operations" USING btree ("parent_id");
  CREATE INDEX "role_profiles_collection_permissions_order_idx" ON "pavillions"."role_profiles_collection_permissions" USING btree ("_order");
  CREATE INDEX "role_profiles_collection_permissions_parent_id_idx" ON "pavillions"."role_profiles_collection_permissions" USING btree ("_parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_users_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_users" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_users_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_users" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_roleprofiles_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_roleprofiles" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_roleprofiles_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_roleprofiles" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_usergroups_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_usergroups" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_usergroups_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_usergroups" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_media_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_media" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_media_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_media" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_videos_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_videos" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_videos_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_videos" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_landing_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_landing" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_landing_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_landing" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_trends_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_trends" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_trends_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_trends" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_content_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_content" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_content_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_content" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_header_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_header" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_header_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_header" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_footer_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_footer" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_footer_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_footer" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_languages_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_languages" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_languages_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_languages" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_awards_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_awards" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_awards_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_awards" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_programs_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_programs" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_programs_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_programs" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_vipaprograms_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_vipaprograms" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_vipaprograms_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_vipaprograms" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_seasons_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_seasons" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_seasons_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_seasons" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_fields_episodes_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_episodes" USING btree ("order");
  CREATE INDEX "role_profiles_field_permissions_fields_episodes_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_episodes" USING btree ("parent_id");
  CREATE INDEX "role_profiles_field_permissions_order_idx" ON "pavillions"."role_profiles_field_permissions" USING btree ("_order");
  CREATE INDEX "role_profiles_field_permissions_parent_id_idx" ON "pavillions"."role_profiles_field_permissions" USING btree ("_parent_id");
  CREATE INDEX "role_profiles_updated_at_idx" ON "pavillions"."role_profiles" USING btree ("updated_at");
  CREATE INDEX "role_profiles_created_at_idx" ON "pavillions"."role_profiles" USING btree ("created_at");
  CREATE INDEX "role_profiles_texts_order_parent" ON "pavillions"."role_profiles_texts" USING btree ("order","parent_id");
  CREATE INDEX "role_profiles_rels_order_idx" ON "pavillions"."role_profiles_rels" USING btree ("order");
  CREATE INDEX "role_profiles_rels_parent_idx" ON "pavillions"."role_profiles_rels" USING btree ("parent_id");
  CREATE INDEX "role_profiles_rels_path_idx" ON "pavillions"."role_profiles_rels" USING btree ("path");
  CREATE INDEX "role_profiles_rels_users_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("users_id");
  CREATE INDEX "role_profiles_rels_role_profiles_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("role_profiles_id");
  CREATE INDEX "role_profiles_rels_user_groups_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("user_groups_id");
  CREATE INDEX "role_profiles_rels_media_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("media_id");
  CREATE INDEX "role_profiles_rels_videos_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("videos_id");
  CREATE INDEX "role_profiles_rels_landing_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("landing_id");
  CREATE INDEX "role_profiles_rels_trends_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("trends_id");
  CREATE INDEX "role_profiles_rels_content_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("content_id");
  CREATE INDEX "role_profiles_rels_header_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("header_id");
  CREATE INDEX "role_profiles_rels_footer_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("footer_id");
  CREATE INDEX "role_profiles_rels_languages_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("languages_id");
  CREATE INDEX "role_profiles_rels_awards_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("awards_id");
  CREATE INDEX "role_profiles_rels_programs_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("programs_id");
  CREATE INDEX "role_profiles_rels_vipa_programs_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("vipa_programs_id");
  CREATE INDEX "role_profiles_rels_seasons_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("seasons_id");
  CREATE INDEX "role_profiles_rels_episodes_id_idx" ON "pavillions"."role_profiles_rels" USING btree ("episodes_id");
  CREATE INDEX "user_groups_allowed_admin_pages_order_idx" ON "pavillions"."user_groups_allowed_admin_pages" USING btree ("order");
  CREATE INDEX "user_groups_allowed_admin_pages_parent_idx" ON "pavillions"."user_groups_allowed_admin_pages" USING btree ("parent_id");
  CREATE INDEX "user_groups_collection_permissions_operations_order_idx" ON "pavillions"."user_groups_collection_permissions_operations" USING btree ("order");
  CREATE INDEX "user_groups_collection_permissions_operations_parent_idx" ON "pavillions"."user_groups_collection_permissions_operations" USING btree ("parent_id");
  CREATE INDEX "user_groups_collection_permissions_order_idx" ON "pavillions"."user_groups_collection_permissions" USING btree ("_order");
  CREATE INDEX "user_groups_collection_permissions_parent_id_idx" ON "pavillions"."user_groups_collection_permissions" USING btree ("_parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_users_order_idx" ON "pavillions"."user_groups_field_permissions_fields_users" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_users_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_users" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_roleprofiles_order_idx" ON "pavillions"."user_groups_field_permissions_fields_roleprofiles" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_roleprofiles_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_roleprofiles" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_usergroups_order_idx" ON "pavillions"."user_groups_field_permissions_fields_usergroups" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_usergroups_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_usergroups" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_media_order_idx" ON "pavillions"."user_groups_field_permissions_fields_media" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_media_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_media" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_videos_order_idx" ON "pavillions"."user_groups_field_permissions_fields_videos" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_videos_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_videos" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_landing_order_idx" ON "pavillions"."user_groups_field_permissions_fields_landing" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_landing_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_landing" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_trends_order_idx" ON "pavillions"."user_groups_field_permissions_fields_trends" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_trends_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_trends" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_content_order_idx" ON "pavillions"."user_groups_field_permissions_fields_content" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_content_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_content" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_header_order_idx" ON "pavillions"."user_groups_field_permissions_fields_header" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_header_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_header" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_footer_order_idx" ON "pavillions"."user_groups_field_permissions_fields_footer" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_footer_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_footer" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_languages_order_idx" ON "pavillions"."user_groups_field_permissions_fields_languages" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_languages_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_languages" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_awards_order_idx" ON "pavillions"."user_groups_field_permissions_fields_awards" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_awards_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_awards" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_programs_order_idx" ON "pavillions"."user_groups_field_permissions_fields_programs" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_programs_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_programs" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_vipaprograms_order_idx" ON "pavillions"."user_groups_field_permissions_fields_vipaprograms" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_vipaprograms_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_vipaprograms" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_seasons_order_idx" ON "pavillions"."user_groups_field_permissions_fields_seasons" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_seasons_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_seasons" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_fields_episodes_order_idx" ON "pavillions"."user_groups_field_permissions_fields_episodes" USING btree ("order");
  CREATE INDEX "user_groups_field_permissions_fields_episodes_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_episodes" USING btree ("parent_id");
  CREATE INDEX "user_groups_field_permissions_order_idx" ON "pavillions"."user_groups_field_permissions" USING btree ("_order");
  CREATE INDEX "user_groups_field_permissions_parent_id_idx" ON "pavillions"."user_groups_field_permissions" USING btree ("_parent_id");
  CREATE INDEX "user_groups_updated_at_idx" ON "pavillions"."user_groups" USING btree ("updated_at");
  CREATE INDEX "user_groups_created_at_idx" ON "pavillions"."user_groups" USING btree ("created_at");
  CREATE INDEX "user_groups_texts_order_parent" ON "pavillions"."user_groups_texts" USING btree ("order","parent_id");
  CREATE INDEX "user_groups_rels_order_idx" ON "pavillions"."user_groups_rels" USING btree ("order");
  CREATE INDEX "user_groups_rels_parent_idx" ON "pavillions"."user_groups_rels" USING btree ("parent_id");
  CREATE INDEX "user_groups_rels_path_idx" ON "pavillions"."user_groups_rels" USING btree ("path");
  CREATE INDEX "user_groups_rels_users_id_idx" ON "pavillions"."user_groups_rels" USING btree ("users_id");
  CREATE INDEX "user_groups_rels_programs_id_idx" ON "pavillions"."user_groups_rels" USING btree ("programs_id");
  CREATE INDEX "user_groups_rels_vipa_programs_id_idx" ON "pavillions"."user_groups_rels" USING btree ("vipa_programs_id");
  CREATE INDEX "user_groups_rels_role_profiles_id_idx" ON "pavillions"."user_groups_rels" USING btree ("role_profiles_id");
  CREATE INDEX "user_groups_rels_user_groups_id_idx" ON "pavillions"."user_groups_rels" USING btree ("user_groups_id");
  CREATE INDEX "user_groups_rels_media_id_idx" ON "pavillions"."user_groups_rels" USING btree ("media_id");
  CREATE INDEX "user_groups_rels_videos_id_idx" ON "pavillions"."user_groups_rels" USING btree ("videos_id");
  CREATE INDEX "user_groups_rels_landing_id_idx" ON "pavillions"."user_groups_rels" USING btree ("landing_id");
  CREATE INDEX "user_groups_rels_trends_id_idx" ON "pavillions"."user_groups_rels" USING btree ("trends_id");
  CREATE INDEX "user_groups_rels_content_id_idx" ON "pavillions"."user_groups_rels" USING btree ("content_id");
  CREATE INDEX "user_groups_rels_header_id_idx" ON "pavillions"."user_groups_rels" USING btree ("header_id");
  CREATE INDEX "user_groups_rels_footer_id_idx" ON "pavillions"."user_groups_rels" USING btree ("footer_id");
  CREATE INDEX "user_groups_rels_languages_id_idx" ON "pavillions"."user_groups_rels" USING btree ("languages_id");
  CREATE INDEX "user_groups_rels_awards_id_idx" ON "pavillions"."user_groups_rels" USING btree ("awards_id");
  CREATE INDEX "user_groups_rels_seasons_id_idx" ON "pavillions"."user_groups_rels" USING btree ("seasons_id");
  CREATE INDEX "user_groups_rels_episodes_id_idx" ON "pavillions"."user_groups_rels" USING btree ("episodes_id");
  CREATE INDEX "media_updated_at_idx" ON "pavillions"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "pavillions"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "pavillions"."media" USING btree ("filename");
  CREATE INDEX "videos_updated_at_idx" ON "pavillions"."videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "pavillions"."videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "videos_filename_idx" ON "pavillions"."videos" USING btree ("filename");
  CREATE INDEX "landing_hero_image_idx" ON "pavillions"."landing" USING btree ("hero_image_id");
  CREATE INDEX "landing_updated_at_idx" ON "pavillions"."landing" USING btree ("updated_at");
  CREATE INDEX "landing_created_at_idx" ON "pavillions"."landing" USING btree ("created_at");
  CREATE INDEX "trends_image_idx" ON "pavillions"."trends" USING btree ("image_id");
  CREATE INDEX "trends_updated_at_idx" ON "pavillions"."trends" USING btree ("updated_at");
  CREATE INDEX "trends_created_at_idx" ON "pavillions"."trends" USING btree ("created_at");
  CREATE INDEX "content_topic_sections_order_idx" ON "pavillions"."content_topic_sections" USING btree ("_order");
  CREATE INDEX "content_topic_sections_parent_id_idx" ON "pavillions"."content_topic_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "content_slug_idx" ON "pavillions"."content" USING btree ("slug");
  CREATE INDEX "content_updated_at_idx" ON "pavillions"."content" USING btree ("updated_at");
  CREATE INDEX "content_created_at_idx" ON "pavillions"."content" USING btree ("created_at");
  CREATE INDEX "header_items_order_idx" ON "pavillions"."header_items" USING btree ("_order");
  CREATE INDEX "header_items_parent_id_idx" ON "pavillions"."header_items" USING btree ("_parent_id");
  CREATE INDEX "header_items_content_idx" ON "pavillions"."header_items" USING btree ("content_id");
  CREATE INDEX "header_updated_at_idx" ON "pavillions"."header" USING btree ("updated_at");
  CREATE INDEX "header_created_at_idx" ON "pavillions"."header" USING btree ("created_at");
  CREATE INDEX "footer_items_order_idx" ON "pavillions"."footer_items" USING btree ("_order");
  CREATE INDEX "footer_items_parent_id_idx" ON "pavillions"."footer_items" USING btree ("_parent_id");
  CREATE INDEX "footer_items_content_idx" ON "pavillions"."footer_items" USING btree ("content_id");
  CREATE INDEX "footer_updated_at_idx" ON "pavillions"."footer" USING btree ("updated_at");
  CREATE INDEX "footer_created_at_idx" ON "pavillions"."footer" USING btree ("created_at");
  CREATE UNIQUE INDEX "languages_code_idx" ON "pavillions"."languages" USING btree ("code");
  CREATE INDEX "languages_updated_at_idx" ON "pavillions"."languages" USING btree ("updated_at");
  CREATE INDEX "languages_created_at_idx" ON "pavillions"."languages" USING btree ("created_at");
  CREATE UNIQUE INDEX "awards_name_idx" ON "pavillions"."awards" USING btree ("name");
  CREATE INDEX "awards_updated_at_idx" ON "pavillions"."awards" USING btree ("updated_at");
  CREATE INDEX "awards_created_at_idx" ON "pavillions"."awards" USING btree ("created_at");
  CREATE INDEX "programs_rerun_dates_order_idx" ON "pavillions"."programs_rerun_dates" USING btree ("_order");
  CREATE INDEX "programs_rerun_dates_parent_id_idx" ON "pavillions"."programs_rerun_dates" USING btree ("_parent_id");
  CREATE INDEX "programs_image_idx" ON "pavillions"."programs" USING btree ("image_id");
  CREATE INDEX "programs_cover_image_idx" ON "pavillions"."programs" USING btree ("cover_image_id");
  CREATE INDEX "programs_trailer_idx" ON "pavillions"."programs" USING btree ("trailer_id");
  CREATE INDEX "programs_video_idx" ON "pavillions"."programs" USING btree ("video_id");
  CREATE INDEX "programs_updated_at_idx" ON "pavillions"."programs" USING btree ("updated_at");
  CREATE INDEX "programs_created_at_idx" ON "pavillions"."programs" USING btree ("created_at");
  CREATE INDEX "programs_rels_order_idx" ON "pavillions"."programs_rels" USING btree ("order");
  CREATE INDEX "programs_rels_parent_idx" ON "pavillions"."programs_rels" USING btree ("parent_id");
  CREATE INDEX "programs_rels_path_idx" ON "pavillions"."programs_rels" USING btree ("path");
  CREATE INDEX "programs_rels_seasons_id_idx" ON "pavillions"."programs_rels" USING btree ("seasons_id");
  CREATE INDEX "vipa_programs_rerun_dates_order_idx" ON "pavillions"."vipa_programs_rerun_dates" USING btree ("_order");
  CREATE INDEX "vipa_programs_rerun_dates_parent_id_idx" ON "pavillions"."vipa_programs_rerun_dates" USING btree ("_parent_id");
  CREATE INDEX "vipa_programs_image_idx" ON "pavillions"."vipa_programs" USING btree ("image_id");
  CREATE INDEX "vipa_programs_cover_image_idx" ON "pavillions"."vipa_programs" USING btree ("cover_image_id");
  CREATE INDEX "vipa_programs_updated_at_idx" ON "pavillions"."vipa_programs" USING btree ("updated_at");
  CREATE INDEX "vipa_programs_created_at_idx" ON "pavillions"."vipa_programs" USING btree ("created_at");
  CREATE INDEX "seasons_awards_order_idx" ON "pavillions"."seasons_awards" USING btree ("_order");
  CREATE INDEX "seasons_awards_parent_id_idx" ON "pavillions"."seasons_awards" USING btree ("_parent_id");
  CREATE INDEX "seasons_awards_award_name_idx" ON "pavillions"."seasons_awards" USING btree ("award_name_id");
  CREATE INDEX "seasons_sell_pricing_format_prices_order_idx" ON "pavillions"."seasons_sell_pricing_format_prices" USING btree ("_order");
  CREATE INDEX "seasons_sell_pricing_format_prices_parent_id_idx" ON "pavillions"."seasons_sell_pricing_format_prices" USING btree ("_parent_id");
  CREATE INDEX "seasons_sell_pricing_cc_language_prices_order_idx" ON "pavillions"."seasons_sell_pricing_cc_language_prices" USING btree ("_order");
  CREATE INDEX "seasons_sell_pricing_cc_language_prices_parent_id_idx" ON "pavillions"."seasons_sell_pricing_cc_language_prices" USING btree ("_parent_id");
  CREATE INDEX "seasons_sell_pricing_cc_language_prices_language_idx" ON "pavillions"."seasons_sell_pricing_cc_language_prices" USING btree ("language_id");
  CREATE INDEX "seasons_program_idx" ON "pavillions"."seasons" USING btree ("program_id");
  CREATE INDEX "seasons_cover_image_idx" ON "pavillions"."seasons" USING btree ("cover_image_id");
  CREATE INDEX "seasons_trailer_idx" ON "pavillions"."seasons" USING btree ("trailer_id");
  CREATE INDEX "seasons_video_idx" ON "pavillions"."seasons" USING btree ("video_id");
  CREATE INDEX "seasons_updated_at_idx" ON "pavillions"."seasons" USING btree ("updated_at");
  CREATE INDEX "seasons_created_at_idx" ON "pavillions"."seasons" USING btree ("created_at");
  CREATE INDEX "seasons_rels_order_idx" ON "pavillions"."seasons_rels" USING btree ("order");
  CREATE INDEX "seasons_rels_parent_idx" ON "pavillions"."seasons_rels" USING btree ("parent_id");
  CREATE INDEX "seasons_rels_path_idx" ON "pavillions"."seasons_rels" USING btree ("path");
  CREATE INDEX "seasons_rels_languages_id_idx" ON "pavillions"."seasons_rels" USING btree ("languages_id");
  CREATE INDEX "seasons_rels_episodes_id_idx" ON "pavillions"."seasons_rels" USING btree ("episodes_id");
  CREATE INDEX "episodes_rerun_dates_order_idx" ON "pavillions"."episodes_rerun_dates" USING btree ("_order");
  CREATE INDEX "episodes_rerun_dates_parent_id_idx" ON "pavillions"."episodes_rerun_dates" USING btree ("_parent_id");
  CREATE INDEX "episodes_season_idx" ON "pavillions"."episodes" USING btree ("season_id");
  CREATE INDEX "episodes_cover_image_idx" ON "pavillions"."episodes" USING btree ("cover_image_id");
  CREATE INDEX "episodes_trailer_idx" ON "pavillions"."episodes" USING btree ("trailer_id");
  CREATE INDEX "episodes_video_idx" ON "pavillions"."episodes" USING btree ("video_id");
  CREATE INDEX "episodes_updated_at_idx" ON "pavillions"."episodes" USING btree ("updated_at");
  CREATE INDEX "episodes_created_at_idx" ON "pavillions"."episodes" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "pavillions"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "pavillions"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "pavillions"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "pavillions"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_role_profiles_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("role_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_user_groups_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("user_groups_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_landing_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("landing_id");
  CREATE INDEX "payload_locked_documents_rels_trends_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("trends_id");
  CREATE INDEX "payload_locked_documents_rels_content_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("content_id");
  CREATE INDEX "payload_locked_documents_rels_header_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("header_id");
  CREATE INDEX "payload_locked_documents_rels_footer_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("footer_id");
  CREATE INDEX "payload_locked_documents_rels_languages_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("languages_id");
  CREATE INDEX "payload_locked_documents_rels_awards_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("awards_id");
  CREATE INDEX "payload_locked_documents_rels_programs_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("programs_id");
  CREATE INDEX "payload_locked_documents_rels_vipa_programs_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("vipa_programs_id");
  CREATE INDEX "payload_locked_documents_rels_seasons_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("seasons_id");
  CREATE INDEX "payload_locked_documents_rels_episodes_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("episodes_id");
  CREATE INDEX "payload_preferences_key_idx" ON "pavillions"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "pavillions"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "pavillions"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "pavillions"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "pavillions"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "pavillions"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "pavillions"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "pavillions"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "pavillions"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  if (process.env.PAYLOAD_DB_SCHEMA !== 'pavillions') {
    return
  }

  await db.execute(sql`
   DROP TABLE "pavillions"."users_allowed_admin_pages" CASCADE;
  DROP TABLE "pavillions"."users_collection_permissions_operations" CASCADE;
  DROP TABLE "pavillions"."users_collection_permissions" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_users" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_roleprofiles" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_usergroups" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_media" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_videos" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_landing" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_trends" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_content" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_header" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_footer" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_languages" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_awards" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_programs" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_vipaprograms" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_seasons" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions_fields_episodes" CASCADE;
  DROP TABLE "pavillions"."users_field_permissions" CASCADE;
  DROP TABLE "pavillions"."users" CASCADE;
  DROP TABLE "pavillions"."users_texts" CASCADE;
  DROP TABLE "pavillions"."users_rels" CASCADE;
  DROP TABLE "pavillions"."role_profiles_allowed_admin_pages" CASCADE;
  DROP TABLE "pavillions"."role_profiles_collection_permissions_operations" CASCADE;
  DROP TABLE "pavillions"."role_profiles_collection_permissions" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_users" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_roleprofiles" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_usergroups" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_media" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_videos" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_landing" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_trends" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_content" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_header" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_footer" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_languages" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_awards" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_programs" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_vipaprograms" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_seasons" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions_fields_episodes" CASCADE;
  DROP TABLE "pavillions"."role_profiles_field_permissions" CASCADE;
  DROP TABLE "pavillions"."role_profiles" CASCADE;
  DROP TABLE "pavillions"."role_profiles_texts" CASCADE;
  DROP TABLE "pavillions"."role_profiles_rels" CASCADE;
  DROP TABLE "pavillions"."user_groups_allowed_admin_pages" CASCADE;
  DROP TABLE "pavillions"."user_groups_collection_permissions_operations" CASCADE;
  DROP TABLE "pavillions"."user_groups_collection_permissions" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_users" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_roleprofiles" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_usergroups" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_media" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_videos" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_landing" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_trends" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_content" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_header" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_footer" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_languages" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_awards" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_programs" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_vipaprograms" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_seasons" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions_fields_episodes" CASCADE;
  DROP TABLE "pavillions"."user_groups_field_permissions" CASCADE;
  DROP TABLE "pavillions"."user_groups" CASCADE;
  DROP TABLE "pavillions"."user_groups_texts" CASCADE;
  DROP TABLE "pavillions"."user_groups_rels" CASCADE;
  DROP TABLE "pavillions"."media" CASCADE;
  DROP TABLE "pavillions"."videos" CASCADE;
  DROP TABLE "pavillions"."landing" CASCADE;
  DROP TABLE "pavillions"."trends" CASCADE;
  DROP TABLE "pavillions"."content_topic_sections" CASCADE;
  DROP TABLE "pavillions"."content" CASCADE;
  DROP TABLE "pavillions"."header_items" CASCADE;
  DROP TABLE "pavillions"."header" CASCADE;
  DROP TABLE "pavillions"."footer_items" CASCADE;
  DROP TABLE "pavillions"."footer" CASCADE;
  DROP TABLE "pavillions"."languages" CASCADE;
  DROP TABLE "pavillions"."awards" CASCADE;
  DROP TABLE "pavillions"."programs_rerun_dates" CASCADE;
  DROP TABLE "pavillions"."programs" CASCADE;
  DROP TABLE "pavillions"."programs_rels" CASCADE;
  DROP TABLE "pavillions"."vipa_programs_rerun_dates" CASCADE;
  DROP TABLE "pavillions"."vipa_programs" CASCADE;
  DROP TABLE "pavillions"."seasons_awards" CASCADE;
  DROP TABLE "pavillions"."seasons_sell_pricing_format_prices" CASCADE;
  DROP TABLE "pavillions"."seasons_sell_pricing_cc_language_prices" CASCADE;
  DROP TABLE "pavillions"."seasons" CASCADE;
  DROP TABLE "pavillions"."seasons_rels" CASCADE;
  DROP TABLE "pavillions"."episodes_rerun_dates" CASCADE;
  DROP TABLE "pavillions"."episodes" CASCADE;
  DROP TABLE "pavillions"."payload_kv" CASCADE;
  DROP TABLE "pavillions"."payload_locked_documents" CASCADE;
  DROP TABLE "pavillions"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "pavillions"."payload_preferences" CASCADE;
  DROP TABLE "pavillions"."payload_preferences_rels" CASCADE;
  DROP TABLE "pavillions"."payload_migrations" CASCADE;
  DROP TYPE "pavillions"."enum_users_allowed_admin_pages";
  DROP TYPE "pavillions"."enum_users_collection_permissions_operations";
  DROP TYPE "pavillions"."enum_users_collection_permissions_collection";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_users";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_roleprofiles";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_usergroups";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_media";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_videos";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_landing";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_trends";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_content";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_header";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_footer";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_languages";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_awards";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_programs";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_vipaprograms";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_seasons";
  DROP TYPE "pavillions"."enum_users_field_permissions_fields_episodes";
  DROP TYPE "pavillions"."enum_users_field_permissions_collection";
  DROP TYPE "pavillions"."enum_users_role";
  DROP TYPE "pavillions"."enum_role_profiles_allowed_admin_pages";
  DROP TYPE "pavillions"."enum_role_profiles_collection_permissions_operations";
  DROP TYPE "pavillions"."enum_role_profiles_collection_permissions_collection";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_users";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_roleprofiles";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_usergroups";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_media";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_videos";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_landing";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_trends";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_content";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_header";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_footer";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_languages";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_awards";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_programs";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_vipaprograms";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_seasons";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_fields_episodes";
  DROP TYPE "pavillions"."enum_role_profiles_field_permissions_collection";
  DROP TYPE "pavillions"."enum_user_groups_allowed_admin_pages";
  DROP TYPE "pavillions"."enum_user_groups_collection_permissions_operations";
  DROP TYPE "pavillions"."enum_user_groups_collection_permissions_collection";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_users";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_roleprofiles";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_usergroups";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_media";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_videos";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_landing";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_trends";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_content";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_header";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_footer";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_languages";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_awards";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_programs";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_vipaprograms";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_seasons";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_fields_episodes";
  DROP TYPE "pavillions"."enum_user_groups_field_permissions_collection";
  DROP TYPE "pavillions"."enum_trends_type";
  DROP TYPE "pavillions"."enum_header_items_item_type";
  DROP TYPE "pavillions"."enum_footer_items_item_type";
  DROP TYPE "pavillions"."enum_programs_program_content_type";
  DROP TYPE "pavillions"."enum_programs_target_group";
  DROP TYPE "pavillions"."enum_programs_type";
  DROP TYPE "pavillions"."enum_programs_genre";
  DROP TYPE "pavillions"."enum_programs_genre_sub";
  DROP TYPE "pavillions"."enum_programs_format";
  DROP TYPE "pavillions"."enum_programs_audiochannel1_2";
  DROP TYPE "pavillions"."enum_programs_audiochannel3_4";
  DROP TYPE "pavillions"."enum_programs_close_caption1";
  DROP TYPE "pavillions"."enum_programs_close_caption2";
  DROP TYPE "pavillions"."enum_programs_close_caption3";
  DROP TYPE "pavillions"."enum_programs_subtitle1";
  DROP TYPE "pavillions"."enum_vipa_programs_genre";
  DROP TYPE "pavillions"."enum_seasons_sell_pricing_format_prices_format";`)
}
