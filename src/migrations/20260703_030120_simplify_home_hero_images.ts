import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pavillions"."hero_images_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"genres_id" integer,
  	"sub_genres_id" integer
  );
  
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "eyebrow" DROP NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "year" DROP NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "rating" DROP NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "duration" DROP NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "description" DROP NOT NULL;
  ALTER TABLE "pavillions"."hero_images_rels" ADD CONSTRAINT "hero_images_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."hero_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."hero_images_rels" ADD CONSTRAINT "hero_images_rels_genres_fk" FOREIGN KEY ("genres_id") REFERENCES "pavillions"."genres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."hero_images_rels" ADD CONSTRAINT "hero_images_rels_sub_genres_fk" FOREIGN KEY ("sub_genres_id") REFERENCES "pavillions"."sub_genres"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hero_images_rels_order_idx" ON "pavillions"."hero_images_rels" USING btree ("order");
  CREATE INDEX "hero_images_rels_parent_idx" ON "pavillions"."hero_images_rels" USING btree ("parent_id");
  CREATE INDEX "hero_images_rels_path_idx" ON "pavillions"."hero_images_rels" USING btree ("path");
  CREATE INDEX "hero_images_rels_genres_id_idx" ON "pavillions"."hero_images_rels" USING btree ("genres_id");
  CREATE INDEX "hero_images_rels_sub_genres_id_idx" ON "pavillions"."hero_images_rels" USING btree ("sub_genres_id");
  ALTER TABLE "pavillions"."hero_images" DROP COLUMN "genre";
  ALTER TABLE "pavillions"."hero_images" DROP COLUMN "primary_label";
  ALTER TABLE "pavillions"."hero_images" DROP COLUMN "primary_link";
  ALTER TABLE "pavillions"."hero_images" DROP COLUMN "secondary_label";
  ALTER TABLE "pavillions"."hero_images" DROP COLUMN "secondary_link";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."hero_images_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."hero_images_rels" CASCADE;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "eyebrow" SET NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "year" SET NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "rating" SET NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "duration" SET NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ALTER COLUMN "description" SET NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ADD COLUMN "genre" varchar NOT NULL;
  ALTER TABLE "pavillions"."hero_images" ADD COLUMN "primary_label" varchar DEFAULT 'Play';
  ALTER TABLE "pavillions"."hero_images" ADD COLUMN "primary_link" varchar;
  ALTER TABLE "pavillions"."hero_images" ADD COLUMN "secondary_label" varchar DEFAULT 'Details';
  ALTER TABLE "pavillions"."hero_images" ADD COLUMN "secondary_link" varchar;`)
}
