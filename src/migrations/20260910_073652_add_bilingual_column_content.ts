import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "pavillions"."enum_column_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "pavillions"."enum__column_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "pavillions"."enum_column_analytics_events_event_type" AS ENUM('article_view', 'article_click', 'article_like', 'article_unlike');
  CREATE TYPE "pavillions"."enum_column_categories_page_style" AS ENUM('split-image', 'full-image-cta', 'framed-image-overlay', 'poster-split', 'dark-center-cta', 'editorial-band', 'dark-line-cta', 'image-title-brand');
  ALTER TYPE "pavillions"."enum_users_role" ADD VALUE IF NOT EXISTS 'writer' BEFORE 'user';
  CREATE TABLE "pavillions"."column_articles_hero_images_vertical" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "pavillions"."column_articles_hero_images_horizontal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "pavillions"."column_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title_th" varchar,
  	"title_en" varchar,
  	"slug" varchar,
  	"excerpt_th" varchar,
  	"excerpt_en" varchar,
  	"description_th" varchar,
  	"description_en" varchar,
  	"author_id" integer,
  	"published_date" timestamp(3) with time zone,
  	"content_th" jsonb,
  	"content_en" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "pavillions"."enum_column_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pavillions"."column_articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"column_videos_id" integer,
  	"column_categories_id" integer,
  	"column_subcategories_id" integer,
  	"column_tags_id" integer
  );
  
  CREATE TABLE "pavillions"."_column_articles_v_version_hero_images_vertical" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "pavillions"."_column_articles_v_version_hero_images_horizontal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "pavillions"."_column_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title_th" varchar,
  	"version_title_en" varchar,
  	"version_slug" varchar,
  	"version_excerpt_th" varchar,
  	"version_excerpt_en" varchar,
  	"version_description_th" varchar,
  	"version_description_en" varchar,
  	"version_author_id" integer,
  	"version_published_date" timestamp(3) with time zone,
  	"version_content_th" jsonb,
  	"version_content_en" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "pavillions"."enum__column_articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "pavillions"."_column_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"column_videos_id" integer,
  	"column_categories_id" integer,
  	"column_subcategories_id" integer,
  	"column_tags_id" integer
  );
  
  CREATE TABLE "pavillions"."column_analytics_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_type" "pavillions"."enum_column_analytics_events_event_type" NOT NULL,
  	"visitor_id" varchar NOT NULL,
  	"session_id" varchar,
  	"article_id" integer,
  	"path" varchar,
  	"referrer" varchar,
  	"user_agent" varchar,
  	"consent_snapshot" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."column_article_stats_monthly_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"month_year" varchar NOT NULL,
  	"views" numeric DEFAULT 0,
  	"unique_views" numeric DEFAULT 0,
  	"clicks" numeric DEFAULT 0,
  	"unique_clicks" numeric DEFAULT 0,
  	"likes" numeric DEFAULT 0,
  	"unique_likes" numeric DEFAULT 0
  );
  
  CREATE TABLE "pavillions"."column_article_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"article_id" integer NOT NULL,
  	"views" numeric DEFAULT 0,
  	"unique_views" numeric DEFAULT 0,
  	"clicks" numeric DEFAULT 0,
  	"unique_clicks" numeric DEFAULT 0,
  	"likes" numeric DEFAULT 0,
  	"unique_likes" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."column_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name_th" varchar NOT NULL,
  	"name_en" varchar,
  	"slug" varchar NOT NULL,
  	"description_th" varchar,
  	"description_en" varchar,
  	"cover_image_id" integer,
  	"page_style" "pavillions"."enum_column_categories_page_style" DEFAULT 'split-image' NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"show_in_navigation" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."column_subcategories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name_th" varchar NOT NULL,
  	"name_en" varchar,
  	"category_id" integer NOT NULL,
  	"slug" varchar NOT NULL,
  	"description_th" varchar,
  	"description_en" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"show_in_navigation" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."column_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name_th" varchar NOT NULL,
  	"name_en" varchar,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."column_authors_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "pavillions"."column_authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name_th" varchar NOT NULL,
  	"name_en" varchar,
  	"slug" varchar NOT NULL,
  	"avatar_id" integer,
  	"bio_th" varchar,
  	"bio_en" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."column_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" varchar,
  	"credit" varchar,
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
  
  CREATE TABLE "pavillions"."column_videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
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
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_articles_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_analytics_events_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_article_stats_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_categories_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_subcategories_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_tags_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_authors_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_media_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "column_videos_id" integer;
  ALTER TABLE "pavillions"."column_articles_hero_images_vertical" ADD CONSTRAINT "column_articles_hero_images_vertical_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_hero_images_vertical" ADD CONSTRAINT "column_articles_hero_images_vertical_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_hero_images_horizontal" ADD CONSTRAINT "column_articles_hero_images_horizontal_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_hero_images_horizontal" ADD CONSTRAINT "column_articles_hero_images_horizontal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles" ADD CONSTRAINT "column_articles_author_id_column_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "pavillions"."column_authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_rels" ADD CONSTRAINT "column_articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_rels" ADD CONSTRAINT "column_articles_rels_column_videos_fk" FOREIGN KEY ("column_videos_id") REFERENCES "pavillions"."column_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_rels" ADD CONSTRAINT "column_articles_rels_column_categories_fk" FOREIGN KEY ("column_categories_id") REFERENCES "pavillions"."column_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_rels" ADD CONSTRAINT "column_articles_rels_column_subcategories_fk" FOREIGN KEY ("column_subcategories_id") REFERENCES "pavillions"."column_subcategories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_rels" ADD CONSTRAINT "column_articles_rels_column_tags_fk" FOREIGN KEY ("column_tags_id") REFERENCES "pavillions"."column_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_version_hero_images_vertical" ADD CONSTRAINT "_column_articles_v_version_hero_images_vertical_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_version_hero_images_vertical" ADD CONSTRAINT "_column_articles_v_version_hero_images_vertical_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."_column_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_version_hero_images_horizontal" ADD CONSTRAINT "_column_articles_v_version_hero_images_horizontal_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_version_hero_images_horizontal" ADD CONSTRAINT "_column_articles_v_version_hero_images_horizontal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."_column_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v" ADD CONSTRAINT "_column_articles_v_parent_id_column_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v" ADD CONSTRAINT "_column_articles_v_version_author_id_column_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "pavillions"."column_authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_rels" ADD CONSTRAINT "_column_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."_column_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_rels" ADD CONSTRAINT "_column_articles_v_rels_column_videos_fk" FOREIGN KEY ("column_videos_id") REFERENCES "pavillions"."column_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_rels" ADD CONSTRAINT "_column_articles_v_rels_column_categories_fk" FOREIGN KEY ("column_categories_id") REFERENCES "pavillions"."column_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_rels" ADD CONSTRAINT "_column_articles_v_rels_column_subcategories_fk" FOREIGN KEY ("column_subcategories_id") REFERENCES "pavillions"."column_subcategories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_rels" ADD CONSTRAINT "_column_articles_v_rels_column_tags_fk" FOREIGN KEY ("column_tags_id") REFERENCES "pavillions"."column_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_analytics_events" ADD CONSTRAINT "column_analytics_events_article_id_column_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_article_stats_monthly_stats" ADD CONSTRAINT "column_article_stats_monthly_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."column_article_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_article_stats" ADD CONSTRAINT "column_article_stats_article_id_column_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_categories" ADD CONSTRAINT "column_categories_cover_image_id_column_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_subcategories" ADD CONSTRAINT "column_subcategories_category_id_column_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "pavillions"."column_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_authors_social_links" ADD CONSTRAINT "column_authors_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."column_authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_authors" ADD CONSTRAINT "column_authors_avatar_id_column_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "column_articles_hero_images_vertical_order_idx" ON "pavillions"."column_articles_hero_images_vertical" USING btree ("_order");
  CREATE INDEX "column_articles_hero_images_vertical_parent_id_idx" ON "pavillions"."column_articles_hero_images_vertical" USING btree ("_parent_id");
  CREATE INDEX "column_articles_hero_images_vertical_image_idx" ON "pavillions"."column_articles_hero_images_vertical" USING btree ("image_id");
  CREATE INDEX "column_articles_hero_images_horizontal_order_idx" ON "pavillions"."column_articles_hero_images_horizontal" USING btree ("_order");
  CREATE INDEX "column_articles_hero_images_horizontal_parent_id_idx" ON "pavillions"."column_articles_hero_images_horizontal" USING btree ("_parent_id");
  CREATE INDEX "column_articles_hero_images_horizontal_image_idx" ON "pavillions"."column_articles_hero_images_horizontal" USING btree ("image_id");
  CREATE UNIQUE INDEX "column_articles_slug_idx" ON "pavillions"."column_articles" USING btree ("slug");
  CREATE INDEX "column_articles_author_idx" ON "pavillions"."column_articles" USING btree ("author_id");
  CREATE INDEX "column_articles_updated_at_idx" ON "pavillions"."column_articles" USING btree ("updated_at");
  CREATE INDEX "column_articles_created_at_idx" ON "pavillions"."column_articles" USING btree ("created_at");
  CREATE INDEX "column_articles__status_idx" ON "pavillions"."column_articles" USING btree ("_status");
  CREATE INDEX "column_articles_rels_order_idx" ON "pavillions"."column_articles_rels" USING btree ("order");
  CREATE INDEX "column_articles_rels_parent_idx" ON "pavillions"."column_articles_rels" USING btree ("parent_id");
  CREATE INDEX "column_articles_rels_path_idx" ON "pavillions"."column_articles_rels" USING btree ("path");
  CREATE INDEX "column_articles_rels_column_videos_id_idx" ON "pavillions"."column_articles_rels" USING btree ("column_videos_id");
  CREATE INDEX "column_articles_rels_column_categories_id_idx" ON "pavillions"."column_articles_rels" USING btree ("column_categories_id");
  CREATE INDEX "column_articles_rels_column_subcategories_id_idx" ON "pavillions"."column_articles_rels" USING btree ("column_subcategories_id");
  CREATE INDEX "column_articles_rels_column_tags_id_idx" ON "pavillions"."column_articles_rels" USING btree ("column_tags_id");
  CREATE INDEX "_column_articles_v_version_hero_images_vertical_order_idx" ON "pavillions"."_column_articles_v_version_hero_images_vertical" USING btree ("_order");
  CREATE INDEX "_column_articles_v_version_hero_images_vertical_parent_id_idx" ON "pavillions"."_column_articles_v_version_hero_images_vertical" USING btree ("_parent_id");
  CREATE INDEX "_column_articles_v_version_hero_images_vertical_image_idx" ON "pavillions"."_column_articles_v_version_hero_images_vertical" USING btree ("image_id");
  CREATE INDEX "_column_articles_v_version_hero_images_horizontal_order_idx" ON "pavillions"."_column_articles_v_version_hero_images_horizontal" USING btree ("_order");
  CREATE INDEX "_column_articles_v_version_hero_images_horizontal_parent_id_idx" ON "pavillions"."_column_articles_v_version_hero_images_horizontal" USING btree ("_parent_id");
  CREATE INDEX "_column_articles_v_version_hero_images_horizontal_image_idx" ON "pavillions"."_column_articles_v_version_hero_images_horizontal" USING btree ("image_id");
  CREATE INDEX "_column_articles_v_parent_idx" ON "pavillions"."_column_articles_v" USING btree ("parent_id");
  CREATE INDEX "_column_articles_v_version_version_slug_idx" ON "pavillions"."_column_articles_v" USING btree ("version_slug");
  CREATE INDEX "_column_articles_v_version_version_author_idx" ON "pavillions"."_column_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_column_articles_v_version_version_updated_at_idx" ON "pavillions"."_column_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_column_articles_v_version_version_created_at_idx" ON "pavillions"."_column_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_column_articles_v_version_version__status_idx" ON "pavillions"."_column_articles_v" USING btree ("version__status");
  CREATE INDEX "_column_articles_v_created_at_idx" ON "pavillions"."_column_articles_v" USING btree ("created_at");
  CREATE INDEX "_column_articles_v_updated_at_idx" ON "pavillions"."_column_articles_v" USING btree ("updated_at");
  CREATE INDEX "_column_articles_v_latest_idx" ON "pavillions"."_column_articles_v" USING btree ("latest");
  CREATE INDEX "_column_articles_v_rels_order_idx" ON "pavillions"."_column_articles_v_rels" USING btree ("order");
  CREATE INDEX "_column_articles_v_rels_parent_idx" ON "pavillions"."_column_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_column_articles_v_rels_path_idx" ON "pavillions"."_column_articles_v_rels" USING btree ("path");
  CREATE INDEX "_column_articles_v_rels_column_videos_id_idx" ON "pavillions"."_column_articles_v_rels" USING btree ("column_videos_id");
  CREATE INDEX "_column_articles_v_rels_column_categories_id_idx" ON "pavillions"."_column_articles_v_rels" USING btree ("column_categories_id");
  CREATE INDEX "_column_articles_v_rels_column_subcategories_id_idx" ON "pavillions"."_column_articles_v_rels" USING btree ("column_subcategories_id");
  CREATE INDEX "_column_articles_v_rels_column_tags_id_idx" ON "pavillions"."_column_articles_v_rels" USING btree ("column_tags_id");
  CREATE INDEX "column_analytics_events_visitor_id_idx" ON "pavillions"."column_analytics_events" USING btree ("visitor_id");
  CREATE INDEX "column_analytics_events_session_id_idx" ON "pavillions"."column_analytics_events" USING btree ("session_id");
  CREATE INDEX "column_analytics_events_article_idx" ON "pavillions"."column_analytics_events" USING btree ("article_id");
  CREATE INDEX "column_analytics_events_updated_at_idx" ON "pavillions"."column_analytics_events" USING btree ("updated_at");
  CREATE INDEX "column_analytics_events_created_at_idx" ON "pavillions"."column_analytics_events" USING btree ("created_at");
  CREATE INDEX "column_article_stats_monthly_stats_order_idx" ON "pavillions"."column_article_stats_monthly_stats" USING btree ("_order");
  CREATE INDEX "column_article_stats_monthly_stats_parent_id_idx" ON "pavillions"."column_article_stats_monthly_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "column_article_stats_article_idx" ON "pavillions"."column_article_stats" USING btree ("article_id");
  CREATE INDEX "column_article_stats_updated_at_idx" ON "pavillions"."column_article_stats" USING btree ("updated_at");
  CREATE INDEX "column_article_stats_created_at_idx" ON "pavillions"."column_article_stats" USING btree ("created_at");
  CREATE INDEX "column_categories__order_idx" ON "pavillions"."column_categories" USING btree ("_order");
  CREATE UNIQUE INDEX "column_categories_slug_idx" ON "pavillions"."column_categories" USING btree ("slug");
  CREATE INDEX "column_categories_cover_image_idx" ON "pavillions"."column_categories" USING btree ("cover_image_id");
  CREATE INDEX "column_categories_updated_at_idx" ON "pavillions"."column_categories" USING btree ("updated_at");
  CREATE INDEX "column_categories_created_at_idx" ON "pavillions"."column_categories" USING btree ("created_at");
  CREATE INDEX "column_subcategories__order_idx" ON "pavillions"."column_subcategories" USING btree ("_order");
  CREATE INDEX "column_subcategories_category_idx" ON "pavillions"."column_subcategories" USING btree ("category_id");
  CREATE UNIQUE INDEX "column_subcategories_slug_idx" ON "pavillions"."column_subcategories" USING btree ("slug");
  CREATE INDEX "column_subcategories_updated_at_idx" ON "pavillions"."column_subcategories" USING btree ("updated_at");
  CREATE INDEX "column_subcategories_created_at_idx" ON "pavillions"."column_subcategories" USING btree ("created_at");
  CREATE UNIQUE INDEX "column_tags_slug_idx" ON "pavillions"."column_tags" USING btree ("slug");
  CREATE INDEX "column_tags_updated_at_idx" ON "pavillions"."column_tags" USING btree ("updated_at");
  CREATE INDEX "column_tags_created_at_idx" ON "pavillions"."column_tags" USING btree ("created_at");
  CREATE INDEX "column_authors_social_links_order_idx" ON "pavillions"."column_authors_social_links" USING btree ("_order");
  CREATE INDEX "column_authors_social_links_parent_id_idx" ON "pavillions"."column_authors_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "column_authors_slug_idx" ON "pavillions"."column_authors" USING btree ("slug");
  CREATE INDEX "column_authors_avatar_idx" ON "pavillions"."column_authors" USING btree ("avatar_id");
  CREATE INDEX "column_authors_updated_at_idx" ON "pavillions"."column_authors" USING btree ("updated_at");
  CREATE INDEX "column_authors_created_at_idx" ON "pavillions"."column_authors" USING btree ("created_at");
  CREATE INDEX "column_media_updated_at_idx" ON "pavillions"."column_media" USING btree ("updated_at");
  CREATE INDEX "column_media_created_at_idx" ON "pavillions"."column_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "column_media_filename_idx" ON "pavillions"."column_media" USING btree ("filename");
  CREATE INDEX "column_videos_updated_at_idx" ON "pavillions"."column_videos" USING btree ("updated_at");
  CREATE INDEX "column_videos_created_at_idx" ON "pavillions"."column_videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "column_videos_filename_idx" ON "pavillions"."column_videos" USING btree ("filename");
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_articles_fk" FOREIGN KEY ("column_articles_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_analytics_events_fk" FOREIGN KEY ("column_analytics_events_id") REFERENCES "pavillions"."column_analytics_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_article_stats_fk" FOREIGN KEY ("column_article_stats_id") REFERENCES "pavillions"."column_article_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_categories_fk" FOREIGN KEY ("column_categories_id") REFERENCES "pavillions"."column_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_subcategories_fk" FOREIGN KEY ("column_subcategories_id") REFERENCES "pavillions"."column_subcategories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_tags_fk" FOREIGN KEY ("column_tags_id") REFERENCES "pavillions"."column_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_authors_fk" FOREIGN KEY ("column_authors_id") REFERENCES "pavillions"."column_authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_media_fk" FOREIGN KEY ("column_media_id") REFERENCES "pavillions"."column_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_column_videos_fk" FOREIGN KEY ("column_videos_id") REFERENCES "pavillions"."column_videos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_column_articles_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_articles_id");
  CREATE INDEX "payload_locked_documents_rels_column_analytics_events_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_analytics_events_id");
  CREATE INDEX "payload_locked_documents_rels_column_article_stats_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_article_stats_id");
  CREATE INDEX "payload_locked_documents_rels_column_categories_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_categories_id");
  CREATE INDEX "payload_locked_documents_rels_column_subcategories_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_subcategories_id");
  CREATE INDEX "payload_locked_documents_rels_column_tags_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_tags_id");
  CREATE INDEX "payload_locked_documents_rels_column_authors_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_authors_id");
  CREATE INDEX "payload_locked_documents_rels_column_media_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_media_id");
  CREATE INDEX "payload_locked_documents_rels_column_videos_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("column_videos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."column_articles_hero_images_vertical" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_articles_hero_images_horizontal" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_articles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_articles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."_column_articles_v_version_hero_images_vertical" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."_column_articles_v_version_hero_images_horizontal" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."_column_articles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."_column_articles_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_analytics_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_article_stats_monthly_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_article_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_subcategories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_authors_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."column_videos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."column_articles_hero_images_vertical" CASCADE;
  DROP TABLE "pavillions"."column_articles_hero_images_horizontal" CASCADE;
  DROP TABLE "pavillions"."column_articles" CASCADE;
  DROP TABLE "pavillions"."column_articles_rels" CASCADE;
  DROP TABLE "pavillions"."_column_articles_v_version_hero_images_vertical" CASCADE;
  DROP TABLE "pavillions"."_column_articles_v_version_hero_images_horizontal" CASCADE;
  DROP TABLE "pavillions"."_column_articles_v" CASCADE;
  DROP TABLE "pavillions"."_column_articles_v_rels" CASCADE;
  DROP TABLE "pavillions"."column_analytics_events" CASCADE;
  DROP TABLE "pavillions"."column_article_stats_monthly_stats" CASCADE;
  DROP TABLE "pavillions"."column_article_stats" CASCADE;
  DROP TABLE "pavillions"."column_categories" CASCADE;
  DROP TABLE "pavillions"."column_subcategories" CASCADE;
  DROP TABLE "pavillions"."column_tags" CASCADE;
  DROP TABLE "pavillions"."column_authors_social_links" CASCADE;
  DROP TABLE "pavillions"."column_authors" CASCADE;
  DROP TABLE "pavillions"."column_media" CASCADE;
  DROP TABLE "pavillions"."column_videos" CASCADE;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_articles_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_analytics_events_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_article_stats_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_categories_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_subcategories_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_tags_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_authors_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_media_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_column_videos_fk";
  
  ALTER TABLE "pavillions"."users" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "pavillions"."users" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;
  UPDATE "pavillions"."users" SET "role" = 'user' WHERE "role" = 'writer';
  DROP TYPE "pavillions"."enum_users_role";
  CREATE TYPE "pavillions"."enum_users_role" AS ENUM('super-admin', 'editor', 'user');
  ALTER TABLE "pavillions"."users" ALTER COLUMN "role" SET DATA TYPE "pavillions"."enum_users_role" USING "role"::"pavillions"."enum_users_role";
  ALTER TABLE "pavillions"."users" ALTER COLUMN "role" SET DEFAULT 'user';
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_articles_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_analytics_events_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_article_stats_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_categories_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_subcategories_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_tags_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_authors_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_media_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_column_videos_id_idx";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_articles_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_analytics_events_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_article_stats_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_categories_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_subcategories_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_tags_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_authors_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_media_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "column_videos_id";
  DROP TYPE "pavillions"."enum_column_articles_status";
  DROP TYPE "pavillions"."enum__column_articles_v_version_status";
  DROP TYPE "pavillions"."enum_column_analytics_events_event_type";
  DROP TYPE "pavillions"."enum_column_categories_page_style";`)
}
