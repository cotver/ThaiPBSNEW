import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_categories" ADD COLUMN "show_in_page" boolean DEFAULT true;
    ALTER TABLE "pavillions"."column_subcategories" ADD COLUMN "show_in_page" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_categories" DROP COLUMN "show_in_page";
    ALTER TABLE "pavillions"."column_subcategories" DROP COLUMN "show_in_page";
  `)
}
