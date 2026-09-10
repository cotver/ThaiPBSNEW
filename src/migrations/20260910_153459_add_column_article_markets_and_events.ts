import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "is_markets_and_events" boolean DEFAULT false;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_is_markets_and_events" boolean DEFAULT false;

    CREATE INDEX "column_articles_is_markets_and_events_idx" ON "pavillions"."column_articles" USING btree ("is_markets_and_events");
    CREATE INDEX "_column_articles_v_version_version_is_markets_and_events_idx" ON "pavillions"."_column_articles_v" USING btree ("version_is_markets_and_events");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pavillions"."column_articles_is_markets_and_events_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_is_markets_and_events_idx";

    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "is_markets_and_events";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_is_markets_and_events";
  `)
}
