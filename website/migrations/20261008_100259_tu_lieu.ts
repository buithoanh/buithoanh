import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cam_nang_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_cam_nang_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "dich_vu_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_dich_vu_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "cam_nang_texts" ADD CONSTRAINT "cam_nang_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cam_nang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cam_nang_v_texts" ADD CONSTRAINT "_cam_nang_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cam_nang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dich_vu_texts" ADD CONSTRAINT "dich_vu_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dich_vu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dich_vu_v_texts" ADD CONSTRAINT "_dich_vu_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_dich_vu_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cam_nang_texts_order_parent" ON "cam_nang_texts" USING btree ("order","parent_id");
  CREATE INDEX "_cam_nang_v_texts_order_parent" ON "_cam_nang_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "dich_vu_texts_order_parent" ON "dich_vu_texts" USING btree ("order","parent_id");
  CREATE INDEX "_dich_vu_v_texts_order_parent" ON "_dich_vu_v_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cam_nang_texts" CASCADE;
  DROP TABLE "_cam_nang_v_texts" CASCADE;
  DROP TABLE "dich_vu_texts" CASCADE;
  DROP TABLE "_dich_vu_v_texts" CASCADE;`)
}
