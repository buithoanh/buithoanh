import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bang_gia_chung" ADD COLUMN "cam_ket_khong_sua_duoc_mien_phi" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bang_gia_chung" DROP COLUMN "cam_ket_khong_sua_duoc_mien_phi";`)
}
