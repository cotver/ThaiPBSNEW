import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "pavillions"."enum_users_field_permissions_fields_articles" ADD VALUE IF NOT EXISTS 'isFeatured';
    ALTER TYPE "pavillions"."enum_users_field_permissions_fields_articles" ADD VALUE IF NOT EXISTS 'featuredUntil';
    ALTER TYPE "pavillions"."enum_role_profiles_field_permissions_fields_articles" ADD VALUE IF NOT EXISTS 'isFeatured';
    ALTER TYPE "pavillions"."enum_role_profiles_field_permissions_fields_articles" ADD VALUE IF NOT EXISTS 'featuredUntil';
    ALTER TYPE "pavillions"."enum_user_groups_field_permissions_fields_articles" ADD VALUE IF NOT EXISTS 'isFeatured';
    ALTER TYPE "pavillions"."enum_user_groups_field_permissions_fields_articles" ADD VALUE IF NOT EXISTS 'featuredUntil';

    ALTER TABLE "pavillions"."articles" ADD COLUMN "is_featured" boolean DEFAULT false;
    ALTER TABLE "pavillions"."articles" ADD COLUMN "featured_until" timestamp(3) with time zone;
    ALTER TABLE "pavillions"."_articles_v" ADD COLUMN "version_is_featured" boolean DEFAULT false;
    ALTER TABLE "pavillions"."_articles_v" ADD COLUMN "version_featured_until" timestamp(3) with time zone;

    CREATE INDEX "articles_is_featured_idx" ON "pavillions"."articles" ("is_featured");
    CREATE INDEX "articles_featured_until_idx" ON "pavillions"."articles" ("featured_until");
    CREATE INDEX "_articles_v_version_version_is_featured_idx" ON "pavillions"."_articles_v" ("version_is_featured");
    CREATE INDEX "_articles_v_version_version_featured_until_idx" ON "pavillions"."_articles_v" ("version_featured_until");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pavillions"."articles_is_featured_idx";
    DROP INDEX IF EXISTS "pavillions"."articles_featured_until_idx";
    DROP INDEX IF EXISTS "pavillions"."_articles_v_version_version_is_featured_idx";
    DROP INDEX IF EXISTS "pavillions"."_articles_v_version_version_featured_until_idx";

    ALTER TABLE "pavillions"."articles" DROP COLUMN "is_featured";
    ALTER TABLE "pavillions"."articles" DROP COLUMN "featured_until";
    ALTER TABLE "pavillions"."_articles_v" DROP COLUMN "version_is_featured";
    ALTER TABLE "pavillions"."_articles_v" DROP COLUMN "version_featured_until";
  `)
}
