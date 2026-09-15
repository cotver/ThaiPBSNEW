import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "pavillions"."article_p_d_f" (
      "id" serial PRIMARY KEY NOT NULL,
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

    ALTER TABLE "pavillions"."column_articles" ADD COLUMN "article_p_d_f_id" integer;
    ALTER TABLE "pavillions"."_column_articles_v" ADD COLUMN "version_article_p_d_f_id" integer;
    ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "article_p_d_f_id" integer;

    CREATE INDEX "article_p_d_f_updated_at_idx"
      ON "pavillions"."article_p_d_f" USING btree ("updated_at");
    CREATE INDEX "article_p_d_f_created_at_idx"
      ON "pavillions"."article_p_d_f" USING btree ("created_at");
    CREATE UNIQUE INDEX "article_p_d_f_filename_idx"
      ON "pavillions"."article_p_d_f" USING btree ("filename");

    ALTER TABLE "pavillions"."column_articles"
      ADD CONSTRAINT "column_articles_article_p_d_f_id_article_p_d_f_id_fk"
      FOREIGN KEY ("article_p_d_f_id") REFERENCES "pavillions"."article_p_d_f"("id")
      ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pavillions"."_column_articles_v"
      ADD CONSTRAINT "_column_articles_v_version_article_p_d_f_id_article_p_d_f_id_fk"
      FOREIGN KEY ("version_article_p_d_f_id") REFERENCES "pavillions"."article_p_d_f"("id")
      ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pavillions"."payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_article_p_d_f_fk"
      FOREIGN KEY ("article_p_d_f_id") REFERENCES "pavillions"."article_p_d_f"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "column_articles_article_p_d_f_idx"
      ON "pavillions"."column_articles" USING btree ("article_p_d_f_id");
    CREATE INDEX "_column_articles_v_version_version_article_p_d_f_idx"
      ON "pavillions"."_column_articles_v" USING btree ("version_article_p_d_f_id");
    CREATE INDEX "payload_locked_documents_rels_article_p_d_f_id_idx"
      ON "pavillions"."payload_locked_documents_rels" USING btree ("article_p_d_f_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_articles"
      DROP CONSTRAINT "column_articles_article_p_d_f_id_article_p_d_f_id_fk";
    ALTER TABLE "pavillions"."_column_articles_v"
      DROP CONSTRAINT "_column_articles_v_version_article_p_d_f_id_article_p_d_f_id_fk";
    ALTER TABLE "pavillions"."payload_locked_documents_rels"
      DROP CONSTRAINT "payload_locked_documents_rels_article_p_d_f_fk";

    DROP INDEX "pavillions"."column_articles_article_p_d_f_idx";
    DROP INDEX "pavillions"."_column_articles_v_version_version_article_p_d_f_idx";
    DROP INDEX "pavillions"."payload_locked_documents_rels_article_p_d_f_id_idx";
    DROP INDEX "pavillions"."article_p_d_f_updated_at_idx";
    DROP INDEX "pavillions"."article_p_d_f_created_at_idx";
    DROP INDEX "pavillions"."article_p_d_f_filename_idx";

    ALTER TABLE "pavillions"."column_articles" DROP COLUMN "article_p_d_f_id";
    ALTER TABLE "pavillions"."_column_articles_v" DROP COLUMN "version_article_p_d_f_id";
    ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "article_p_d_f_id";
    DROP TABLE "pavillions"."article_p_d_f";
  `)
}
