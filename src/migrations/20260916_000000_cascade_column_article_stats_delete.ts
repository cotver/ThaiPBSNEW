import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_article_stats"
      DROP CONSTRAINT IF EXISTS "column_article_stats_article_id_column_articles_id_fk";

    ALTER TABLE "pavillions"."column_article_stats"
      ADD CONSTRAINT "column_article_stats_article_id_column_articles_id_fk"
      FOREIGN KEY ("article_id") REFERENCES "pavillions"."column_articles"("id")
      ON DELETE cascade ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_article_stats"
      DROP CONSTRAINT IF EXISTS "column_article_stats_article_id_column_articles_id_fk";

    ALTER TABLE "pavillions"."column_article_stats"
      ADD CONSTRAINT "column_article_stats_article_id_column_articles_id_fk"
      FOREIGN KEY ("article_id") REFERENCES "pavillions"."column_articles"("id")
      ON DELETE set null ON UPDATE no action;
  `)
}
