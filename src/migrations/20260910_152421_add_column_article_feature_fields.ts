import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "is_feature" boolean DEFAULT false;
    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "feature_until" timestamp(3) with time zone;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_is_feature" boolean DEFAULT false;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_feature_until" timestamp(3) with time zone;

    CREATE INDEX "column_articles_is_feature_idx" ON "pavillions"."column_articles" USING btree ("is_feature");
    CREATE INDEX "column_articles_feature_until_idx" ON "pavillions"."column_articles" USING btree ("feature_until");
    CREATE INDEX "_column_articles_v_version_version_is_feature_idx" ON "pavillions"."_column_articles_v" USING btree ("version_is_feature");
    CREATE INDEX "_column_articles_v_version_version_feature_until_idx" ON "pavillions"."_column_articles_v" USING btree ("version_feature_until");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pavillions"."column_articles_is_feature_idx";
    DROP INDEX IF EXISTS "pavillions"."column_articles_feature_until_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_is_feature_idx";
    DROP INDEX IF EXISTS "pavillions"."_column_articles_v_version_version_feature_until_idx";

    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "is_feature";
    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "feature_until";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_is_feature";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_feature_until";
  `)
}
