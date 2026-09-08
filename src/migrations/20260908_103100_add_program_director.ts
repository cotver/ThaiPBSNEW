import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "pavillions"."enum_users_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS 'director';
    ALTER TYPE "pavillions"."enum_role_profiles_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS 'director';
    ALTER TYPE "pavillions"."enum_user_groups_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS 'director';

    ALTER TABLE "pavillions"."programs" ADD COLUMN "director" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."programs" DROP COLUMN "director";
  `)
}
