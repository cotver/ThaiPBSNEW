import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."categories" ADD COLUMN "_order" varchar;
  CREATE INDEX "categories__order_idx" ON "pavillions"."categories" USING btree ("_order");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pavillions"."categories__order_idx";
  ALTER TABLE "pavillions"."categories" DROP COLUMN "_order";`)
}
