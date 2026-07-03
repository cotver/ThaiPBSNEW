import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  SELECT setval(
    '"pavillions"."seasons_id_seq"',
    GREATEST(COALESCE((SELECT MAX("id") FROM "pavillions"."seasons"), 0), 1),
    (SELECT COUNT(*) > 0 FROM "pavillions"."seasons")
  );

  SELECT setval(
    '"pavillions"."episodes_id_seq"',
    GREATEST(COALESCE((SELECT MAX("id") FROM "pavillions"."episodes"), 0), 1),
    (SELECT COUNT(*) > 0 FROM "pavillions"."episodes")
  );
  `)
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // Sequence resync is not destructive and has no useful rollback.
}
