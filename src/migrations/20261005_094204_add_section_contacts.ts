import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "pavillions"."enum_section_contacts_section" AS ENUM('studios-hero', 'catalog', 'other-categories', 'press-releases', 'content-distribution', 'market-events', 'hero-carousel', 'brand-tiles', 'recommended', 'type-row', 'continue-watching', 'continue-programs', 'discontinued-programs', 'year-row', 'thai-programs', 'international-programs');
  CREATE TABLE "pavillions"."section_contacts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"section" "pavillions"."enum_section_contacts_section" NOT NULL,
  	"program_type_id" integer,
  	"year" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pavillions"."section_contacts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"contacts_id" integer
  );
  
  CREATE TABLE "pavillions"."contacts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"name" varchar,
  	"image_id" integer,
  	"position" varchar,
  	"phone" varchar,
  	"website" varchar,
  	"email" varchar,
  	"address" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "section_contacts_id" integer;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD COLUMN "contacts_id" integer;
  ALTER TABLE "pavillions"."section_contacts" ADD CONSTRAINT "section_contacts_program_type_id_categories_id_fk" FOREIGN KEY ("program_type_id") REFERENCES "pavillions"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavillions"."section_contacts_rels" ADD CONSTRAINT "section_contacts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "pavillions"."section_contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."section_contacts_rels" ADD CONSTRAINT "section_contacts_rels_contacts_fk" FOREIGN KEY ("contacts_id") REFERENCES "pavillions"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."contacts" ADD CONSTRAINT "contacts_image_id_column_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "pavillions"."column_media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "section_contacts_section_idx" ON "pavillions"."section_contacts" USING btree ("section");
  CREATE INDEX "section_contacts_program_type_idx" ON "pavillions"."section_contacts" USING btree ("program_type_id");
  CREATE INDEX "section_contacts_updated_at_idx" ON "pavillions"."section_contacts" USING btree ("updated_at");
  CREATE INDEX "section_contacts_created_at_idx" ON "pavillions"."section_contacts" USING btree ("created_at");
  CREATE INDEX "section_contacts_rels_order_idx" ON "pavillions"."section_contacts_rels" USING btree ("order");
  CREATE INDEX "section_contacts_rels_parent_idx" ON "pavillions"."section_contacts_rels" USING btree ("parent_id");
  CREATE INDEX "section_contacts_rels_path_idx" ON "pavillions"."section_contacts_rels" USING btree ("path");
  CREATE INDEX "section_contacts_rels_contacts_id_idx" ON "pavillions"."section_contacts_rels" USING btree ("contacts_id");
  CREATE INDEX "contacts_image_idx" ON "pavillions"."contacts" USING btree ("image_id");
  CREATE INDEX "contacts_updated_at_idx" ON "pavillions"."contacts" USING btree ("updated_at");
  CREATE INDEX "contacts_created_at_idx" ON "pavillions"."contacts" USING btree ("created_at");
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_section_contacts_fk" FOREIGN KEY ("section_contacts_id") REFERENCES "pavillions"."section_contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contacts_fk" FOREIGN KEY ("contacts_id") REFERENCES "pavillions"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_section_contacts_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("section_contacts_id");
  CREATE INDEX "payload_locked_documents_rels_contacts_id_idx" ON "pavillions"."payload_locked_documents_rels" USING btree ("contacts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavillions"."section_contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."section_contacts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavillions"."contacts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pavillions"."section_contacts" CASCADE;
  DROP TABLE "pavillions"."section_contacts_rels" CASCADE;
  DROP TABLE "pavillions"."contacts" CASCADE;
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_section_contacts_fk";
  
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contacts_fk";
  
  DROP INDEX "pavillions"."payload_locked_documents_rels_section_contacts_id_idx";
  DROP INDEX "pavillions"."payload_locked_documents_rels_contacts_id_idx";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "section_contacts_id";
  ALTER TABLE "pavillions"."payload_locked_documents_rels" DROP COLUMN "contacts_id";
  DROP TYPE "pavillions"."enum_section_contacts_section";`)
}
