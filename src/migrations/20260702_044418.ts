import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "pavillions"."enum_categories_icon" AS ENUM('home', 'search', 'plus', 'spark', 'film', 'screen', 'news', 'music', 'food', 'travel', 'kids', 'education');
  CREATE TABLE "pavillions"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"icon" "pavillions"."enum_categories_icon" DEFAULT 'film' NOT NULL,
  	"image_id" integer,
  	"video_id" integer,
  	"order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "pavillions"."categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."categories" ADD CONSTRAINT "categories_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "categories_slug_idx" ON "pavillions"."categories" USING btree ("slug");
  CREATE INDEX "categories_image_idx" ON "pavillions"."categories" USING btree ("image_id");
  CREATE INDEX "categories_video_idx" ON "pavillions"."categories" USING btree ("video_id");
  CREATE INDEX "categories_updated_at_idx" ON "pavillions"."categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "pavillions"."categories" USING btree ("created_at");
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "pavillions"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("categories_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."categories" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."categories" CASCADE;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  DROP INDEX "pavillions"."payload_locked_documents_rels_categories_id_idx";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "categories_id";
  DROP TYPE "pavillions"."enum_categories_icon";`)
}
