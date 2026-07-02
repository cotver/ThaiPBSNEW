import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."categories" ALTER COLUMN "icon" DROP DEFAULT;
  ALTER TABLE "pavillions"."categories" ALTER COLUMN "icon" DROP NOT NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."categories" ALTER COLUMN "icon" SET DEFAULT 'film';
  ALTER TABLE "pavillions"."categories" ALTER COLUMN "icon" SET NOT NULL;`)
}
