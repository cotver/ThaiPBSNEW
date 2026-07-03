import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pavillions"."programs" ADD COLUMN "is_continue" boolean;
  ALTER TYPE "pavillions"."enum_users_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS 'is_continue';
  ALTER TYPE "pavillions"."enum_role_profiles_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS 'is_continue';
  ALTER TYPE "pavillions"."enum_user_groups_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS 'is_continue';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pavillions"."programs" DROP COLUMN "is_continue";
  `)
}
