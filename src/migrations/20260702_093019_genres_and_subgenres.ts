import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pavillions"."genres" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."sub_genres" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"genre_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pavillions"."programs_rels" ADD COLUMN "genres_id" integer;
  ALTER TABLE "pavillions"."programs_rels" ADD COLUMN "sub_genres_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "genres_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "sub_genres_id" integer;
  ALTER TABLE "pavillions"."sub_genres" ADD CONSTRAINT "sub_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "pavillions"."genres"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "genres_name_idx" ON "pavillions"."genres" USING btree ("name");
  CREATE UNIQUE INDEX "genres_slug_idx" ON "pavillions"."genres" USING btree ("slug");
  CREATE INDEX "genres_updated_at_idx" ON "pavillions"."genres" USING btree ("updated_at");
  CREATE INDEX "genres_created_at_idx" ON "pavillions"."genres" USING btree ("created_at");
  CREATE UNIQUE INDEX "sub_genres_name_idx" ON "pavillions"."sub_genres" USING btree ("name");
  CREATE UNIQUE INDEX "sub_genres_slug_idx" ON "pavillions"."sub_genres" USING btree ("slug");
  CREATE INDEX "sub_genres_genre_idx" ON "pavillions"."sub_genres" USING btree ("genre_id");
  CREATE INDEX "sub_genres_updated_at_idx" ON "pavillions"."sub_genres" USING btree ("updated_at");
  CREATE INDEX "sub_genres_created_at_idx" ON "pavillions"."sub_genres" USING btree ("created_at");
  ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_genres_fk" FOREIGN KEY ("genres_id") REFERENCES "pavillions"."genres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_sub_genres_fk" FOREIGN KEY ("sub_genres_id") REFERENCES "pavillions"."sub_genres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_genres_fk" FOREIGN KEY ("genres_id") REFERENCES "pavillions"."genres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sub_genres_fk" FOREIGN KEY ("sub_genres_id") REFERENCES "pavillions"."sub_genres"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_rels_genres_id_idx" ON "pavillions"."programs_rels" USING btree ("genres_id");
  CREATE INDEX "programs_rels_sub_genres_id_idx" ON "pavillions"."programs_rels" USING btree ("sub_genres_id");
  CREATE INDEX "payload_locked_documents_rels_genres_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("genres_id");
  CREATE INDEX "payload_locked_documents_rels_sub_genres_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("sub_genres_id");
  INSERT INTO "pavillions"."genres" ("name", "slug")
  VALUES
    ('Drama&Sitcom', 'drama-sitcom'),
    ('Variety&Lifestyle', 'variety-lifestyle'),
    ('Documentary', 'documentary'),
    ('News&Facture', 'news-facture'),
    ('Music', 'music'),
    ('Special Program', 'special-program'),
    ('Food&Travel', 'food-travel'),
    ('Kids&Family', 'kids-family'),
    ('Animation', 'animation')
  ON CONFLICT ("slug") DO NOTHING;
  INSERT INTO "pavillions"."sub_genres" ("name", "slug")
  VALUES
    ('Agricultural&Local', 'agricultural-local'),
    ('Arts&Culture', 'arts-culture'),
    ('Knowledge&Education', 'knowledge-education'),
    ('Entertainment', 'entertainment'),
    ('Lauguage', 'lauguage'),
    ('Inspiration&People', 'inspiration-people'),
    ('Nature&Environment', 'nature-environment'),
    ('Biography', 'biography'),
    ('Pets&Animal', 'pets-animal'),
    ('Travel&Adventure', 'travel-adventure'),
    ('Health&Medical&Wellness', 'health-medical-wellness'),
    ('Political', 'political'),
    ('History', 'history'),
    ('Crime', 'crime'),
    ('Science&Technology', 'science-technology'),
    ('Senior Program', 'senior-program'),
    ('News', 'news'),
    ('Philosophy', 'philosophy')
  ON CONFLICT ("slug") DO NOTHING;
  INSERT INTO "pavillions"."programs_rels" ("order", "parent_id", "path", "genres_id")
  SELECT 0, "p"."id", 'genre', "g"."id"
  FROM "pavillions"."programs" "p"
  JOIN "pavillions"."genres" "g" ON "g"."name" = "p"."genre"::text
  WHERE "p"."genre" IS NOT NULL;
  INSERT INTO "pavillions"."programs_rels" ("order", "parent_id", "path", "sub_genres_id")
  SELECT 0, "p"."id", 'genre_sub', "sg"."id"
  FROM "pavillions"."programs" "p"
  JOIN "pavillions"."sub_genres" "sg" ON "sg"."name" = "p"."genre_sub"::text
  WHERE "p"."genre_sub" IS NOT NULL;
  ALTER TABLE "pavillions"."programs" DROP COLUMN "genre";
  ALTER TABLE "pavillions"."programs" DROP COLUMN "genre_sub";
  DROP TYPE "pavillions"."enum_programs_genre";
  DROP TYPE "pavillions"."enum_programs_genre_sub";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "pavillions"."enum_programs_genre" AS ENUM('Drama&Sitcom', 'Variety&Lifestyle', 'Documentary', 'News&Facture', 'Music', 'Special Program', 'Food&Travel', 'Kids&Family', 'Animation');
  CREATE TYPE "pavillions"."enum_programs_genre_sub" AS ENUM('Agricultural&Local', 'Arts&Culture', 'Knowledge&Education', 'Entertainment', 'Lauguage', 'Inspiration&People', 'Nature&Environment', 'Biography', 'Pets&Animal', 'Travel&Adventure', 'Health&Medical&Wellness', 'Political', 'History', 'Crime', 'Science&Technology', 'Senior Program', 'News', 'Philosophy');
  ALTER TABLE "pavillions"."programs" ADD COLUMN "genre" "pavillions"."enum_programs_genre";
  ALTER TABLE "pavillions"."programs" ADD COLUMN "genre_sub" "pavillions"."enum_programs_genre_sub";
  UPDATE "pavillions"."programs" "p"
  SET "genre" = "g"."name"::"pavillions"."enum_programs_genre"
  FROM "pavillions"."programs_rels" "pr"
  JOIN "pavillions"."genres" "g" ON "g"."id" = "pr"."genres_id"
  WHERE "pr"."parent_id" = "p"."id" AND "pr"."path" = 'genre'
    AND "g"."name" IN ('Drama&Sitcom', 'Variety&Lifestyle', 'Documentary', 'News&Facture', 'Music', 'Special Program', 'Food&Travel', 'Kids&Family', 'Animation');
  UPDATE "pavillions"."programs" "p"
  SET "genre_sub" = "sg"."name"::"pavillions"."enum_programs_genre_sub"
  FROM "pavillions"."programs_rels" "pr"
  JOIN "pavillions"."sub_genres" "sg" ON "sg"."id" = "pr"."sub_genres_id"
  WHERE "pr"."parent_id" = "p"."id" AND "pr"."path" = 'genre_sub'
    AND "sg"."name" IN ('Agricultural&Local', 'Arts&Culture', 'Knowledge&Education', 'Entertainment', 'Lauguage', 'Inspiration&People', 'Nature&Environment', 'Biography', 'Pets&Animal', 'Travel&Adventure', 'Health&Medical&Wellness', 'Political', 'History', 'Crime', 'Science&Technology', 'Senior Program', 'News', 'Philosophy');
  DELETE FROM "pavillions"."programs_rels" WHERE "path" IN ('genre', 'genre_sub');
  ALTER TABLE "pavillions"."programs_rels" DROP CONSTRAINT "programs_rels_genres_fk";
  
  ALTER TABLE "pavillions"."programs_rels" DROP CONSTRAINT "programs_rels_sub_genres_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_genres_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sub_genres_fk";
  
  DROP INDEX "pavillions"."programs_rels_genres_id_idx";
  DROP INDEX "pavillions"."programs_rels_sub_genres_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_genres_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_sub_genres_id_idx";
  ALTER TABLE "pavillions"."programs_rels" DROP COLUMN "genres_id";
  ALTER TABLE "pavillions"."programs_rels" DROP COLUMN "sub_genres_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "genres_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "sub_genres_id";
  ALTER TABLE "pavillions"."genres" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."sub_genres" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."sub_genres" CASCADE;
  DROP TABLE "pavillions"."genres" CASCADE;`)
}
