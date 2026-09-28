import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pavillions"."market_event_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"cover_image_id" integer NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."market_event_content_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "pavillions"."market_event_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"market_event_group_id" integer NOT NULL,
  	"date_time" timestamp(3) with time zone NOT NULL,
  	"location" varchar NOT NULL,
  	"cover_image_id" integer,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."market_event_content_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"programs_id" integer
  );
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "market_event_groups_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "market_event_content_id" integer;
  ALTER TABLE "pavillions"."market_event_groups" ADD CONSTRAINT "market_event_groups_cover_image_id_column_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."market_event_content_images" ADD CONSTRAINT "market_event_content_images_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."market_event_content_images" ADD CONSTRAINT "market_event_content_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."market_event_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."market_event_content" ADD CONSTRAINT "market_event_content_market_event_group_id_market_event_groups_id_fk" FOREIGN KEY ("market_event_group_id") REFERENCES "pavillions"."market_event_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."market_event_content" ADD CONSTRAINT "market_event_content_cover_image_id_column_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."market_event_content_rels" ADD CONSTRAINT "market_event_content_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."market_event_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."market_event_content_rels" ADD CONSTRAINT "market_event_content_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "market_event_groups_slug_idx" ON "pavillions"."market_event_groups" USING btree ("slug");
  CREATE INDEX "market_event_groups_cover_image_idx" ON "pavillions"."market_event_groups" USING btree ("cover_image_id");
  CREATE INDEX "market_event_groups_updated_at_idx" ON "pavillions"."market_event_groups" USING btree ("updated_at");
  CREATE INDEX "market_event_groups_created_at_idx" ON "pavillions"."market_event_groups" USING btree ("created_at");
  CREATE INDEX "market_event_content_images_order_idx" ON "pavillions"."market_event_content_images" USING btree ("_order");
  CREATE INDEX "market_event_content_images_parent_id_idx" ON "pavillions"."market_event_content_images" USING btree ("_parent_id");
  CREATE INDEX "market_event_content_images_image_idx" ON "pavillions"."market_event_content_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "market_event_content_slug_idx" ON "pavillions"."market_event_content" USING btree ("slug");
  CREATE INDEX "market_event_content_market_event_group_idx" ON "pavillions"."market_event_content" USING btree ("market_event_group_id");
  CREATE INDEX "market_event_content_cover_image_idx" ON "pavillions"."market_event_content" USING btree ("cover_image_id");
  CREATE INDEX "market_event_content_updated_at_idx" ON "pavillions"."market_event_content" USING btree ("updated_at");
  CREATE INDEX "market_event_content_created_at_idx" ON "pavillions"."market_event_content" USING btree ("created_at");
  CREATE INDEX "market_event_content_rels_order_idx" ON "pavillions"."market_event_content_rels" USING btree ("order");
  CREATE INDEX "market_event_content_rels_parent_idx" ON "pavillions"."market_event_content_rels" USING btree ("parent_id");
  CREATE INDEX "market_event_content_rels_path_idx" ON "pavillions"."market_event_content_rels" USING btree ("path");
  CREATE INDEX "market_event_content_rels_programs_id_idx" ON "pavillions"."market_event_content_rels" USING btree ("programs_id");
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_market_event_groups_fk" FOREIGN KEY ("market_event_groups_id") REFERENCES "pavillions"."market_event_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_market_event_content_fk" FOREIGN KEY ("market_event_content_id") REFERENCES "pavillions"."market_event_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_market_event_groups_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("market_event_groups_id");
  CREATE INDEX "payload_locked_documents_rels_market_event_content_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("market_event_content_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_market_event_groups_fk";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_market_event_content_fk";
  DROP INDEX "pavillions"."payload_locked_documents_rels_market_event_groups_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_market_event_content_id_idx";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "market_event_groups_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "market_event_content_id";
  DROP TABLE "pavillions"."market_event_content_rels";
  DROP TABLE "pavillions"."market_event_content_images";
  DROP TABLE "pavillions"."market_event_content";
  DROP TABLE "pavillions"."market_event_groups";`)
}
