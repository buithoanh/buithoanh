import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_don_hang_quyen_loi_mien_di_lai" AS ENUM('hoiVien', 'banMoi', 'luotGioiThieu');
  CREATE TYPE "public"."enum_bao_gia_hang_muc_quyen_loi" AS ENUM('kichNo', 'vaLop');
  CREATE TYPE "public"."enum_goi_hoi_vien_mien_di_lai_kieu" AS ENUM('khong', 'soLan', 'khongGioiHan');
  CREATE TYPE "public"."enum_goi_hoi_vien_mien_kich_no_kieu" AS ENUM('khong', 'soLan', 'khongGioiHan');
  CREATE TYPE "public"."enum_goi_hoi_vien_mien_va_lop_kieu" AS ENUM('khong', 'soLan', 'khongGioiHan');
  CREATE TYPE "public"."enum_hoi_vien_trang_thai" AS ENUM('choThanhToan', 'hieuLuc', 'hetHan', 'huy');
  CREATE TYPE "public"."enum_yeu_cau_doanh_nghiep_loai_xe" AS ENUM('4-5-cho', '7-cho', 'dien', 'ban-tai-van', 'nhieu-loai');
  CREATE TYPE "public"."enum_yeu_cau_doanh_nghiep_loai_doi_xe" AS ENUM('taxi', 'thue', 'cty');
  CREATE TYPE "public"."enum_yeu_cau_doanh_nghiep_trang_thai" AS ENUM('moi', 'dangTuVan', 'daBaoGia', 'daKy', 'khongThanh');
  CREATE TYPE "public"."enum_hang_muc_gia_quyen_loi_hoi_vien" AS ENUM('kichNo', 'vaLop');
  CREATE TYPE "public"."enum_ho_so_tho_dung_cu" AS ENUM('obd', 'kich', 'acquy', 'sung', 'bom', 'va', 'cole', 'xe');
  CREATE TYPE "public"."enum_ho_so_tho_nam_kinh_nghiem" AS ENUM('2-3', '4-5', '6-10', 'tren-10');
  CREATE TYPE "public"."enum_ho_so_tho_trang_thai" AS ENUM('moi', 'daGoi', 'henKiemTra', 'daNhan', 'khongDat');
  ALTER TYPE "public"."enum_giao_dich_ket_qua" ADD VALUE 'hoiVienThieu';
  CREATE TABLE "goi_hoi_vien" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"gia_nam" numeric NOT NULL,
  	"nhan" varchar,
  	"thu_tu" numeric DEFAULT 0,
  	"dang_ban" boolean DEFAULT true,
  	"mien_di_lai_kieu" "enum_goi_hoi_vien_mien_di_lai_kieu" DEFAULT 'khong' NOT NULL,
  	"mien_di_lai_so_lan" numeric,
  	"mien_kich_no_kieu" "enum_goi_hoi_vien_mien_kich_no_kieu" DEFAULT 'khong' NOT NULL,
  	"mien_kich_no_so_lan" numeric,
  	"mien_va_lop_kieu" "enum_goi_hoi_vien_mien_va_lop_kieu" DEFAULT 'khong' NOT NULL,
  	"mien_va_lop_so_lan" numeric,
  	"giam_cong_phan_tram" numeric DEFAULT 0,
  	"uu_tien_goi_gap" boolean,
  	"loi_ich" varchar,
  	"ghi_chu" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hoi_vien" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar,
  	"bien_so" varchar NOT NULL,
  	"goi_id" integer NOT NULL,
  	"ten_goi" varchar,
  	"ho_ten" varchar,
  	"sdt" varchar NOT NULL,
  	"ma_gioi_thieu" varchar,
  	"gioi_thieu_id" integer,
  	"trang_thai" "enum_hoi_vien_trang_thai" DEFAULT 'choThanhToan' NOT NULL,
  	"bat_dau_luc" timestamp(3) with time zone,
  	"het_han_luc" timestamp(3) with time zone,
  	"quyen_loi_so_tien" numeric,
  	"quyen_loi_giam_cong_phan_tram" numeric,
  	"quyen_loi_uu_tien_goi_gap" boolean,
  	"quyen_loi_mien_di_lai_so_lan" numeric,
  	"quyen_loi_mien_kich_no_so_lan" numeric,
  	"quyen_loi_mien_va_lop_so_lan" numeric,
  	"thanh_toan_da_nhan" numeric DEFAULT 0,
  	"thanh_toan_ma_giao_dich" varchar,
  	"thanh_toan_thanh_toan_luc" timestamp(3) with time zone,
  	"dong_y_luc" timestamp(3) with time zone,
  	"nhac_gia_han_luc" timestamp(3) with time zone,
  	"token" varchar,
  	"ghi_chu" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "yeu_cau_doanh_nghiep" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar,
  	"ten_cong_ty" varchar NOT NULL,
  	"mst" varchar,
  	"dia_chi" varchar,
  	"so_xe" numeric NOT NULL,
  	"loai_xe" "enum_yeu_cau_doanh_nghiep_loai_xe",
  	"loai_doi_xe" "enum_yeu_cau_doanh_nghiep_loai_doi_xe",
  	"khu_vuc" jsonb,
  	"nguoi_lien_he" varchar NOT NULL,
  	"sdt" varchar NOT NULL,
  	"email" varchar,
  	"ghi_chu" varchar,
  	"trang_thai" "enum_yeu_cau_doanh_nghiep_trang_thai" DEFAULT 'moi',
  	"phu_trach_id" integer,
  	"dong_y_luc" timestamp(3) with time zone,
  	"ghi_chu_noi_bo" varchar,
  	"nguon" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ma_gioi_thieu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar NOT NULL,
  	"sdt" varchar NOT NULL,
  	"ho_ten" varchar,
  	"so_luot_mo" numeric DEFAULT 0,
  	"luot_thuong_them" numeric DEFAULT 0,
  	"tam_dung" boolean,
  	"token" varchar,
  	"ghi_chu" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ho_so_tho_dung_cu" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_ho_so_tho_dung_cu",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ho_so_tho" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar,
  	"ho_ten" varchar NOT NULL,
  	"sdt" varchar NOT NULL,
  	"nam_kinh_nghiem" "enum_ho_so_tho_nam_kinh_nghiem",
  	"khu_vuc" jsonb,
  	"ghi_chu" varchar,
  	"trang_thai" "enum_ho_so_tho_trang_thai" DEFAULT 'moi',
  	"dong_y_luc" timestamp(3) with time zone,
  	"ghi_chu_noi_bo" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ho_so_tho_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tep_ho_so_id" integer
  );
  
  CREATE TABLE "tep_ho_so" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ho_so_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "don_hang" ADD COLUMN "gioi_thieu_id" integer;
  ALTER TABLE "don_hang" ADD COLUMN "gioi_thieu_ap_dung" boolean;
  ALTER TABLE "don_hang" ADD COLUMN "hoi_vien_id" integer;
  ALTER TABLE "don_hang" ADD COLUMN "quyen_loi_mien_di_lai" "enum_don_hang_quyen_loi_mien_di_lai";
  ALTER TABLE "don_hang" ADD COLUMN "quyen_loi_kich_no" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "quyen_loi_va_lop" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "quyen_loi_giam_hoi_vien" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "quyen_loi_giam_ma" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "quyen_loi_uu_tien_hoi_vien" boolean;
  ALTER TABLE "bao_gia_hang_muc" ADD COLUMN "hang_muc_gia_id" integer;
  ALTER TABLE "bao_gia_hang_muc" ADD COLUMN "quyen_loi" "enum_bao_gia_hang_muc_quyen_loi";
  ALTER TABLE "giao_dich" ADD COLUMN "hoi_vien_id" integer;
  ALTER TABLE "tin_nhan" ADD COLUMN "lien_quan" varchar;
  ALTER TABLE "hang_muc_gia" ADD COLUMN "quyen_loi_hoi_vien" "enum_hang_muc_gia_quyen_loi_hoi_vien";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "goi_hoi_vien_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hoi_vien_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "yeu_cau_doanh_nghiep_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ma_gioi_thieu_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ho_so_tho_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tep_ho_so_id" integer;
  ALTER TABLE "cai_dat" ADD COLUMN "sales_b2_b_ten" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "sales_b2_b_sdt" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "sales_b2_b_email" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "sales_b2_b_cam_ket" varchar DEFAULT 'Sales doanh nghiệp sẽ liên hệ trong 1 giờ làm việc (8h–17h30, thứ 2 đến thứ 7).';
  ALTER TABLE "cai_dat" ADD COLUMN "ho_so_nang_luc_url" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "nhan_su_ten" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "nhan_su_sdt" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "nhan_su_zalo" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "nhan_su_email" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "nhan_su_cam_ket" varchar DEFAULT 'Bộ phận nhân sự sẽ gọi cho bạn trong 2 ngày làm việc để hẹn lịch kiểm tra tay nghề.';
  ALTER TABLE "hoi_vien" ADD CONSTRAINT "hoi_vien_goi_id_goi_hoi_vien_id_fk" FOREIGN KEY ("goi_id") REFERENCES "public"."goi_hoi_vien"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hoi_vien" ADD CONSTRAINT "hoi_vien_gioi_thieu_id_ma_gioi_thieu_id_fk" FOREIGN KEY ("gioi_thieu_id") REFERENCES "public"."ma_gioi_thieu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "yeu_cau_doanh_nghiep" ADD CONSTRAINT "yeu_cau_doanh_nghiep_phu_trach_id_users_id_fk" FOREIGN KEY ("phu_trach_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ho_so_tho_dung_cu" ADD CONSTRAINT "ho_so_tho_dung_cu_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ho_so_tho"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ho_so_tho_rels" ADD CONSTRAINT "ho_so_tho_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ho_so_tho"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ho_so_tho_rels" ADD CONSTRAINT "ho_so_tho_rels_tep_ho_so_fk" FOREIGN KEY ("tep_ho_so_id") REFERENCES "public"."tep_ho_so"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tep_ho_so" ADD CONSTRAINT "tep_ho_so_ho_so_id_ho_so_tho_id_fk" FOREIGN KEY ("ho_so_id") REFERENCES "public"."ho_so_tho"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "goi_hoi_vien_slug_idx" ON "goi_hoi_vien" USING btree ("slug");
  CREATE INDEX "goi_hoi_vien_updated_at_idx" ON "goi_hoi_vien" USING btree ("updated_at");
  CREATE INDEX "goi_hoi_vien_created_at_idx" ON "goi_hoi_vien" USING btree ("created_at");
  CREATE UNIQUE INDEX "hoi_vien_ma_idx" ON "hoi_vien" USING btree ("ma");
  CREATE INDEX "hoi_vien_bien_so_idx" ON "hoi_vien" USING btree ("bien_so");
  CREATE INDEX "hoi_vien_goi_idx" ON "hoi_vien" USING btree ("goi_id");
  CREATE INDEX "hoi_vien_sdt_idx" ON "hoi_vien" USING btree ("sdt");
  CREATE INDEX "hoi_vien_gioi_thieu_idx" ON "hoi_vien" USING btree ("gioi_thieu_id");
  CREATE INDEX "hoi_vien_trang_thai_idx" ON "hoi_vien" USING btree ("trang_thai");
  CREATE INDEX "hoi_vien_bat_dau_luc_idx" ON "hoi_vien" USING btree ("bat_dau_luc");
  CREATE INDEX "hoi_vien_het_han_luc_idx" ON "hoi_vien" USING btree ("het_han_luc");
  CREATE INDEX "hoi_vien_token_idx" ON "hoi_vien" USING btree ("token");
  CREATE INDEX "hoi_vien_updated_at_idx" ON "hoi_vien" USING btree ("updated_at");
  CREATE INDEX "hoi_vien_created_at_idx" ON "hoi_vien" USING btree ("created_at");
  CREATE UNIQUE INDEX "yeu_cau_doanh_nghiep_ma_idx" ON "yeu_cau_doanh_nghiep" USING btree ("ma");
  CREATE INDEX "yeu_cau_doanh_nghiep_mst_idx" ON "yeu_cau_doanh_nghiep" USING btree ("mst");
  CREATE INDEX "yeu_cau_doanh_nghiep_trang_thai_idx" ON "yeu_cau_doanh_nghiep" USING btree ("trang_thai");
  CREATE INDEX "yeu_cau_doanh_nghiep_phu_trach_idx" ON "yeu_cau_doanh_nghiep" USING btree ("phu_trach_id");
  CREATE INDEX "yeu_cau_doanh_nghiep_updated_at_idx" ON "yeu_cau_doanh_nghiep" USING btree ("updated_at");
  CREATE INDEX "yeu_cau_doanh_nghiep_created_at_idx" ON "yeu_cau_doanh_nghiep" USING btree ("created_at");
  CREATE UNIQUE INDEX "ma_gioi_thieu_ma_idx" ON "ma_gioi_thieu" USING btree ("ma");
  CREATE UNIQUE INDEX "ma_gioi_thieu_sdt_idx" ON "ma_gioi_thieu" USING btree ("sdt");
  CREATE INDEX "ma_gioi_thieu_token_idx" ON "ma_gioi_thieu" USING btree ("token");
  CREATE INDEX "ma_gioi_thieu_updated_at_idx" ON "ma_gioi_thieu" USING btree ("updated_at");
  CREATE INDEX "ma_gioi_thieu_created_at_idx" ON "ma_gioi_thieu" USING btree ("created_at");
  CREATE INDEX "ho_so_tho_dung_cu_order_idx" ON "ho_so_tho_dung_cu" USING btree ("order");
  CREATE INDEX "ho_so_tho_dung_cu_parent_idx" ON "ho_so_tho_dung_cu" USING btree ("parent_id");
  CREATE UNIQUE INDEX "ho_so_tho_ma_idx" ON "ho_so_tho" USING btree ("ma");
  CREATE INDEX "ho_so_tho_sdt_idx" ON "ho_so_tho" USING btree ("sdt");
  CREATE INDEX "ho_so_tho_trang_thai_idx" ON "ho_so_tho" USING btree ("trang_thai");
  CREATE INDEX "ho_so_tho_updated_at_idx" ON "ho_so_tho" USING btree ("updated_at");
  CREATE INDEX "ho_so_tho_created_at_idx" ON "ho_so_tho" USING btree ("created_at");
  CREATE INDEX "ho_so_tho_rels_order_idx" ON "ho_so_tho_rels" USING btree ("order");
  CREATE INDEX "ho_so_tho_rels_parent_idx" ON "ho_so_tho_rels" USING btree ("parent_id");
  CREATE INDEX "ho_so_tho_rels_path_idx" ON "ho_so_tho_rels" USING btree ("path");
  CREATE INDEX "ho_so_tho_rels_tep_ho_so_id_idx" ON "ho_so_tho_rels" USING btree ("tep_ho_so_id");
  CREATE INDEX "tep_ho_so_ho_so_idx" ON "tep_ho_so" USING btree ("ho_so_id");
  CREATE INDEX "tep_ho_so_updated_at_idx" ON "tep_ho_so" USING btree ("updated_at");
  CREATE INDEX "tep_ho_so_created_at_idx" ON "tep_ho_so" USING btree ("created_at");
  CREATE UNIQUE INDEX "tep_ho_so_filename_idx" ON "tep_ho_so" USING btree ("filename");
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_gioi_thieu_id_ma_gioi_thieu_id_fk" FOREIGN KEY ("gioi_thieu_id") REFERENCES "public"."ma_gioi_thieu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_hoi_vien_id_hoi_vien_id_fk" FOREIGN KEY ("hoi_vien_id") REFERENCES "public"."hoi_vien"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bao_gia_hang_muc" ADD CONSTRAINT "bao_gia_hang_muc_hang_muc_gia_id_hang_muc_gia_id_fk" FOREIGN KEY ("hang_muc_gia_id") REFERENCES "public"."hang_muc_gia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "giao_dich" ADD CONSTRAINT "giao_dich_hoi_vien_id_hoi_vien_id_fk" FOREIGN KEY ("hoi_vien_id") REFERENCES "public"."hoi_vien"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_goi_hoi_vien_fk" FOREIGN KEY ("goi_hoi_vien_id") REFERENCES "public"."goi_hoi_vien"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hoi_vien_fk" FOREIGN KEY ("hoi_vien_id") REFERENCES "public"."hoi_vien"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_yeu_cau_doanh_nghiep_fk" FOREIGN KEY ("yeu_cau_doanh_nghiep_id") REFERENCES "public"."yeu_cau_doanh_nghiep"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ma_gioi_thieu_fk" FOREIGN KEY ("ma_gioi_thieu_id") REFERENCES "public"."ma_gioi_thieu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ho_so_tho_fk" FOREIGN KEY ("ho_so_tho_id") REFERENCES "public"."ho_so_tho"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tep_ho_so_fk" FOREIGN KEY ("tep_ho_so_id") REFERENCES "public"."tep_ho_so"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "don_hang_gioi_thieu_idx" ON "don_hang" USING btree ("gioi_thieu_id");
  CREATE INDEX "don_hang_hoi_vien_idx" ON "don_hang" USING btree ("hoi_vien_id");
  CREATE INDEX "don_hang_quyen_loi_quyen_loi_mien_di_lai_idx" ON "don_hang" USING btree ("quyen_loi_mien_di_lai");
  CREATE INDEX "bao_gia_hang_muc_hang_muc_gia_idx" ON "bao_gia_hang_muc" USING btree ("hang_muc_gia_id");
  CREATE INDEX "giao_dich_hoi_vien_idx" ON "giao_dich" USING btree ("hoi_vien_id");
  CREATE INDEX "tin_nhan_lien_quan_idx" ON "tin_nhan" USING btree ("lien_quan");
  CREATE INDEX "payload_locked_documents_rels_goi_hoi_vien_id_idx" ON "payload_locked_documents_rels" USING btree ("goi_hoi_vien_id");
  CREATE INDEX "payload_locked_documents_rels_hoi_vien_id_idx" ON "payload_locked_documents_rels" USING btree ("hoi_vien_id");
  CREATE INDEX "payload_locked_documents_rels_yeu_cau_doanh_nghiep_id_idx" ON "payload_locked_documents_rels" USING btree ("yeu_cau_doanh_nghiep_id");
  CREATE INDEX "payload_locked_documents_rels_ma_gioi_thieu_id_idx" ON "payload_locked_documents_rels" USING btree ("ma_gioi_thieu_id");
  CREATE INDEX "payload_locked_documents_rels_ho_so_tho_id_idx" ON "payload_locked_documents_rels" USING btree ("ho_so_tho_id");
  CREATE INDEX "payload_locked_documents_rels_tep_ho_so_id_idx" ON "payload_locked_documents_rels" USING btree ("tep_ho_so_id");
  CREATE SEQUENCE IF NOT EXISTS ma_so_hv START 1;
  CREATE SEQUENCE IF NOT EXISTS ma_so_dn START 1;
  CREATE SEQUENCE IF NOT EXISTS ma_so_th START 1;
  UPDATE "hang_muc_gia" SET "quyen_loi_hoi_vien" = 'kichNo' WHERE "ten" = 'Kích nổ tại chỗ' AND "quyen_loi_hoi_vien" IS NULL;
  UPDATE "hang_muc_gia" SET "quyen_loi_hoi_vien" = 'vaLop' WHERE "ten" = 'Vá lốp không săm' AND "quyen_loi_hoi_vien" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "goi_hoi_vien" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hoi_vien" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "yeu_cau_doanh_nghiep" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ma_gioi_thieu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ho_so_tho_dung_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ho_so_tho" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ho_so_tho_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tep_ho_so" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "goi_hoi_vien" CASCADE;
  DROP TABLE "hoi_vien" CASCADE;
  DROP TABLE "yeu_cau_doanh_nghiep" CASCADE;
  DROP TABLE "ma_gioi_thieu" CASCADE;
  DROP TABLE "ho_so_tho_dung_cu" CASCADE;
  DROP TABLE "ho_so_tho" CASCADE;
  DROP TABLE "ho_so_tho_rels" CASCADE;
  DROP TABLE "tep_ho_so" CASCADE;
  ALTER TABLE "don_hang" DROP CONSTRAINT IF EXISTS "don_hang_gioi_thieu_id_ma_gioi_thieu_id_fk";
  
  ALTER TABLE "don_hang" DROP CONSTRAINT IF EXISTS "don_hang_hoi_vien_id_hoi_vien_id_fk";
  
  ALTER TABLE "bao_gia_hang_muc" DROP CONSTRAINT IF EXISTS "bao_gia_hang_muc_hang_muc_gia_id_hang_muc_gia_id_fk";
  
  ALTER TABLE "giao_dich" DROP CONSTRAINT IF EXISTS "giao_dich_hoi_vien_id_hoi_vien_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_goi_hoi_vien_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hoi_vien_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_yeu_cau_doanh_nghiep_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ma_gioi_thieu_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ho_so_tho_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tep_ho_so_fk";
  
  ALTER TABLE "giao_dich" ALTER COLUMN "ket_qua" SET DATA TYPE text;
  UPDATE "giao_dich" SET "ket_qua" = 'hoiVien' WHERE "ket_qua" = 'hoiVienThieu';
  DROP TYPE "public"."enum_giao_dich_ket_qua";
  CREATE TYPE "public"."enum_giao_dich_ket_qua" AS ENUM('du', 'thieu', 'khongThayDon', 'trung', 'hoiVien');
  ALTER TABLE "giao_dich" ALTER COLUMN "ket_qua" SET DATA TYPE "public"."enum_giao_dich_ket_qua" USING "ket_qua"::"public"."enum_giao_dich_ket_qua";
  DROP INDEX "don_hang_gioi_thieu_idx";
  DROP INDEX "don_hang_hoi_vien_idx";
  DROP INDEX "don_hang_quyen_loi_quyen_loi_mien_di_lai_idx";
  DROP INDEX "bao_gia_hang_muc_hang_muc_gia_idx";
  DROP INDEX "giao_dich_hoi_vien_idx";
  DROP INDEX "tin_nhan_lien_quan_idx";
  DROP INDEX "payload_locked_documents_rels_goi_hoi_vien_id_idx";
  DROP INDEX "payload_locked_documents_rels_hoi_vien_id_idx";
  DROP INDEX "payload_locked_documents_rels_yeu_cau_doanh_nghiep_id_idx";
  DROP INDEX "payload_locked_documents_rels_ma_gioi_thieu_id_idx";
  DROP INDEX "payload_locked_documents_rels_ho_so_tho_id_idx";
  DROP INDEX "payload_locked_documents_rels_tep_ho_so_id_idx";
  ALTER TABLE "don_hang" DROP COLUMN "gioi_thieu_id";
  ALTER TABLE "don_hang" DROP COLUMN "gioi_thieu_ap_dung";
  ALTER TABLE "don_hang" DROP COLUMN "hoi_vien_id";
  ALTER TABLE "don_hang" DROP COLUMN "quyen_loi_mien_di_lai";
  ALTER TABLE "don_hang" DROP COLUMN "quyen_loi_kich_no";
  ALTER TABLE "don_hang" DROP COLUMN "quyen_loi_va_lop";
  ALTER TABLE "don_hang" DROP COLUMN "quyen_loi_giam_hoi_vien";
  ALTER TABLE "don_hang" DROP COLUMN "quyen_loi_giam_ma";
  ALTER TABLE "don_hang" DROP COLUMN "quyen_loi_uu_tien_hoi_vien";
  ALTER TABLE "bao_gia_hang_muc" DROP COLUMN "hang_muc_gia_id";
  ALTER TABLE "bao_gia_hang_muc" DROP COLUMN "quyen_loi";
  ALTER TABLE "giao_dich" DROP COLUMN "hoi_vien_id";
  ALTER TABLE "tin_nhan" DROP COLUMN "lien_quan";
  ALTER TABLE "hang_muc_gia" DROP COLUMN "quyen_loi_hoi_vien";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "goi_hoi_vien_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hoi_vien_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "yeu_cau_doanh_nghiep_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ma_gioi_thieu_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ho_so_tho_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tep_ho_so_id";
  ALTER TABLE "cai_dat" DROP COLUMN "sales_b2_b_ten";
  ALTER TABLE "cai_dat" DROP COLUMN "sales_b2_b_sdt";
  ALTER TABLE "cai_dat" DROP COLUMN "sales_b2_b_email";
  ALTER TABLE "cai_dat" DROP COLUMN "sales_b2_b_cam_ket";
  ALTER TABLE "cai_dat" DROP COLUMN "ho_so_nang_luc_url";
  ALTER TABLE "cai_dat" DROP COLUMN "nhan_su_ten";
  ALTER TABLE "cai_dat" DROP COLUMN "nhan_su_sdt";
  ALTER TABLE "cai_dat" DROP COLUMN "nhan_su_zalo";
  ALTER TABLE "cai_dat" DROP COLUMN "nhan_su_email";
  ALTER TABLE "cai_dat" DROP COLUMN "nhan_su_cam_ket";
  DROP TYPE "public"."enum_don_hang_quyen_loi_mien_di_lai";
  DROP TYPE "public"."enum_bao_gia_hang_muc_quyen_loi";
  DROP TYPE "public"."enum_goi_hoi_vien_mien_di_lai_kieu";
  DROP TYPE "public"."enum_goi_hoi_vien_mien_kich_no_kieu";
  DROP TYPE "public"."enum_goi_hoi_vien_mien_va_lop_kieu";
  DROP TYPE "public"."enum_hoi_vien_trang_thai";
  DROP TYPE "public"."enum_yeu_cau_doanh_nghiep_loai_xe";
  DROP TYPE "public"."enum_yeu_cau_doanh_nghiep_loai_doi_xe";
  DROP TYPE "public"."enum_yeu_cau_doanh_nghiep_trang_thai";
  DROP TYPE "public"."enum_hang_muc_gia_quyen_loi_hoi_vien";
  DROP TYPE "public"."enum_ho_so_tho_dung_cu";
  DROP TYPE "public"."enum_ho_so_tho_nam_kinh_nghiem";
  DROP TYPE "public"."enum_ho_so_tho_trang_thai";
  DROP SEQUENCE IF EXISTS ma_so_hv;
  DROP SEQUENCE IF EXISTS ma_so_dn;
  DROP SEQUENCE IF EXISTS ma_so_th;`)
}
