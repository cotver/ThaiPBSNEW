import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."programs_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "pavillions"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "programs_rels_categories_id_idx" ON "pavillions"."programs_rels" USING btree ("categories_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."programs_rels" DROP CONSTRAINT "programs_rels_categories_fk";
  
  DROP INDEX "pavillions"."programs_rels_categories_id_idx";
  ALTER TABLE "pavillions"."programs_rels" DROP COLUMN "categories_id";`)
}
