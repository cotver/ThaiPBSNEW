import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "pavillions"."enum_column_articles_related_stories_kind" AS ENUM('article', 'custom');
  CREATE TYPE "pavillions"."enum__column_articles_v_version_related_stories_kind" AS ENUM('article', 'custom');
  CREATE TYPE "pavillions"."enum_column_related_stories_related_stories_kind" AS ENUM('article', 'custom');
  CREATE TABLE "pavillions"."column_articles_related_stories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "pavillions"."enum_column_articles_related_stories_kind" DEFAULT 'article',
  	"article_id" integer,
  	"title" varchar,
  	"url" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "pavillions"."_column_articles_v_version_related_stories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "pavillions"."enum__column_articles_v_version_related_stories_kind" DEFAULT 'article',
  	"article_id" integer,
  	"title" varchar,
  	"url" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "pavillions"."column_related_stories_related_stories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "pavillions"."enum_column_related_stories_related_stories_kind" DEFAULT 'article' NOT NULL,
  	"article_id" integer,
  	"title" varchar,
  	"url" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "pavillions"."column_related_stories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pavillions"."column_articles_related_stories" ADD CONSTRAINT "column_articles_related_stories_article_id_column_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_related_stories" ADD CONSTRAINT "column_articles_related_stories_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_articles_related_stories" ADD CONSTRAINT "column_articles_related_stories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_version_related_stories" ADD CONSTRAINT "_column_articles_v_version_related_stories_article_id_column_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_version_related_stories" ADD CONSTRAINT "_column_articles_v_version_related_stories_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."_column_articles_v_version_related_stories" ADD CONSTRAINT "_column_articles_v_version_related_stories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."_column_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."column_related_stories_related_stories" ADD CONSTRAINT "column_related_stories_related_stories_article_id_column_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "pavillions"."column_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_related_stories_related_stories" ADD CONSTRAINT "column_related_stories_related_stories_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."column_related_stories_related_stories" ADD CONSTRAINT "column_related_stories_related_stories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."column_related_stories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "column_articles_related_stories_order_idx" ON "pavillions"."column_articles_related_stories" USING btree ("_order");
  CREATE INDEX "column_articles_related_stories_parent_id_idx" ON "pavillions"."column_articles_related_stories" USING btree ("_parent_id");
  CREATE INDEX "column_articles_related_stories_article_idx" ON "pavillions"."column_articles_related_stories" USING btree ("article_id");
  CREATE INDEX "column_articles_related_stories_image_idx" ON "pavillions"."column_articles_related_stories" USING btree ("image_id");
  CREATE INDEX "_column_articles_v_version_related_stories_order_idx" ON "pavillions"."_column_articles_v_version_related_stories" USING btree ("_order");
  CREATE INDEX "_column_articles_v_version_related_stories_parent_id_idx" ON "pavillions"."_column_articles_v_version_related_stories" USING btree ("_parent_id");
  CREATE INDEX "_column_articles_v_version_related_stories_article_idx" ON "pavillions"."_column_articles_v_version_related_stories" USING btree ("article_id");
  CREATE INDEX "_column_articles_v_version_related_stories_image_idx" ON "pavillions"."_column_articles_v_version_related_stories" USING btree ("image_id");
  CREATE INDEX "column_related_stories_related_stories_order_idx" ON "pavillions"."column_related_stories_related_stories" USING btree ("_order");
  CREATE INDEX "column_related_stories_related_stories_parent_id_idx" ON "pavillions"."column_related_stories_related_stories" USING btree ("_parent_id");
  CREATE INDEX "column_related_stories_related_stories_article_idx" ON "pavillions"."column_related_stories_related_stories" USING btree ("article_id");
  CREATE INDEX "column_related_stories_related_stories_image_idx" ON "pavillions"."column_related_stories_related_stories" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pavillions"."column_articles_related_stories" CASCADE;
  DROP TABLE "pavillions"."_column_articles_v_version_related_stories" CASCADE;
  DROP TABLE "pavillions"."column_related_stories_related_stories" CASCADE;
  DROP TABLE "pavillions"."column_related_stories" CASCADE;
  DROP TYPE "pavillions"."enum_column_articles_related_stories_kind";
  DROP TYPE "pavillions"."enum__column_articles_v_version_related_stories_kind";
  DROP TYPE "pavillions"."enum_column_related_stories_related_stories_kind";`)
}
