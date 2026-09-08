import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const englishCreditFields = ['companyProduceEn', 'producerEn', 'directorEn', 'artistEn', 'writerEn'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const field of englishCreditFields) {
    await db.execute(sql.raw(`
      ALTER TYPE "pavillions"."enum_users_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS '${field}';
      ALTER TYPE "pavillions"."enum_role_profiles_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS '${field}';
      ALTER TYPE "pavillions"."enum_user_groups_field_permissions_fields_programs" ADD VALUE IF NOT EXISTS '${field}';
    `))
  }

  await db.execute(sql`
    ALTER TABLE "pavillions"."programs" ADD COLUMN "company_produce_en" varchar;
    ALTER TABLE "pavillions"."programs" ADD COLUMN "producer_en" varchar;
    ALTER TABLE "pavillions"."programs" ADD COLUMN "director_en" varchar;
    ALTER TABLE "pavillions"."programs" ADD COLUMN "artist_en" varchar;
    ALTER TABLE "pavillions"."programs" ADD COLUMN "writer_en" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pavillions"."programs" DROP COLUMN "company_produce_en";
    ALTER TABLE "pavillions"."programs" DROP COLUMN "producer_en";
    ALTER TABLE "pavillions"."programs" DROP COLUMN "director_en";
    ALTER TABLE "pavillions"."programs" DROP COLUMN "artist_en";
    ALTER TABLE "pavillions"."programs" DROP COLUMN "writer_en";
  `)
}
