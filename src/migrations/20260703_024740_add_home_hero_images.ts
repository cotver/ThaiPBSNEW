import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pavillions"."hero_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"eyebrow" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"year" varchar NOT NULL,
  	"rating" varchar NOT NULL,
  	"duration" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"genre" varchar NOT NULL,
  	"primary_label" varchar DEFAULT 'Play',
  	"primary_link" varchar,
  	"secondary_label" varchar DEFAULT 'Details',
  	"secondary_link" varchar,
  	"show_details" boolean DEFAULT true,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "hero_images_id" integer;
  ALTER TABLE "pavillions"."hero_images" ADD CONSTRAINT "hero_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hero_images__order_idx" ON "pavillions"."hero_images" USING btree ("_order");
  CREATE INDEX "hero_images_image_idx" ON "pavillions"."hero_images" USING btree ("image_id");
  CREATE INDEX "hero_images_updated_at_idx" ON "pavillions"."hero_images" USING btree ("updated_at");
  CREATE INDEX "hero_images_created_at_idx" ON "pavillions"."hero_images" USING btree ("created_at");
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hero_images_fk" FOREIGN KEY ("hero_images_id") REFERENCES "pavillions"."hero_images"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_hero_images_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("hero_images_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."hero_images" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."hero_images" CASCADE;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hero_images_fk";
  
  DROP INDEX "pavillions"."payload_locked_documents_rels_hero_images_id_idx";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "hero_images_id";`)
}
