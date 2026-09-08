import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "pavillions"."enum_users_field_permissions_fields_articles" AS ENUM('program', 'targetType', 'season', 'episode', 'titleTh', 'titleEn', 'slug', 'excerptTh', 'excerptEn', 'descriptionTh', 'descriptionEn', 'heroImages', 'categories', 'tags', 'author', 'publishedDate', 'status', 'contentTh', 'contentEn', 'seoTitleTh', 'seoTitleEn', 'seoDescriptionTh', 'seoDescriptionEn', 'socialSharingImage');
    CREATE TYPE "pavillions"."enum_role_profiles_field_permissions_fields_articles" AS ENUM('program', 'targetType', 'season', 'episode', 'titleTh', 'titleEn', 'slug', 'excerptTh', 'excerptEn', 'descriptionTh', 'descriptionEn', 'heroImages', 'categories', 'tags', 'author', 'publishedDate', 'status', 'contentTh', 'contentEn', 'seoTitleTh', 'seoTitleEn', 'seoDescriptionTh', 'seoDescriptionEn', 'socialSharingImage');
    CREATE TYPE "pavillions"."enum_user_groups_field_permissions_fields_articles" AS ENUM('program', 'targetType', 'season', 'episode', 'titleTh', 'titleEn', 'slug', 'excerptTh', 'excerptEn', 'descriptionTh', 'descriptionEn', 'heroImages', 'categories', 'tags', 'author', 'publishedDate', 'status', 'contentTh', 'contentEn', 'seoTitleTh', 'seoTitleEn', 'seoDescriptionTh', 'seoDescriptionEn', 'socialSharingImage');
    CREATE TYPE "pavillions"."enum_articles_target_type" AS ENUM('program', 'season', 'episode');
    CREATE TYPE "pavillions"."enum_articles_status" AS ENUM('draft', 'published');
    CREATE TYPE "pavillions"."enum__articles_v_version_target_type" AS ENUM('program', 'season', 'episode');
    CREATE TYPE "pavillions"."enum__articles_v_version_status" AS ENUM('draft', 'published');

    ALTER TYPE "pavillions"."enum_users_collection_permissions_collection" ADD VALUE IF NOT EXISTS 'articles';
    ALTER TYPE "pavillions"."enum_users_field_permissions_collection" ADD VALUE IF NOT EXISTS 'articles';
    ALTER TYPE "pavillions"."enum_role_profiles_collection_permissions_collection" ADD VALUE IF NOT EXISTS 'articles';
    ALTER TYPE "pavillions"."enum_role_profiles_field_permissions_collection" ADD VALUE IF NOT EXISTS 'articles';
    ALTER TYPE "pavillions"."enum_user_groups_collection_permissions_collection" ADD VALUE IF NOT EXISTS 'articles';
    ALTER TYPE "pavillions"."enum_user_groups_field_permissions_collection" ADD VALUE IF NOT EXISTS 'articles';

    CREATE TABLE "pavillions"."users_field_permissions_fields_articles" (
      "order" integer NOT NULL, "parent_id" varchar NOT NULL,
      "value" "pavillions"."enum_users_field_permissions_fields_articles", "id" serial PRIMARY KEY NOT NULL
    );
    CREATE TABLE "pavillions"."role_profiles_field_permissions_fields_articles" (
      "order" integer NOT NULL, "parent_id" varchar NOT NULL,
      "value" "pavillions"."enum_role_profiles_field_permissions_fields_articles", "id" serial PRIMARY KEY NOT NULL
    );
    CREATE TABLE "pavillions"."user_groups_field_permissions_fields_articles" (
      "order" integer NOT NULL, "parent_id" varchar NOT NULL,
      "value" "pavillions"."enum_user_groups_field_permissions_fields_articles", "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE "pavillions"."articles" (
      "id" serial PRIMARY KEY NOT NULL,
      "program_id" integer,
      "target_type" "pavillions"."enum_articles_target_type" DEFAULT 'program',
      "season_id" integer,
      "episode_id" integer,
      "_displaytitle" varchar,
      "title_th" varchar,
      "title_en" varchar,
      "slug" varchar,
      "excerpt_th" varchar,
      "excerpt_en" varchar,
      "description_th" varchar,
      "description_en" varchar,
      "author" varchar,
      "published_date" timestamp(3) with time zone,
      "status" "pavillions"."enum_articles_status" DEFAULT 'draft',
      "content_th" jsonb,
      "content_en" jsonb,
      "seo_title_th" varchar,
      "seo_title_en" varchar,
      "seo_description_th" varchar,
      "seo_description_en" varchar,
      "social_sharing_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "pavillions"."enum_articles_status" DEFAULT 'draft'
    );
    CREATE TABLE "pavillions"."articles_hero_images_vertical" (
      "_order" integer NOT NULL, "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL, "image_id" integer
    );
    CREATE TABLE "pavillions"."articles_hero_images_horizontal" (
      "_order" integer NOT NULL, "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL, "image_id" integer
    );
    CREATE TABLE "pavillions"."articles_texts" (
      "id" serial PRIMARY KEY NOT NULL, "order" integer NOT NULL,
      "parent_id" integer NOT NULL, "path" varchar NOT NULL, "text" varchar
    );
    CREATE TABLE "pavillions"."articles_rels" (
      "id" serial PRIMARY KEY NOT NULL, "order" integer,
      "parent_id" integer NOT NULL, "path" varchar NOT NULL, "categories_id" integer
    );

    CREATE TABLE "pavillions"."_articles_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_program_id" integer,
      "version_target_type" "pavillions"."enum__articles_v_version_target_type" DEFAULT 'program',
      "version_season_id" integer,
      "version_episode_id" integer,
      "version__displaytitle" varchar,
      "version_title_th" varchar,
      "version_title_en" varchar,
      "version_slug" varchar,
      "version_excerpt_th" varchar,
      "version_excerpt_en" varchar,
      "version_description_th" varchar,
      "version_description_en" varchar,
      "version_author" varchar,
      "version_published_date" timestamp(3) with time zone,
      "version_status" "pavillions"."enum__articles_v_version_status" DEFAULT 'draft',
      "version_content_th" jsonb,
      "version_content_en" jsonb,
      "version_seo_title_th" varchar,
      "version_seo_title_en" varchar,
      "version_seo_description_th" varchar,
      "version_seo_description_en" varchar,
      "version_social_sharing_image_id" integer,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "pavillions"."enum__articles_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean
    );
    CREATE TABLE "pavillions"."_articles_v_version_hero_images_vertical" (
      "_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" serial PRIMARY KEY NOT NULL,
      "image_id" integer, "_uuid" varchar
    );
    CREATE TABLE "pavillions"."_articles_v_version_hero_images_horizontal" (
      "_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" serial PRIMARY KEY NOT NULL,
      "image_id" integer, "_uuid" varchar
    );
    CREATE TABLE "pavillions"."_articles_v_texts" (
      "id" serial PRIMARY KEY NOT NULL, "order" integer NOT NULL,
      "parent_id" integer NOT NULL, "path" varchar NOT NULL, "text" varchar
    );
    CREATE TABLE "pavillions"."_articles_v_rels" (
      "id" serial PRIMARY KEY NOT NULL, "order" integer,
      "parent_id" integer NOT NULL, "path" varchar NOT NULL, "categories_id" integer
    );

    ALTER TABLE "pavillions"."users_rels" ADD COLUMN "articles_id" integer;
    ALTER TABLE "pavillions"."role_profiles_rels" ADD COLUMN "articles_id" integer;
    ALTER TABLE "pavillions"."user_groups_rels" ADD COLUMN "articles_id" integer;
    ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "articles_id" integer;

    ALTER TABLE "pavillions"."users_field_permissions_fields_articles" ADD CONSTRAINT "users_field_permissions_fields_articles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."users_field_permissions"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."role_profiles_field_permissions_fields_articles" ADD CONSTRAINT "role_profiles_field_permissions_fields_articles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."role_profiles_field_permissions"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."user_groups_field_permissions_fields_articles" ADD CONSTRAINT "user_groups_field_permissions_fields_articles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."user_groups_field_permissions"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."articles" ADD CONSTRAINT "articles_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "pavillions"."programs"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."articles" ADD CONSTRAINT "articles_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "pavillions"."seasons"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."articles" ADD CONSTRAINT "articles_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "pavillions"."episodes"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."articles" ADD CONSTRAINT "articles_social_sharing_image_id_media_id_fk" FOREIGN KEY ("social_sharing_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."articles_hero_images_vertical" ADD CONSTRAINT "articles_hero_images_vertical_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."articles_hero_images_vertical" ADD CONSTRAINT "articles_hero_images_vertical_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."articles_hero_images_horizontal" ADD CONSTRAINT "articles_hero_images_horizontal_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."articles_hero_images_horizontal" ADD CONSTRAINT "articles_hero_images_horizontal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."articles_texts" ADD CONSTRAINT "articles_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."articles_rels" ADD CONSTRAINT "articles_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "pavillions"."categories"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."articles"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."_articles_v" ADD CONSTRAINT "_articles_v_version_program_id_programs_id_fk" FOREIGN KEY ("version_program_id") REFERENCES "pavillions"."programs"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."_articles_v" ADD CONSTRAINT "_articles_v_version_season_id_seasons_id_fk" FOREIGN KEY ("version_season_id") REFERENCES "pavillions"."seasons"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."_articles_v" ADD CONSTRAINT "_articles_v_version_episode_id_episodes_id_fk" FOREIGN KEY ("version_episode_id") REFERENCES "pavillions"."episodes"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."_articles_v" ADD CONSTRAINT "_articles_v_version_social_sharing_image_id_media_id_fk" FOREIGN KEY ("version_social_sharing_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."_articles_v_version_hero_images_vertical" ADD CONSTRAINT "_articles_v_version_hero_images_vertical_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."_articles_v_version_hero_images_vertical" ADD CONSTRAINT "_articles_v_version_hero_images_vertical_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."_articles_v"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."_articles_v_version_hero_images_horizontal" ADD CONSTRAINT "_articles_v_version_hero_images_horizontal_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null;
    ALTER TABLE "pavillions"."_articles_v_version_hero_images_horizontal" ADD CONSTRAINT "_articles_v_version_hero_images_horizontal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."_articles_v"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."_articles_v_texts" ADD CONSTRAINT "_articles_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."_articles_v"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."_articles_v"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "pavillions"."categories"("id") ON DELETE cascade;

    CREATE UNIQUE INDEX "articles_slug_idx" ON "pavillions"."articles" ("slug");
    CREATE INDEX "articles_program_idx" ON "pavillions"."articles" ("program_id");
    CREATE INDEX "articles_season_idx" ON "pavillions"."articles" ("season_id");
    CREATE INDEX "articles_episode_idx" ON "pavillions"."articles" ("episode_id");
    CREATE INDEX "articles_social_sharing_image_idx" ON "pavillions"."articles" ("social_sharing_image_id");
    CREATE INDEX "articles_updated_at_idx" ON "pavillions"."articles" ("updated_at");
    CREATE INDEX "articles_created_at_idx" ON "pavillions"."articles" ("created_at");
    CREATE INDEX "articles__status_idx" ON "pavillions"."articles" ("_status");
    CREATE INDEX "articles_hero_images_vertical_order_idx" ON "pavillions"."articles_hero_images_vertical" ("_order");
    CREATE INDEX "articles_hero_images_vertical_parent_id_idx" ON "pavillions"."articles_hero_images_vertical" ("_parent_id");
    CREATE INDEX "articles_hero_images_vertical_image_idx" ON "pavillions"."articles_hero_images_vertical" ("image_id");
    CREATE INDEX "articles_hero_images_horizontal_order_idx" ON "pavillions"."articles_hero_images_horizontal" ("_order");
    CREATE INDEX "articles_hero_images_horizontal_parent_id_idx" ON "pavillions"."articles_hero_images_horizontal" ("_parent_id");
    CREATE INDEX "articles_hero_images_horizontal_image_idx" ON "pavillions"."articles_hero_images_horizontal" ("image_id");
    CREATE INDEX "articles_texts_order_parent" ON "pavillions"."articles_texts" ("order", "parent_id");
    CREATE INDEX "articles_rels_order_idx" ON "pavillions"."articles_rels" ("order");
    CREATE INDEX "articles_rels_parent_idx" ON "pavillions"."articles_rels" ("parent_id");
    CREATE INDEX "articles_rels_path_idx" ON "pavillions"."articles_rels" ("path");
    CREATE INDEX "articles_rels_categories_id_idx" ON "pavillions"."articles_rels" ("categories_id");
    CREATE INDEX "_articles_v_parent_idx" ON "pavillions"."_articles_v" ("parent_id");
    CREATE INDEX "_articles_v_version_version_program_idx" ON "pavillions"."_articles_v" ("version_program_id");
    CREATE INDEX "_articles_v_version_version_season_idx" ON "pavillions"."_articles_v" ("version_season_id");
    CREATE INDEX "_articles_v_version_version_episode_idx" ON "pavillions"."_articles_v" ("version_episode_id");
    CREATE INDEX "_articles_v_version_version_slug_idx" ON "pavillions"."_articles_v" ("version_slug");
    CREATE INDEX "_articles_v_version_version_social_sharing_image_idx" ON "pavillions"."_articles_v" ("version_social_sharing_image_id");
    CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "pavillions"."_articles_v" ("version_updated_at");
    CREATE INDEX "_articles_v_version_version_created_at_idx" ON "pavillions"."_articles_v" ("version_created_at");
    CREATE INDEX "_articles_v_version_version__status_idx" ON "pavillions"."_articles_v" ("version__status");
    CREATE INDEX "_articles_v_created_at_idx" ON "pavillions"."_articles_v" ("created_at");
    CREATE INDEX "_articles_v_updated_at_idx" ON "pavillions"."_articles_v" ("updated_at");
    CREATE INDEX "_articles_v_latest_idx" ON "pavillions"."_articles_v" ("latest");
    CREATE INDEX "_articles_v_version_hero_images_vertical_order_idx" ON "pavillions"."_articles_v_version_hero_images_vertical" ("_order");
    CREATE INDEX "_articles_v_version_hero_images_vertical_parent_id_idx" ON "pavillions"."_articles_v_version_hero_images_vertical" ("_parent_id");
    CREATE INDEX "_articles_v_version_hero_images_vertical_image_idx" ON "pavillions"."_articles_v_version_hero_images_vertical" ("image_id");
    CREATE INDEX "_articles_v_version_hero_images_horizontal_order_idx" ON "pavillions"."_articles_v_version_hero_images_horizontal" ("_order");
    CREATE INDEX "_articles_v_version_hero_images_horizontal_parent_id_idx" ON "pavillions"."_articles_v_version_hero_images_horizontal" ("_parent_id");
    CREATE INDEX "_articles_v_version_hero_images_horizontal_image_idx" ON "pavillions"."_articles_v_version_hero_images_horizontal" ("image_id");
    CREATE INDEX "_articles_v_texts_order_parent" ON "pavillions"."_articles_v_texts" ("order", "parent_id");
    CREATE INDEX "_articles_v_rels_order_idx" ON "pavillions"."_articles_v_rels" ("order");
    CREATE INDEX "_articles_v_rels_parent_idx" ON "pavillions"."_articles_v_rels" ("parent_id");
    CREATE INDEX "_articles_v_rels_path_idx" ON "pavillions"."_articles_v_rels" ("path");
    CREATE INDEX "_articles_v_rels_categories_id_idx" ON "pavillions"."_articles_v_rels" ("categories_id");
    CREATE INDEX "users_field_permissions_fields_articles_order_idx" ON "pavillions"."users_field_permissions_fields_articles" ("order");
    CREATE INDEX "users_field_permissions_fields_articles_parent_idx" ON "pavillions"."users_field_permissions_fields_articles" ("parent_id");
    CREATE INDEX "role_profiles_field_permissions_fields_articles_order_idx" ON "pavillions"."role_profiles_field_permissions_fields_articles" ("order");
    CREATE INDEX "role_profiles_field_permissions_fields_articles_parent_idx" ON "pavillions"."role_profiles_field_permissions_fields_articles" ("parent_id");
    CREATE INDEX "user_groups_field_permissions_fields_articles_order_idx" ON "pavillions"."user_groups_field_permissions_fields_articles" ("order");
    CREATE INDEX "user_groups_field_permissions_fields_articles_parent_idx" ON "pavillions"."user_groups_field_permissions_fields_articles" ("parent_id");

    ALTER TABLE "pavillions"."users_rels" ADD CONSTRAINT "users_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."role_profiles_rels" ADD CONSTRAINT "role_profiles_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."user_groups_rels" ADD CONSTRAINT "user_groups_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "pavillions"."articles"("id") ON DELETE cascade;
    CREATE INDEX "users_rels_articles_id_idx" ON "pavillions"."users_rels" ("articles_id");
    CREATE INDEX "role_profiles_rels_articles_id_idx" ON "pavillions"."role_profiles_rels" ("articles_id");
    CREATE INDEX "user_groups_rels_articles_id_idx" ON "pavillions"."user_groups_rels" ("articles_id");
    CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "pavillions"."payload_locked_documents_rels" ("articles_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."users_rels" DROP CONSTRAINT IF EXISTS "users_rels_articles_fk";
    ALTER TABLE "pavillions"."role_profiles_rels" DROP CONSTRAINT IF EXISTS "role_profiles_rels_articles_fk";
    ALTER TABLE "pavillions"."user_groups_rels" DROP CONSTRAINT IF EXISTS "user_groups_rels_articles_fk";
    ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_articles_fk";
    DROP INDEX IF EXISTS "pavillions"."users_rels_articles_id_idx";
    DROP INDEX IF EXISTS "pavillions"."role_profiles_rels_articles_id_idx";
    DROP INDEX IF EXISTS "pavillions"."user_groups_rels_articles_id_idx";
    DROP INDEX IF EXISTS "pavillions"."payload_locked_documents_rels_articles_id_idx";
    ALTER TABLE "pavillions"."users_rels" DROP COLUMN IF EXISTS "articles_id";
    ALTER TABLE "pavillions"."role_profiles_rels" DROP COLUMN IF EXISTS "articles_id";
    ALTER TABLE "pavillions"."user_groups_rels" DROP COLUMN IF EXISTS "articles_id";
    ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "articles_id";

    DROP TABLE IF EXISTS "pavillions"."_articles_v_version_hero_images_vertical" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."_articles_v_version_hero_images_horizontal" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."_articles_v_texts" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."_articles_v_rels" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."_articles_v" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."articles_hero_images_vertical" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."articles_hero_images_horizontal" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."articles_texts" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."articles_rels" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."articles" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."users_field_permissions_fields_articles" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."role_profiles_field_permissions_fields_articles" CASCADE;
    DROP TABLE IF EXISTS "pavillions"."user_groups_field_permissions_fields_articles" CASCADE;

    DROP TYPE IF EXISTS "pavillions"."enum_users_field_permissions_fields_articles";
    DROP TYPE IF EXISTS "pavillions"."enum_role_profiles_field_permissions_fields_articles";
    DROP TYPE IF EXISTS "pavillions"."enum_user_groups_field_permissions_fields_articles";
    DROP TYPE IF EXISTS "pavillions"."enum_articles_target_type";
    DROP TYPE IF EXISTS "pavillions"."enum_articles_status";
    DROP TYPE IF EXISTS "pavillions"."enum__articles_v_version_target_type";
    DROP TYPE IF EXISTS "pavillions"."enum__articles_v_version_status";
  `)
}
