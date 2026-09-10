import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const creditCollections = ['producers', 'directors', 'artists', 'writers'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const collection of creditCollections) {
    await db.execute(sql.raw(`
      CREATE TABLE "pavillions"."${collection}" (
        "id" serial PRIMARY KEY NOT NULL,
        "image_id" integer,
        "name" varchar NOT NULL,
        "name_th" varchar,
        "name_en" varchar,
        "description_th" varchar,
        "description_en" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
      ALTER TABLE "pavillions"."${collection}" ADD CONSTRAINT "${collection}_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "pavillions"."media"("id") ON DELETE set null ON UPDATE no action;
      CREATE INDEX "${collection}_image_idx" ON "pavillions"."${collection}" USING btree ("image_id");
      CREATE INDEX "${collection}_name_idx" ON "pavillions"."${collection}" USING btree ("name");
      CREATE INDEX "${collection}_updated_at_idx" ON "pavillions"."${collection}" USING btree ("updated_at");
      CREATE INDEX "${collection}_created_at_idx" ON "pavillions"."${collection}" USING btree ("created_at");

      ALTER TABLE "pavillions"."programs_rels" ADD COLUMN "${collection}_id" integer;
      ALTER TABLE "pavillions"."programs_rels" ADD CONSTRAINT "programs_rels_${collection}_fk"
        FOREIGN KEY ("${collection}_id") REFERENCES "pavillions"."${collection}"("id") ON DELETE cascade ON UPDATE no action;
      CREATE INDEX "programs_rels_${collection}_id_idx" ON "pavillions"."programs_rels" USING btree ("${collection}_id");

      ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "${collection}_id" integer;
      ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_${collection}_fk"
        FOREIGN KEY ("${collection}_id") REFERENCES "pavillions"."${collection}"("id") ON DELETE cascade ON UPDATE no action;
      CREATE INDEX "payload_locked_documents_rels_${collection}_id_idx"
        ON "pavillions"."payload_locked_documents_rels" USING btree ("${collection}_id");

    `))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const collection of [...creditCollections].reverse()) {
    await db.execute(sql.raw(`
      ALTER TABLE "pavillions"."programs_rels" DROP CONSTRAINT IF EXISTS "programs_rels_${collection}_fk";
      ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_${collection}_fk";
      ALTER TABLE "pavillions"."programs_rels" DROP COLUMN IF EXISTS "${collection}_id";
      ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "${collection}_id";
      DROP TABLE IF EXISTS "pavillions"."${collection}" CASCADE;
    `))
  }

  // PostgreSQL enum values cannot be removed safely in-place. The extra permission
  // values are harmless after rollback and are reused if this migration is reapplied.
}
