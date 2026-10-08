import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Mã đơn TT-000123 tuần tự (lib/ma-so.ts)
  CREATE SEQUENCE IF NOT EXISTS "ma_so_tt" START 1;
   CREATE TYPE "public"."enum_don_hang_lich_su_trang_thai_trang_thai" AS ENUM('daNhan', 'daXepTho', 'thoDangDen', 'choDuyetBaoGia', 'dangSua', 'choThanhToan', 'hoanThanh', 'huy');
  CREATE TYPE "public"."enum_don_hang_loai" AS ENUM('datLich', 'khanCap');
  CREATE TYPE "public"."enum_don_hang_trang_thai" AS ENUM('daNhan', 'daXepTho', 'thoDangDen', 'choDuyetBaoGia', 'dangSua', 'choThanhToan', 'hoanThanh', 'huy');
  CREATE TYPE "public"."enum_don_hang_gia_so_bo_trang_thai" AS ENUM('coGia', 'coVanGoiLai', 'chuaChon');
  CREATE TYPE "public"."enum_don_hang_xe_phan_khuc" AS ENUM('A', 'B', 'C', 'D');
  CREATE TYPE "public"."enum_don_hang_vi_tri_cho_do" AS ENUM('nha', 'ham', 'bai', 'duong');
  CREATE TYPE "public"."enum_tep_don_hang_loai" AS ENUM('anh', 'video');
  CREATE TYPE "public"."enum_danh_gia_nguon" AS ENUM('google', 'zalo', 'web', 'khac');
  CREATE TYPE "public"."enum_hang_muc_gia_loai" AS ENUM('cong', 'phuTung');
  CREATE TYPE "public"."enum_hang_muc_gia_bao_gia_so_bo" AS ENUM('khong', 'luonCo', 'coThe');
  CREATE TYPE "public"."enum_hang_muc_gia_nguon_gia" AS ENUM('tay', 'vcparts');
  CREATE TYPE "public"."enum_hang_xe_nguon" AS ENUM('tay', 'vcparts');
  CREATE TYPE "public"."enum_dong_xe_phan_khuc" AS ENUM('A', 'B', 'C', 'D');
  CREATE TYPE "public"."enum_dong_xe_goi_y_phan_khuc" AS ENUM('A', 'B', 'C', 'D');
  CREATE TYPE "public"."enum_dong_xe_nguon" AS ENUM('tay', 'vcparts');
  CREATE TYPE "public"."enum_bang_gia_chung_phan_khuc_ma" AS ENUM('A', 'B', 'C', 'D');
  CREATE TYPE "public"."enum_lich_nhan_don_khung_gio_ngay_trong_tuan" AS ENUM('T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN');
  CREATE TABLE "don_hang_lich_su_trang_thai" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"trang_thai" "enum_don_hang_lich_su_trang_thai_trang_thai",
  	"luc" timestamp(3) with time zone,
  	"boi" varchar,
  	"ghi_chu" varchar
  );
  
  CREATE TABLE "don_hang" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar,
  	"loai" "enum_don_hang_loai" DEFAULT 'datLich' NOT NULL,
  	"uu_tien" numeric DEFAULT 0,
  	"trang_thai" "enum_don_hang_trang_thai" DEFAULT 'daNhan' NOT NULL,
  	"ghi_chu_noi_bo" varchar,
  	"su_co" varchar,
  	"trieu_chung" varchar,
  	"khung_gio_ngay" varchar,
  	"khung_gio_ma" varchar,
  	"khung_gio_nhan" varchar,
  	"khung_gio_bat_dau_luc" timestamp(3) with time zone,
  	"gia_so_bo_trang_thai" "enum_don_hang_gia_so_bo_trang_thai",
  	"gia_so_bo_tu" numeric,
  	"gia_so_bo_den" numeric,
  	"gia_so_bo_phan_khuc" varchar,
  	"gia_so_bo_dong" jsonb,
  	"xe_hang_id" integer,
  	"xe_dong_id" integer,
  	"xe_ten_xe" varchar,
  	"xe_doi" numeric,
  	"xe_bien_so" varchar,
  	"xe_so_km" numeric,
  	"xe_phan_khuc" "enum_don_hang_xe_phan_khuc",
  	"vi_tri_dia_chi" varchar,
  	"vi_tri_lat" numeric,
  	"vi_tri_lng" numeric,
  	"vi_tri_quan_id" integer,
  	"vi_tri_phuong" varchar,
  	"vi_tri_trong_vung" boolean,
  	"vi_tri_eta_tu" numeric,
  	"vi_tri_eta_den" numeric,
  	"vi_tri_cho_do" "enum_don_hang_vi_tri_cho_do",
  	"vi_tri_ghi_chu_cho_tho" varchar,
  	"khach_ho_ten" varchar,
  	"khach_sdt" varchar NOT NULL,
  	"hoa_don_can" boolean,
  	"hoa_don_mst" varchar,
  	"hoa_don_ten_cong_ty" varchar,
  	"hoa_don_dia_chi" varchar,
  	"hoa_don_email" varchar,
  	"ma_gioi_thieu" varchar,
  	"ma_khuyen_mai" varchar,
  	"dong_y_dong_y_xu_ly_du_lieu" boolean DEFAULT false NOT NULL,
  	"dong_y_dong_y_luc" timestamp(3) with time zone,
  	"dong_y_nhac_bao_duong_zalo" boolean,
  	"nguon_kenh" varchar,
  	"nguon_utm_source" varchar,
  	"nguon_utm_medium" varchar,
  	"nguon_utm_campaign" varchar,
  	"nguon_ma_q_r" varchar,
  	"nguon_trang_vao" varchar,
  	"nguon_referrer" varchar,
  	"tich_hop_dieu_phoi_id" varchar,
  	"tich_hop_gui_dieu_phoi_luc" timestamp(3) with time zone,
  	"tich_hop_loi_dieu_phoi" varchar,
  	"tich_hop_xac_nhan_kenh" varchar,
  	"tich_hop_xac_nhan_luc" timestamp(3) with time zone,
  	"tich_hop_loi_thong_bao" varchar,
  	"token_theo_doi" varchar,
  	"ket_thuc_luc" timestamp(3) with time zone,
  	"het_han_link_luc" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "don_hang_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"danh_muc_dich_vu_id" integer,
  	"tep_don_hang_id" integer
  );
  
  CREATE TABLE "tep_don_hang" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"don_hang_id" integer,
  	"loai" "enum_tep_don_hang_loai",
  	"thoi_luong_giay" numeric,
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
  
  CREATE TABLE "danh_gia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"noi_dung" varchar NOT NULL,
  	"ten_hien_thi" varchar NOT NULL,
  	"so_sao" numeric DEFAULT 5 NOT NULL,
  	"ngay" timestamp(3) with time zone NOT NULL,
  	"quan_id" integer NOT NULL,
  	"phuong" varchar,
  	"dich_vu_id" integer,
  	"nguon" "enum_danh_gia_nguon" DEFAULT 'google',
  	"don_hang_id" integer,
  	"hien_thi" boolean DEFAULT true,
  	"du_lieu_mau" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "danh_muc_dich_vu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar NOT NULL,
  	"ten" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"mo_ta_ngan" varchar,
  	"ghi_chu_bang_gia" varchar,
  	"nut_keu_goi" varchar,
  	"thoi_gian_lam" varchar,
  	"thu_tu" numeric DEFAULT 99,
  	"nhan_dat_lich" boolean DEFAULT true,
  	"bao_gia_so_bo" boolean DEFAULT true,
  	"hien_tren_bang_gia" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hang_muc_gia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"dich_vu_id" integer NOT NULL,
  	"ten" varchar NOT NULL,
  	"loai" "enum_hang_muc_gia_loai" DEFAULT 'cong' NOT NULL,
  	"gia" numeric,
  	"don_vi" varchar,
  	"gia_phan_khuc_a_tu" numeric,
  	"gia_phan_khuc_a_den" numeric,
  	"gia_phan_khuc_b_tu" numeric,
  	"gia_phan_khuc_b_den" numeric,
  	"gia_phan_khuc_c_tu" numeric,
  	"gia_phan_khuc_c_den" numeric,
  	"gia_phan_khuc_d_tu" numeric,
  	"gia_phan_khuc_d_den" numeric,
  	"ghi_chu" varchar,
  	"bao_gia_so_bo" "enum_hang_muc_gia_bao_gia_so_bo" DEFAULT 'khong',
  	"nguon_gia" "enum_hang_muc_gia_nguon_gia" DEFAULT 'tay',
  	"thu_tu" numeric DEFAULT 99,
  	"noi_bat" boolean DEFAULT false,
  	"ten_ngan" varchar,
  	"ly_do_doi" varchar,
  	"cap_nhat_gia_luc" timestamp(3) with time zone,
  	"cap_nhat_gia_boi" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nhat_ky_gia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mo_ta" varchar NOT NULL,
  	"hang_muc_id" integer,
  	"dich_vu_id" integer,
  	"gia_cu" varchar,
  	"gia_moi" varchar,
  	"ly_do" varchar,
  	"nguoi_id" integer,
  	"ten_nguoi" varchar,
  	"vai_tro" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hang_xe" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"thu_tu" numeric DEFAULT 99,
  	"ma_v_cparts" varchar,
  	"nguon" "enum_hang_xe_nguon" DEFAULT 'tay',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "dong_xe" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hang_id" integer NOT NULL,
  	"ten" varchar NOT NULL,
  	"ten_day_du" varchar,
  	"slug" varchar,
  	"phan_khuc" "enum_dong_xe_phan_khuc",
  	"goi_y_phan_khuc" "enum_dong_xe_goi_y_phan_khuc",
  	"can_gan" boolean,
  	"doi_tu" numeric,
  	"doi_den" numeric,
  	"xe_dien" boolean,
  	"ma_v_cparts" varchar,
  	"nguon" "enum_dong_xe_nguon" DEFAULT 'tay',
  	"dong_bo_luc" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quan" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"thanh_pho" varchar DEFAULT 'Hà Nội',
  	"eta_tu" numeric NOT NULL,
  	"eta_den" numeric NOT NULL,
  	"ghi_chu" varchar,
  	"ranh_gioi" jsonb,
  	"dang_phuc_vu" boolean DEFAULT true,
  	"thu_tu" numeric DEFAULT 99,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "phuong" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quan_id" integer NOT NULL,
  	"ten" varchar NOT NULL,
  	"dang_phuc_vu" boolean DEFAULT true,
  	"ghi_chu" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bang_gia_chung_phan_khuc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ma" "enum_bang_gia_chung_phan_khuc_ma" NOT NULL,
  	"ten_ngan" varchar NOT NULL,
  	"mo_ta" varchar NOT NULL
  );
  
  CREATE TABLE "bang_gia_chung" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phi_di_lai" numeric NOT NULL,
  	"phi_kiem_tra" numeric NOT NULL,
  	"bao_hanh_phu_tung_thang" numeric NOT NULL,
  	"bao_hanh_cong_thang" numeric NOT NULL,
  	"cam_ket_cuu_ho_phut" numeric NOT NULL,
  	"co_van_goi_lai_phut" numeric NOT NULL,
  	"ly_do_doi" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "lich_nhan_don_khung_gio_ngay_trong_tuan" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_lich_nhan_don_khung_gio_ngay_trong_tuan",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lich_nhan_don_khung_gio" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ma" varchar NOT NULL,
  	"bat_dau" varchar NOT NULL,
  	"ket_thuc" varchar NOT NULL,
  	"so_don_toi_da" numeric DEFAULT 4 NOT NULL
  );
  
  CREATE TABLE "lich_nhan_don_ngay_nghi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ngay" timestamp(3) with time zone NOT NULL,
  	"ten" varchar
  );
  
  CREATE TABLE "lich_nhan_don" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"gio_nhan_gap_tu" varchar DEFAULT '06:00' NOT NULL,
  	"gio_nhan_gap_den" varchar DEFAULT '22:00' NOT NULL,
  	"so_ngay_dat_truoc" numeric DEFAULT 4,
  	"phut_chuan_bi" numeric DEFAULT 60,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cai_dat_su_co_khan_cap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ma" varchar NOT NULL,
  	"ten" varchar NOT NULL,
  	"mo_ta" varchar,
  	"dich_vu_id" integer
  );
  
  ALTER TABLE "dat_lich" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cai_dat_khu_vuc" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "dat_lich" CASCADE;
  DROP TABLE "cai_dat_khu_vuc" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_dat_lich_fk";
  
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DEFAULT 'bienTap'::text;
  -- Vai trò "Duyệt bài" cũ đổi thành "Quản lý dịch vụ" (cùng quyền duyệt, đăng bài; thêm quyền sửa giá)
  UPDATE "users" SET "vai_tro" = 'quanLyDichVu' WHERE "vai_tro" = 'duyetBai';
  DROP TYPE "public"."enum_users_vai_tro";
  CREATE TYPE "public"."enum_users_vai_tro" AS ENUM('quanTri', 'quanLyDichVu', 'bienTap', 'marketing', 'dieuPhoi');
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DEFAULT 'bienTap'::"public"."enum_users_vai_tro";
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DATA TYPE "public"."enum_users_vai_tro" USING "vai_tro"::"public"."enum_users_vai_tro";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_dat_lich_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "don_hang_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tep_don_hang_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "danh_gia_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "danh_muc_dich_vu_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hang_muc_gia_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "nhat_ky_gia_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hang_xe_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "dong_xe_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quan_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "phuong_id" integer;
  ALTER TABLE "cai_dat" ADD COLUMN "zalo_oa_id" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "chinh_sach_du_lieu" varchar DEFAULT '/chinh-sach-du-lieu/';
  ALTER TABLE "cai_dat" ADD COLUMN "phap_nhan" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "mst" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "da_thong_bao_bo_cong_thuong" boolean;
  ALTER TABLE "cai_dat" ADD COLUMN "dia_chi" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "google_danh_gia_url" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "diem_google" numeric;
  ALTER TABLE "cai_dat" ADD COLUMN "so_danh_gia_google" numeric;
  ALTER TABLE "don_hang_lich_su_trang_thai" ADD CONSTRAINT "don_hang_lich_su_trang_thai_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."don_hang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_xe_hang_id_hang_xe_id_fk" FOREIGN KEY ("xe_hang_id") REFERENCES "public"."hang_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_xe_dong_id_dong_xe_id_fk" FOREIGN KEY ("xe_dong_id") REFERENCES "public"."dong_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_vi_tri_quan_id_quan_id_fk" FOREIGN KEY ("vi_tri_quan_id") REFERENCES "public"."quan"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "don_hang_rels" ADD CONSTRAINT "don_hang_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."don_hang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "don_hang_rels" ADD CONSTRAINT "don_hang_rels_danh_muc_dich_vu_fk" FOREIGN KEY ("danh_muc_dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "don_hang_rels" ADD CONSTRAINT "don_hang_rels_tep_don_hang_fk" FOREIGN KEY ("tep_don_hang_id") REFERENCES "public"."tep_don_hang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tep_don_hang" ADD CONSTRAINT "tep_don_hang_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "danh_gia" ADD CONSTRAINT "danh_gia_quan_id_quan_id_fk" FOREIGN KEY ("quan_id") REFERENCES "public"."quan"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "danh_gia" ADD CONSTRAINT "danh_gia_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "danh_gia" ADD CONSTRAINT "danh_gia_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hang_muc_gia" ADD CONSTRAINT "hang_muc_gia_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nhat_ky_gia" ADD CONSTRAINT "nhat_ky_gia_hang_muc_id_hang_muc_gia_id_fk" FOREIGN KEY ("hang_muc_id") REFERENCES "public"."hang_muc_gia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nhat_ky_gia" ADD CONSTRAINT "nhat_ky_gia_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "nhat_ky_gia" ADD CONSTRAINT "nhat_ky_gia_nguoi_id_users_id_fk" FOREIGN KEY ("nguoi_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dong_xe" ADD CONSTRAINT "dong_xe_hang_id_hang_xe_id_fk" FOREIGN KEY ("hang_id") REFERENCES "public"."hang_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "phuong" ADD CONSTRAINT "phuong_quan_id_quan_id_fk" FOREIGN KEY ("quan_id") REFERENCES "public"."quan"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bang_gia_chung_phan_khuc" ADD CONSTRAINT "bang_gia_chung_phan_khuc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bang_gia_chung"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lich_nhan_don_khung_gio_ngay_trong_tuan" ADD CONSTRAINT "lich_nhan_don_khung_gio_ngay_trong_tuan_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lich_nhan_don_khung_gio"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lich_nhan_don_khung_gio" ADD CONSTRAINT "lich_nhan_don_khung_gio_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lich_nhan_don"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lich_nhan_don_ngay_nghi" ADD CONSTRAINT "lich_nhan_don_ngay_nghi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lich_nhan_don"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cai_dat_su_co_khan_cap" ADD CONSTRAINT "cai_dat_su_co_khan_cap_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cai_dat_su_co_khan_cap" ADD CONSTRAINT "cai_dat_su_co_khan_cap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cai_dat"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "don_hang_lich_su_trang_thai_order_idx" ON "don_hang_lich_su_trang_thai" USING btree ("_order");
  CREATE INDEX "don_hang_lich_su_trang_thai_parent_id_idx" ON "don_hang_lich_su_trang_thai" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "don_hang_ma_idx" ON "don_hang" USING btree ("ma");
  CREATE INDEX "don_hang_uu_tien_idx" ON "don_hang" USING btree ("uu_tien");
  CREATE INDEX "don_hang_trang_thai_idx" ON "don_hang" USING btree ("trang_thai");
  CREATE INDEX "don_hang_khung_gio_khung_gio_ngay_idx" ON "don_hang" USING btree ("khung_gio_ngay");
  CREATE INDEX "don_hang_xe_xe_hang_idx" ON "don_hang" USING btree ("xe_hang_id");
  CREATE INDEX "don_hang_xe_xe_dong_idx" ON "don_hang" USING btree ("xe_dong_id");
  CREATE INDEX "don_hang_xe_xe_bien_so_idx" ON "don_hang" USING btree ("xe_bien_so");
  CREATE INDEX "don_hang_vi_tri_vi_tri_quan_idx" ON "don_hang" USING btree ("vi_tri_quan_id");
  CREATE INDEX "don_hang_khach_khach_sdt_idx" ON "don_hang" USING btree ("khach_sdt");
  CREATE INDEX "don_hang_ma_gioi_thieu_idx" ON "don_hang" USING btree ("ma_gioi_thieu");
  CREATE INDEX "don_hang_ma_khuyen_mai_idx" ON "don_hang" USING btree ("ma_khuyen_mai");
  CREATE INDEX "don_hang_nguon_nguon_kenh_idx" ON "don_hang" USING btree ("nguon_kenh");
  CREATE UNIQUE INDEX "don_hang_token_theo_doi_idx" ON "don_hang" USING btree ("token_theo_doi");
  CREATE INDEX "don_hang_updated_at_idx" ON "don_hang" USING btree ("updated_at");
  CREATE INDEX "don_hang_created_at_idx" ON "don_hang" USING btree ("created_at");
  CREATE INDEX "don_hang_rels_order_idx" ON "don_hang_rels" USING btree ("order");
  CREATE INDEX "don_hang_rels_parent_idx" ON "don_hang_rels" USING btree ("parent_id");
  CREATE INDEX "don_hang_rels_path_idx" ON "don_hang_rels" USING btree ("path");
  CREATE INDEX "don_hang_rels_danh_muc_dich_vu_id_idx" ON "don_hang_rels" USING btree ("danh_muc_dich_vu_id");
  CREATE INDEX "don_hang_rels_tep_don_hang_id_idx" ON "don_hang_rels" USING btree ("tep_don_hang_id");
  CREATE INDEX "tep_don_hang_don_hang_idx" ON "tep_don_hang" USING btree ("don_hang_id");
  CREATE INDEX "tep_don_hang_updated_at_idx" ON "tep_don_hang" USING btree ("updated_at");
  CREATE INDEX "tep_don_hang_created_at_idx" ON "tep_don_hang" USING btree ("created_at");
  CREATE UNIQUE INDEX "tep_don_hang_filename_idx" ON "tep_don_hang" USING btree ("filename");
  CREATE INDEX "danh_gia_quan_idx" ON "danh_gia" USING btree ("quan_id");
  CREATE INDEX "danh_gia_dich_vu_idx" ON "danh_gia" USING btree ("dich_vu_id");
  CREATE INDEX "danh_gia_don_hang_idx" ON "danh_gia" USING btree ("don_hang_id");
  CREATE INDEX "danh_gia_updated_at_idx" ON "danh_gia" USING btree ("updated_at");
  CREATE INDEX "danh_gia_created_at_idx" ON "danh_gia" USING btree ("created_at");
  CREATE UNIQUE INDEX "danh_muc_dich_vu_ma_idx" ON "danh_muc_dich_vu" USING btree ("ma");
  CREATE UNIQUE INDEX "danh_muc_dich_vu_slug_idx" ON "danh_muc_dich_vu" USING btree ("slug");
  CREATE INDEX "danh_muc_dich_vu_updated_at_idx" ON "danh_muc_dich_vu" USING btree ("updated_at");
  CREATE INDEX "danh_muc_dich_vu_created_at_idx" ON "danh_muc_dich_vu" USING btree ("created_at");
  CREATE INDEX "hang_muc_gia_dich_vu_idx" ON "hang_muc_gia" USING btree ("dich_vu_id");
  CREATE INDEX "hang_muc_gia_updated_at_idx" ON "hang_muc_gia" USING btree ("updated_at");
  CREATE INDEX "hang_muc_gia_created_at_idx" ON "hang_muc_gia" USING btree ("created_at");
  CREATE INDEX "nhat_ky_gia_hang_muc_idx" ON "nhat_ky_gia" USING btree ("hang_muc_id");
  CREATE INDEX "nhat_ky_gia_dich_vu_idx" ON "nhat_ky_gia" USING btree ("dich_vu_id");
  CREATE INDEX "nhat_ky_gia_nguoi_idx" ON "nhat_ky_gia" USING btree ("nguoi_id");
  CREATE INDEX "nhat_ky_gia_updated_at_idx" ON "nhat_ky_gia" USING btree ("updated_at");
  CREATE INDEX "nhat_ky_gia_created_at_idx" ON "nhat_ky_gia" USING btree ("created_at");
  CREATE UNIQUE INDEX "hang_xe_ten_idx" ON "hang_xe" USING btree ("ten");
  CREATE UNIQUE INDEX "hang_xe_slug_idx" ON "hang_xe" USING btree ("slug");
  CREATE INDEX "hang_xe_ma_v_cparts_idx" ON "hang_xe" USING btree ("ma_v_cparts");
  CREATE INDEX "hang_xe_updated_at_idx" ON "hang_xe" USING btree ("updated_at");
  CREATE INDEX "hang_xe_created_at_idx" ON "hang_xe" USING btree ("created_at");
  CREATE INDEX "dong_xe_hang_idx" ON "dong_xe" USING btree ("hang_id");
  CREATE INDEX "dong_xe_ten_day_du_idx" ON "dong_xe" USING btree ("ten_day_du");
  CREATE UNIQUE INDEX "dong_xe_slug_idx" ON "dong_xe" USING btree ("slug");
  CREATE INDEX "dong_xe_can_gan_idx" ON "dong_xe" USING btree ("can_gan");
  CREATE INDEX "dong_xe_ma_v_cparts_idx" ON "dong_xe" USING btree ("ma_v_cparts");
  CREATE INDEX "dong_xe_updated_at_idx" ON "dong_xe" USING btree ("updated_at");
  CREATE INDEX "dong_xe_created_at_idx" ON "dong_xe" USING btree ("created_at");
  CREATE UNIQUE INDEX "quan_ten_idx" ON "quan" USING btree ("ten");
  CREATE UNIQUE INDEX "quan_slug_idx" ON "quan" USING btree ("slug");
  CREATE INDEX "quan_updated_at_idx" ON "quan" USING btree ("updated_at");
  CREATE INDEX "quan_created_at_idx" ON "quan" USING btree ("created_at");
  CREATE INDEX "phuong_quan_idx" ON "phuong" USING btree ("quan_id");
  CREATE INDEX "phuong_updated_at_idx" ON "phuong" USING btree ("updated_at");
  CREATE INDEX "phuong_created_at_idx" ON "phuong" USING btree ("created_at");
  CREATE INDEX "bang_gia_chung_phan_khuc_order_idx" ON "bang_gia_chung_phan_khuc" USING btree ("_order");
  CREATE INDEX "bang_gia_chung_phan_khuc_parent_id_idx" ON "bang_gia_chung_phan_khuc" USING btree ("_parent_id");
  CREATE INDEX "lich_nhan_don_khung_gio_ngay_trong_tuan_order_idx" ON "lich_nhan_don_khung_gio_ngay_trong_tuan" USING btree ("order");
  CREATE INDEX "lich_nhan_don_khung_gio_ngay_trong_tuan_parent_idx" ON "lich_nhan_don_khung_gio_ngay_trong_tuan" USING btree ("parent_id");
  CREATE INDEX "lich_nhan_don_khung_gio_order_idx" ON "lich_nhan_don_khung_gio" USING btree ("_order");
  CREATE INDEX "lich_nhan_don_khung_gio_parent_id_idx" ON "lich_nhan_don_khung_gio" USING btree ("_parent_id");
  CREATE INDEX "lich_nhan_don_ngay_nghi_order_idx" ON "lich_nhan_don_ngay_nghi" USING btree ("_order");
  CREATE INDEX "lich_nhan_don_ngay_nghi_parent_id_idx" ON "lich_nhan_don_ngay_nghi" USING btree ("_parent_id");
  CREATE INDEX "cai_dat_su_co_khan_cap_order_idx" ON "cai_dat_su_co_khan_cap" USING btree ("_order");
  CREATE INDEX "cai_dat_su_co_khan_cap_parent_id_idx" ON "cai_dat_su_co_khan_cap" USING btree ("_parent_id");
  CREATE INDEX "cai_dat_su_co_khan_cap_dich_vu_idx" ON "cai_dat_su_co_khan_cap" USING btree ("dich_vu_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_don_hang_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tep_don_hang_fk" FOREIGN KEY ("tep_don_hang_id") REFERENCES "public"."tep_don_hang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_danh_gia_fk" FOREIGN KEY ("danh_gia_id") REFERENCES "public"."danh_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_danh_muc_dich_vu_fk" FOREIGN KEY ("danh_muc_dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hang_muc_gia_fk" FOREIGN KEY ("hang_muc_gia_id") REFERENCES "public"."hang_muc_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nhat_ky_gia_fk" FOREIGN KEY ("nhat_ky_gia_id") REFERENCES "public"."nhat_ky_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hang_xe_fk" FOREIGN KEY ("hang_xe_id") REFERENCES "public"."hang_xe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dong_xe_fk" FOREIGN KEY ("dong_xe_id") REFERENCES "public"."dong_xe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quan_fk" FOREIGN KEY ("quan_id") REFERENCES "public"."quan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_phuong_fk" FOREIGN KEY ("phuong_id") REFERENCES "public"."phuong"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_don_hang_id_idx" ON "payload_locked_documents_rels" USING btree ("don_hang_id");
  CREATE INDEX "payload_locked_documents_rels_tep_don_hang_id_idx" ON "payload_locked_documents_rels" USING btree ("tep_don_hang_id");
  CREATE INDEX "payload_locked_documents_rels_danh_gia_id_idx" ON "payload_locked_documents_rels" USING btree ("danh_gia_id");
  CREATE INDEX "payload_locked_documents_rels_danh_muc_dich_vu_id_idx" ON "payload_locked_documents_rels" USING btree ("danh_muc_dich_vu_id");
  CREATE INDEX "payload_locked_documents_rels_hang_muc_gia_id_idx" ON "payload_locked_documents_rels" USING btree ("hang_muc_gia_id");
  CREATE INDEX "payload_locked_documents_rels_nhat_ky_gia_id_idx" ON "payload_locked_documents_rels" USING btree ("nhat_ky_gia_id");
  CREATE INDEX "payload_locked_documents_rels_hang_xe_id_idx" ON "payload_locked_documents_rels" USING btree ("hang_xe_id");
  CREATE INDEX "payload_locked_documents_rels_dong_xe_id_idx" ON "payload_locked_documents_rels" USING btree ("dong_xe_id");
  CREATE INDEX "payload_locked_documents_rels_quan_id_idx" ON "payload_locked_documents_rels" USING btree ("quan_id");
  CREATE INDEX "payload_locked_documents_rels_phuong_id_idx" ON "payload_locked_documents_rels" USING btree ("phuong_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "dat_lich_id";
  DROP TYPE "public"."enum_dat_lich_trang_thai";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_dat_lich_trang_thai" AS ENUM('moi', 'daGoi', 'daHen', 'xong', 'huy');
  CREATE TABLE "dat_lich" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"trang_thai" "enum_dat_lich_trang_thai" DEFAULT 'moi',
  	"ghi_chu_noi_bo" varchar,
  	"dich_vu" varchar NOT NULL,
  	"xe" varchar NOT NULL,
  	"bien_so" varchar,
  	"vi_tri" varchar NOT NULL,
  	"gio" varchar,
  	"sdt" varchar NOT NULL,
  	"ghi_chu" varchar,
  	"nguon" varchar DEFAULT 'website',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cai_dat_khu_vuc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL
  );
  
  ALTER TABLE "don_hang_lich_su_trang_thai" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "don_hang" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "don_hang_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tep_don_hang" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "danh_gia" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "danh_muc_dich_vu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hang_muc_gia" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nhat_ky_gia" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hang_xe" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "dong_xe" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "phuong" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bang_gia_chung_phan_khuc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bang_gia_chung" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lich_nhan_don_khung_gio_ngay_trong_tuan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lich_nhan_don_khung_gio" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lich_nhan_don_ngay_nghi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lich_nhan_don" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cai_dat_su_co_khan_cap" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "don_hang_lich_su_trang_thai" CASCADE;
  DROP TABLE "don_hang" CASCADE;
  DROP TABLE "don_hang_rels" CASCADE;
  DROP TABLE "tep_don_hang" CASCADE;
  DROP TABLE "danh_gia" CASCADE;
  DROP TABLE "danh_muc_dich_vu" CASCADE;
  DROP TABLE "hang_muc_gia" CASCADE;
  DROP TABLE "nhat_ky_gia" CASCADE;
  DROP TABLE "hang_xe" CASCADE;
  DROP TABLE "dong_xe" CASCADE;
  DROP TABLE "quan" CASCADE;
  DROP TABLE "phuong" CASCADE;
  DROP TABLE "bang_gia_chung_phan_khuc" CASCADE;
  DROP TABLE "bang_gia_chung" CASCADE;
  DROP TABLE "lich_nhan_don_khung_gio_ngay_trong_tuan" CASCADE;
  DROP TABLE "lich_nhan_don_khung_gio" CASCADE;
  DROP TABLE "lich_nhan_don_ngay_nghi" CASCADE;
  DROP TABLE "lich_nhan_don" CASCADE;
  DROP TABLE "cai_dat_su_co_khan_cap" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_don_hang_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tep_don_hang_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_danh_gia_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_danh_muc_dich_vu_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hang_muc_gia_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_nhat_ky_gia_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hang_xe_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_dong_xe_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_quan_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_phuong_fk";
  
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DATA TYPE text;
  UPDATE "users" SET "vai_tro" = 'duyetBai' WHERE "vai_tro" = 'quanLyDichVu';
  UPDATE "users" SET "vai_tro" = 'bienTap' WHERE "vai_tro" IN ('marketing', 'dieuPhoi');
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DEFAULT 'bienTap'::text;
  DROP TYPE "public"."enum_users_vai_tro";
  CREATE TYPE "public"."enum_users_vai_tro" AS ENUM('quanTri', 'duyetBai', 'bienTap');
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DEFAULT 'bienTap'::"public"."enum_users_vai_tro";
  ALTER TABLE "users" ALTER COLUMN "vai_tro" SET DATA TYPE "public"."enum_users_vai_tro" USING "vai_tro"::"public"."enum_users_vai_tro";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_don_hang_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tep_don_hang_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_danh_gia_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_danh_muc_dich_vu_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_hang_muc_gia_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_nhat_ky_gia_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_hang_xe_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_dong_xe_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_quan_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_phuong_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "dat_lich_id" integer;
  ALTER TABLE "cai_dat_khu_vuc" ADD CONSTRAINT "cai_dat_khu_vuc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cai_dat"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "dat_lich_updated_at_idx" ON "dat_lich" USING btree ("updated_at");
  CREATE INDEX "dat_lich_created_at_idx" ON "dat_lich" USING btree ("created_at");
  CREATE INDEX "cai_dat_khu_vuc_order_idx" ON "cai_dat_khu_vuc" USING btree ("_order");
  CREATE INDEX "cai_dat_khu_vuc_parent_id_idx" ON "cai_dat_khu_vuc" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dat_lich_fk" FOREIGN KEY ("dat_lich_id") REFERENCES "public"."dat_lich"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_dat_lich_id_idx" ON "payload_locked_documents_rels" USING btree ("dat_lich_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "don_hang_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tep_don_hang_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "danh_gia_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "danh_muc_dich_vu_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hang_muc_gia_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "nhat_ky_gia_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hang_xe_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "dong_xe_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quan_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "phuong_id";
  ALTER TABLE "cai_dat" DROP COLUMN "zalo_oa_id";
  ALTER TABLE "cai_dat" DROP COLUMN "chinh_sach_du_lieu";
  ALTER TABLE "cai_dat" DROP COLUMN "phap_nhan";
  ALTER TABLE "cai_dat" DROP COLUMN "mst";
  ALTER TABLE "cai_dat" DROP COLUMN "da_thong_bao_bo_cong_thuong";
  ALTER TABLE "cai_dat" DROP COLUMN "dia_chi";
  ALTER TABLE "cai_dat" DROP COLUMN "google_danh_gia_url";
  ALTER TABLE "cai_dat" DROP COLUMN "diem_google";
  ALTER TABLE "cai_dat" DROP COLUMN "so_danh_gia_google";
  DROP TYPE "public"."enum_don_hang_lich_su_trang_thai_trang_thai";
  DROP TYPE "public"."enum_don_hang_loai";
  DROP TYPE "public"."enum_don_hang_trang_thai";
  DROP TYPE "public"."enum_don_hang_gia_so_bo_trang_thai";
  DROP TYPE "public"."enum_don_hang_xe_phan_khuc";
  DROP TYPE "public"."enum_don_hang_vi_tri_cho_do";
  DROP TYPE "public"."enum_tep_don_hang_loai";
  DROP TYPE "public"."enum_danh_gia_nguon";
  DROP TYPE "public"."enum_hang_muc_gia_loai";
  DROP TYPE "public"."enum_hang_muc_gia_bao_gia_so_bo";
  DROP TYPE "public"."enum_hang_muc_gia_nguon_gia";
  DROP TYPE "public"."enum_hang_xe_nguon";
  DROP TYPE "public"."enum_dong_xe_phan_khuc";
  DROP TYPE "public"."enum_dong_xe_goi_y_phan_khuc";
  DROP TYPE "public"."enum_dong_xe_nguon";
  DROP TYPE "public"."enum_bang_gia_chung_phan_khuc_ma";
  DROP TYPE "public"."enum_lich_nhan_don_khung_gio_ngay_trong_tuan";
  DROP SEQUENCE IF EXISTS "ma_so_tt";`)
}
