import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."types" ADD COLUMN "link" varchar;
  ALTER TABLE "pavillions"."programs_rels" ADD COLUMN "types_id" integer;
  INSERT INTO "pavillions"."programs_rels" ("order", "parent_id", "path", "types_id")
  SELECT "tr"."order", "tr"."programs_id", 'programsType', "tr"."parent_id"
  FROM "pavillions"."types_rels" "tr"
  WHERE "tr"."programs_id" IS NOT NULL;
  ALTER TABLE "pavillions"."types_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."types_rels" CASCADE;
  ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "pavillions"."types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_rels_types_id_idx" ON "pavillions"."programs_rels" USING btree ("types_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pavillions"."types_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"programs_id" integer
  );
  
  ALTER TABLE "pavillions"."programs_rels" DROP CONSTRAINT "programs_rels_types_fk";
  
  DROP INDEX "pavillions"."programs_rels_types_id_idx";
  ALTER TABLE "pavillions"."types_rels" ADD CONSTRAINT "types_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."types_rels" ADD CONSTRAINT "types_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "pavillions"."programs"("id") ON DELETE cascade ON UPDATE no action;
  INSERT INTO "pavillions"."types_rels" ("order", "parent_id", "path", "programs_id")
  SELECT "pr"."order", "pr"."types_id", 'link', "pr"."parent_id"
  FROM "pavillions"."programs_rels" "pr"
  WHERE "pr"."path" = 'programsType' AND "pr"."types_id" IS NOT NULL;
  DELETE FROM "pavillions"."programs_rels" WHERE "path" = 'programsType' AND "types_id" IS NOT NULL;
  CREATE INDEX "types_rels_order_idx" ON "pavillions"."types_rels" USING btree ("order");
  CREATE INDEX "types_rels_parent_idx" ON "pavillions"."types_rels" USING btree ("parent_id");
  CREATE INDEX "types_rels_path_idx" ON "pavillions"."types_rels" USING btree ("path");
  CREATE INDEX "types_rels_programs_id_idx" ON "pavillions"."types_rels" USING btree ("programs_id");
  ALTER TABLE "pavillions"."types" DROP COLUMN "link";
  ALTER TABLE "pavillions"."programs_rels" DROP COLUMN "types_id";`)
}
