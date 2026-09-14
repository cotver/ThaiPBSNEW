import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "is_normal" boolean DEFAULT true;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_is_normal" boolean DEFAULT true;

    UPDATE "pavillions"."column_articles"
    SET "is_normal" = NOT (
      COALESCE("is_new_episodes", false) OR COALESCE("coming_soon", false)
      OR COALESCE("is_press_releases", false) OR COALESCE("is_markets_and_events", false)
    );
    UPDATE "pavillions"."_column_articles_v"
    SET "version_is_normal" = NOT (
      COALESCE("version_is_new_episodes", false) OR COALESCE("version_coming_soon", false)
      OR COALESCE("version_is_press_releases", false) OR COALESCE("version_is_markets_and_events", false)
    );

    CREATE INDEX "column_articles_is_normal_idx" ON "pavillions"."column_articles" USING btree ("is_normal");
    CREATE INDEX "_column_articles_v_version_version_is_normal_idx" ON "pavillions"."_column_articles_v" USING btree ("version_is_normal");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pavillions"."column_articles_is_normal_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_is_normal_idx";
    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "is_normal";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_is_normal";
  `)
}
