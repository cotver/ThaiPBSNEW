import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."programs" ALTER COLUMN "target_group" SET DATA TYPE numeric USING (
    CASE
      WHEN "target_group"::text LIKE '%3-6%' THEN 3
      WHEN "target_group"::text LIKE '%7-12%' THEN 7
      WHEN "target_group"::text LIKE '%13-17%' THEN 13
      WHEN "target_group"::text LIKE '%18-24%' THEN 18
      WHEN "target_group"::text LIKE '%25-34%' THEN 25
      WHEN "target_group"::text LIKE '%35-44%' THEN 35
      WHEN "target_group"::text LIKE '%45-54%' THEN 45
      WHEN "target_group"::text LIKE '%55%' THEN 55
      ELSE NULL
    END
   );
  DROP TYPE "pavillions"."enum_programs_target_group";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "pavillions"."enum_programs_target_group" AS ENUM(
    'age_3_6',
    'age_7_12',
    'age_13_17',
    'age_18_24',
    'age_25_34',
    'age_35_44',
    'age_45_54',
    'age_55_plus'
  );
  ALTER TABLE "pavillions"."programs" ALTER COLUMN "target_group" SET DATA TYPE "pavillions"."enum_programs_target_group" USING (
    CASE
      WHEN "target_group" >= 55 THEN 'age_55_plus'
      WHEN "target_group" >= 45 THEN 'age_45_54'
      WHEN "target_group" >= 35 THEN 'age_35_44'
      WHEN "target_group" >= 25 THEN 'age_25_34'
      WHEN "target_group" >= 18 THEN 'age_18_24'
      WHEN "target_group" >= 13 THEN 'age_13_17'
      WHEN "target_group" >= 7 THEN 'age_7_12'
      WHEN "target_group" >= 3 THEN 'age_3_6'
      ELSE NULL
    END::"pavillions"."enum_programs_target_group"
  );`)
}
