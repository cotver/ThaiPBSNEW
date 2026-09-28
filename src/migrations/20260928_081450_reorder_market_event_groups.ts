import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { generateNKeysBetween } from 'payload/shared'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."market_event_groups" ADD COLUMN "_order" varchar;
  CREATE INDEX "market_event_groups__order_idx" ON "pavillions"."market_event_groups" USING btree ("_order");`)

  const existing = await db.execute(sql`SELECT id FROM "pavillions"."market_event_groups" ORDER BY "order", id`)
  const keys = generateNKeysBetween(null, null, existing.rows.length)
  for (const [index, row] of existing.rows.entries()) {
    await db.execute(sql`UPDATE "pavillions"."market_event_groups" SET "_order" = ${keys[index]} WHERE id = ${row.id}`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    WITH ranked AS (
      SELECT id, row_number() OVER (ORDER BY "_order" NULLS LAST, id) - 1 AS position
      FROM "pavillions"."market_event_groups"
    )
    UPDATE "pavillions"."market_event_groups" AS groups
    SET "order" = ranked.position
    FROM ranked WHERE groups.id = ranked.id;
  `)
  await db.execute(sql`
   DROP INDEX "pavillions"."market_event_groups__order_idx";
  ALTER TABLE "pavillions"."market_event_groups" DROP COLUMN "_order";`)
}
