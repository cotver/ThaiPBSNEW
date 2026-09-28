import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."market_event_content" ALTER COLUMN "date_time" DROP NOT NULL;
  ALTER TABLE "pavillions"."market_event_content" ALTER COLUMN "location" DROP NOT NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "pavillions"."market_event_content" SET "date_time" = "created_at" WHERE "date_time" IS NULL;
  UPDATE "pavillions"."market_event_content" SET "location" = '' WHERE "location" IS NULL;
   ALTER TABLE "pavillions"."market_event_content" ALTER COLUMN "date_time" SET NOT NULL;
  ALTER TABLE "pavillions"."market_event_content" ALTER COLUMN "location" SET NOT NULL;`)
}
