import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."column_categories" ADD COLUMN "show_in_page_sort_order" numeric DEFAULT 0;
    ALTER TABLE "pavillions"."column_subcategories" ADD COLUMN "show_in_page_sort_order" numeric DEFAULT 0;

    UPDATE "pavillions"."column_categories"
    SET "show_in_page_sort_order" = COALESCE("sort_order", 0);
    UPDATE "pavillions"."column_subcategories"
    SET "show_in_page_sort_order" = COALESCE("sort_order", 0);

    CREATE INDEX "column_categories_show_in_page_sort_order_idx"
      ON "pavillions"."column_categories" USING btree ("show_in_page_sort_order");
    CREATE INDEX "column_subcategories_show_in_page_sort_order_idx"
      ON "pavillions"."column_subcategories" USING btree ("show_in_page_sort_order");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pavillions"."column_categories_show_in_page_sort_order_idx";
    DROP INDEX IF EXISTS "pavillions"."column_subcategories_show_in_page_sort_order_idx";
    ALTER TABLE "pavillions"."column_categories" DROP COLUMN "show_in_page_sort_order";
    ALTER TABLE "pavillions"."column_subcategories" DROP COLUMN "show_in_page_sort_order";
  `)
}
