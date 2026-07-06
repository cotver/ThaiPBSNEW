import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pavillions"."categories" ADD COLUMN "show_header_section" boolean DEFAULT true;
  ALTER TABLE "pavillions"."categories" ADD COLUMN "show_title" boolean DEFAULT true;
  ALTER TABLE "pavillions"."categories" ADD COLUMN "post_room" boolean DEFAULT false;

  CREATE TABLE "pavillions"."categories_post_room_images" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer NOT NULL
  );

  ALTER TABLE "pavillions"."categories_post_room_images" ADD CONSTRAINT "categories_post_room_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."categories_post_room_images" ADD CONSTRAINT "categories_post_room_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_post_room_images_order_idx" ON "pavillions"."categories_post_room_images" USING btree ("_order");
  CREATE INDEX "categories_post_room_images_parent_id_idx" ON "pavillions"."categories_post_room_images" USING btree ("_parent_id");
  CREATE INDEX "categories_post_room_images_image_idx" ON "pavillions"."categories_post_room_images" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "pavillions"."categories_post_room_images" CASCADE;
  ALTER TABLE "pavillions"."categories" DROP COLUMN IF EXISTS "post_room";
  ALTER TABLE "pavillions"."categories" DROP COLUMN IF EXISTS "show_title";
  ALTER TABLE "pavillions"."categories" DROP COLUMN IF EXISTS "show_header_section";
  `)
}
