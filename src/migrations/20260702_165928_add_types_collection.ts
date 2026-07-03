import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "pavillions"."enum_types_icon" AS ENUM('home', 'search', 'plus', 'spark', 'film', 'screen', 'news', 'music', 'food', 'travel', 'kids', 'education');
  CREATE TABLE "pavillions"."types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"icon" "pavillions"."enum_types_icon",
  	"image_id" integer,
  	"video_id" integer,
  	"order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."types_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"programs_id" integer
  );
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "types_id" integer;
  ALTER TABLE "pavillions"."types" ADD CONSTRAINT "types_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."types" ADD CONSTRAINT "types_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "pavillions"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."types_rels" ADD CONSTRAINT "types_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."types_rels" ADD CONSTRAINT "types_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "types__order_idx" ON "pavillions"."types" USING btree ("_order");
  CREATE UNIQUE INDEX "types_slug_idx" ON "pavillions"."types" USING btree ("slug");
  CREATE INDEX "types_image_idx" ON "pavillions"."types" USING btree ("image_id");
  CREATE INDEX "types_video_idx" ON "pavillions"."types" USING btree ("video_id");
  CREATE INDEX "types_updated_at_idx" ON "pavillions"."types" USING btree ("updated_at");
  CREATE INDEX "types_created_at_idx" ON "pavillions"."types" USING btree ("created_at");
  CREATE INDEX "types_rels_order_idx" ON "pavillions"."types_rels" USING btree ("order");
  CREATE INDEX "types_rels_parent_idx" ON "pavillions"."types_rels" USING btree ("parent_id");
  CREATE INDEX "types_rels_path_idx" ON "pavillions"."types_rels" USING btree ("path");
  CREATE INDEX "types_rels_programs_id_idx" ON "pavillions"."types_rels" USING btree ("programs_id");
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "pavillions"."types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_types_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("types_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."types_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."types" CASCADE;
  DROP TABLE "pavillions"."types_rels" CASCADE;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_types_fk";
  
  DROP INDEX "pavillions"."payload_locked_documents_rels_types_id_idx";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "types_id";
  DROP TYPE "pavillions"."enum_types_icon";`)
}
