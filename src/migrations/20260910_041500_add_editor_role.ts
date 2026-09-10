import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "pavillions"."enum_users_role" ADD VALUE IF NOT EXISTS 'editor' BEFORE 'user';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "pavillions"."users" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;
    UPDATE "pavillions"."users" SET "role" = 'user' WHERE "role" = 'editor';
    DROP TYPE "pavillions"."enum_users_role";
    CREATE TYPE "pavillions"."enum_users_role" AS ENUM('super-admin', 'user');
    ALTER TABLE "pavillions"."users" ALTER COLUMN "role" SET DATA TYPE "pavillions"."enum_users_role" USING "role"::"pavillions"."enum_users_role";
    ALTER TABLE "pavillions"."users" ALTER COLUMN "role" SET DEFAULT 'user';
  `)
}
