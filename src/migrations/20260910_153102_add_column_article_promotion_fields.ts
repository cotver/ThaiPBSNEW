import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "is_new_episodes" boolean DEFAULT false;
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "new_episodes_until" timestamp(3) with time zone;
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "coming_soon" boolean DEFAULT false;
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "coming_soon_date" timestamp(3) with time zone;
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "is_press_releases" boolean DEFAULT false;

    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_is_new_episodes" boolean DEFAULT false;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_new_episodes_until" timestamp(3) with time zone;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_coming_soon" boolean DEFAULT false;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_coming_soon_date" timestamp(3) with time zone;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_is_press_releases" boolean DEFAULT false;

    CREATE INDEX "column_articles_is_new_episodes_idx" ON "pavillions"."column_articles" USING btree ("is_new_episodes");
    CREATE INDEX "column_articles_new_episodes_until_idx" ON "pavillions"."column_articles" USING btree ("new_episodes_until");
    CREATE INDEX "column_articles_coming_soon_idx" ON "pavillions"."column_articles" USING btree ("coming_soon");
    CREATE INDEX "column_articles_coming_soon_date_idx" ON "pavillions"."column_articles" USING btree ("coming_soon_date");
    CREATE INDEX "column_articles_is_press_releases_idx" ON "pavillions"."column_articles" USING btree ("is_press_releases");

    CREATE INDEX "_column_articles_v_version_version_is_new_episodes_idx" ON "pavillions"."_column_articles_v" USING btree ("version_is_new_episodes");
    CREATE INDEX "_column_articles_v_version_version_new_episodes_until_idx" ON "pavillions"."_column_articles_v" USING btree ("version_new_episodes_until");
    CREATE INDEX "_column_articles_v_version_version_coming_soon_idx" ON "pavillions"."_column_articles_v" USING btree ("version_coming_soon");
    CREATE INDEX "_column_articles_v_version_version_coming_soon_date_idx" ON "pavillions"."_column_articles_v" USING btree ("version_coming_soon_date");
    CREATE INDEX "_column_articles_v_version_version_is_press_releases_idx" ON "pavillions"."_column_articles_v" USING btree ("version_is_press_releases");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pavillions"."column_articles_is_new_episodes_idx";
    DROP INDEX IF EXISTS "pavillions"."column_articles_new_episodes_until_idx";
    DROP INDEX IF EXISTS "pavillions"."column_articles_coming_soon_idx";
    DROP INDEX IF EXISTS "pavillions"."column_articles_coming_soon_date_idx";
    DROP INDEX IF EXISTS "pavillions"."column_articles_is_press_releases_idx";

    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_is_new_episodes_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_new_episodes_until_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_coming_soon_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_coming_soon_date_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_is_press_releases_idx";

    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "is_new_episodes";
    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "new_episodes_until";
    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "coming_soon";
    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "coming_soon_date";
    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "is_press_releases";

    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_is_new_episodes";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_new_episodes_until";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_coming_soon";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_coming_soon_date";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_is_press_releases";
  `)
}
