import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "pavillions"."categories_post_room_groups" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "cover_image_id" integer
  );

  CREATE TABLE "pavillions"."categories_post_room_groups_images" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer NOT NULL
  );

  INSERT INTO "pavillions"."categories_post_room_groups" ("_order", "_parent_id", "id", "title", "cover_image_id")
  SELECT
    0,
    "flat"."_parent_id",
    CONCAT('migrated-', "flat"."_parent_id")::varchar,
    'Post Room',
    "flat"."image_id"
  FROM (
    SELECT DISTINCT ON ("_parent_id") "_parent_id", "image_id"
    FROM "pavillions"."categories_post_room_images"
    ORDER BY "_parent_id", "_order"
  ) "flat";

  INSERT INTO "pavillions"."categories_post_room_groups_images" ("_order", "_parent_id", "id", "image_id")
  SELECT
    "flat"."_order",
    CONCAT('migrated-', "flat"."_parent_id")::varchar,
    CONCAT('migrated-', "flat"."id")::varchar,
    "flat"."image_id"
  FROM "pavillions"."categories_post_room_images" "flat";

  ALTER TABLE "pavillions"."categories_post_room_groups" ADD CONSTRAINT "categories_post_room_groups_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."categories_post_room_groups" ADD CONSTRAINT "categories_post_room_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."categories_post_room_groups_images" ADD CONSTRAINT "categories_post_room_groups_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."categories_post_room_groups_images" ADD CONSTRAINT "categories_post_room_groups_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."categories_post_room_groups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_post_room_groups_order_idx" ON "pavillions"."categories_post_room_groups" USING btree ("_order");
  CREATE INDEX "categories_post_room_groups_parent_id_idx" ON "pavillions"."categories_post_room_groups" USING btree ("_parent_id");
  CREATE INDEX "categories_post_room_groups_cover_image_idx" ON "pavillions"."categories_post_room_groups" USING btree ("cover_image_id");
  CREATE INDEX "categories_post_room_groups_images_order_idx" ON "pavillions"."categories_post_room_groups_images" USING btree ("_order");
  CREATE INDEX "categories_post_room_groups_images_parent_id_idx" ON "pavillions"."categories_post_room_groups_images" USING btree ("_parent_id");
  CREATE INDEX "categories_post_room_groups_images_image_idx" ON "pavillions"."categories_post_room_groups_images" USING btree ("image_id");

  DROP TABLE "pavillions"."categories_post_room_images" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "pavillions"."categories_post_room_images" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer NOT NULL
  );

  INSERT INTO "pavillions"."categories_post_room_images" ("_order", "_parent_id", "id", "image_id")
  SELECT
    "images"."_order",
    "groups"."_parent_id",
    REPLACE("images"."id", 'migrated-', '')::varchar,
    "images"."image_id"
  FROM "pavillions"."categories_post_room_groups_images" "images"
  JOIN "pavillions"."categories_post_room_groups" "groups" ON "groups"."id" = "images"."_parent_id";

  ALTER TABLE "pavillions"."categories_post_room_images" ADD CONSTRAINT "categories_post_room_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."categories_post_room_images" ADD CONSTRAINT "categories_post_room_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pavillions"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_post_room_images_order_idx" ON "pavillions"."categories_post_room_images" USING btree ("_order");
  CREATE INDEX "categories_post_room_images_parent_id_idx" ON "pavillions"."categories_post_room_images" USING btree ("_parent_id");
  CREATE INDEX "categories_post_room_images_image_idx" ON "pavillions"."categories_post_room_images" USING btree ("image_id");

  DROP TABLE IF EXISTS "pavillions"."categories_post_room_groups_images" CASCADE;
  DROP TABLE IF EXISTS "pavillions"."categories_post_room_groups" CASCADE;
  `)
}
