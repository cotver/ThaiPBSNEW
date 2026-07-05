import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  SELECT setval(
    '"pavillions"."media_id_seq"',
    GREATEST(COALESCE((SELECT MAX("id") FROM "pavillions"."media"), 0), 1),
    (SELECT COUNT(*) > 0 FROM "pavillions"."media")
  );
  `)
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // Sequence resync is not destructive and has no useful rollback.
}
