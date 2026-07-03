import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pavillions"."categories" ADD COLUMN IF NOT EXISTS "link" varchar;
  ALTER TABLE "pavillions"."categories" ADD COLUMN IF NOT EXISTS "app_shell_active" boolean DEFAULT false;

  CREATE TEMP TABLE "_type_category_map" (
    "type_id" integer PRIMARY KEY,
    "category_id" integer NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO "pavillions"."categories" (
    "_order",
    "name",
    "slug",
    "icon",
    "image_id",
    "video_id",
    "link",
    "order",
    "is_active",
    "app_shell_active",
    "updated_at",
    "created_at"
  )
  SELECT
    "t"."_order",
    "t"."name",
    "t"."slug",
    "t"."icon"::text::"pavillions"."enum_categories_icon",
    "t"."image_id",
    "t"."video_id",
    "t"."link",
    "t"."order",
    COALESCE("t"."is_active", true),
    COALESCE("t"."is_active", false),
    "t"."updated_at",
    "t"."created_at"
  FROM "pavillions"."types" "t"
  WHERE NOT EXISTS (
    SELECT 1
    FROM "pavillions"."categories" "c"
    WHERE "c"."slug" = "t"."slug"
  );

  UPDATE "pavillions"."categories" "c"
  SET
    "_order" = COALESCE("c"."_order", "t"."_order"),
    "icon" = COALESCE("c"."icon", "t"."icon"::text::"pavillions"."enum_categories_icon"),
    "image_id" = COALESCE("c"."image_id", "t"."image_id"),
    "video_id" = COALESCE("c"."video_id", "t"."video_id"),
    "link" = COALESCE(NULLIF("c"."link", ''), "t"."link"),
    "order" = COALESCE("c"."order", "t"."order"),
    "app_shell_active" = COALESCE("t"."is_active", false)
  FROM "pavillions"."types" "t"
  WHERE "c"."slug" = "t"."slug";

  INSERT INTO "_type_category_map" ("type_id", "category_id")
  SELECT "t"."id", "c"."id"
  FROM "pavillions"."types" "t"
  JOIN "pavillions"."categories" "c" ON "c"."slug" = "t"."slug";

  INSERT INTO "pavillions"."programs_rels" ("order", "parent_id", "path", "categories_id")
  SELECT "pr"."order", "pr"."parent_id", 'categories', "m"."category_id"
  FROM "pavillions"."programs_rels" "pr"
  JOIN "_type_category_map" "m" ON "m"."type_id" = "pr"."types_id"
  WHERE "pr"."path" = 'programsType'
    AND "pr"."types_id" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "pavillions"."programs_rels" "existing"
      WHERE "existing"."parent_id" = "pr"."parent_id"
        AND "existing"."path" = 'categories'
        AND "existing"."categories_id" = "m"."category_id"
    );

  DELETE FROM "pavillions"."programs_rels"
  WHERE "path" = 'programsType'
    AND "types_id" IS NOT NULL;

  ALTER TABLE "pavillions"."programs_rels" DROP CONSTRAINT IF EXISTS "programs_rels_types_fk";
  DROP INDEX IF EXISTS "pavillions"."programs_rels_types_id_idx";
  ALTER TABLE "pavillions"."programs_rels" DROP COLUMN IF EXISTS "types_id";

  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_types_fk";
  DROP INDEX IF EXISTS "pavillions"."payload_locked_documents_rels_types_id_idx";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "types_id";

  ALTER TABLE "pavillions"."types" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "pavillions"."types" CASCADE;
  DROP TYPE IF EXISTS "pavillions"."enum_types_icon";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type "typ"
      JOIN pg_namespace "ns" ON "ns"."oid" = "typ"."typnamespace"
      WHERE "typ"."typname" = 'enum_types_icon'
        AND "ns"."nspname" = 'pavillions'
    ) THEN
      CREATE TYPE "pavillions"."enum_types_icon" AS ENUM('home', 'search', 'plus', 'spark', 'film', 'screen', 'news', 'music', 'food', 'travel', 'kids', 'education');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "pavillions"."types" (
    "id" serial PRIMARY KEY NOT NULL,
    "_order" varchar,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "icon" "pavillions"."enum_types_icon",
    "image_id" integer,
    "video_id" integer,
    "link" varchar,
    "order" numeric DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "pavillions"."programs_rels" ADD COLUMN IF NOT EXISTS "types_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "types_id" integer;

  INSERT INTO "pavillions"."types" (
    "_order",
    "name",
    "slug",
    "icon",
    "image_id",
    "video_id",
    "link",
    "order",
    "is_active",
    "updated_at",
    "created_at"
  )
  SELECT
    "c"."_order",
    "c"."name",
    "c"."slug",
    "c"."icon"::text::"pavillions"."enum_types_icon",
    "c"."image_id",
    "c"."video_id",
    "c"."link",
    "c"."order",
    COALESCE("c"."is_active", true),
    "c"."updated_at",
    "c"."created_at"
  FROM "pavillions"."categories" "c"
  WHERE COALESCE("c"."app_shell_active", false) = true
    AND NOT EXISTS (
      SELECT 1
      FROM "pavillions"."types" "t"
      WHERE "t"."slug" = "c"."slug"
    );

  INSERT INTO "pavillions"."programs_rels" ("order", "parent_id", "path", "types_id")
  SELECT "pr"."order", "pr"."parent_id", 'programsType', "t"."id"
  FROM "pavillions"."programs_rels" "pr"
  JOIN "pavillions"."categories" "c" ON "c"."id" = "pr"."categories_id"
  JOIN "pavillions"."types" "t" ON "t"."slug" = "c"."slug"
  WHERE "pr"."path" = 'categories'
    AND "pr"."categories_id" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "pavillions"."programs_rels" "existing"
      WHERE "existing"."parent_id" = "pr"."parent_id"
        AND "existing"."path" = 'programsType'
        AND "existing"."types_id" = "t"."id"
    );

  ALTER TABLE "pavillions"."types" ADD CONSTRAINT "types_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."types" ADD CONSTRAINT "types_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "pavillions"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "pavillions"."types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "types__order_idx" ON "pavillions"."types" USING btree ("_order");
  CREATE UNIQUE INDEX IF NOT EXISTS "types_slug_idx" ON "pavillions"."types" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "types_image_idx" ON "pavillions"."types" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "types_video_idx" ON "pavillions"."types" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "types_updated_at_idx" ON "pavillions"."types" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "types_created_at_idx" ON "pavillions"."types" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "programs_rels_types_id_idx" ON "pavillions"."programs_rels" USING btree ("types_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_types_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("types_id");

  ALTER TABLE "pavillions"."categories" DROP COLUMN IF EXISTS "app_shell_active";
  ALTER TABLE "pavillions"."categories" DROP COLUMN IF EXISTS "link";
  `)
}
