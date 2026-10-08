import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Mã phiếu bảo hành BH-, phiếu khiếu nại KN- (lib/ma-so.ts)
  CREATE SEQUENCE IF NOT EXISTS "ma_so_bh" START 1;
  CREATE SEQUENCE IF NOT EXISTS "ma_so_kn" START 1;
   CREATE TYPE "public"."enum_don_hang_ket_qua" AS ENUM('binhThuong', 'tuChoiBaoGia');
  CREATE TYPE "public"."enum_don_hang_thanh_toan_trang_thai" AS ENUM('chuaTinh', 'choTien', 'thieu', 'daThanhToan');
  CREATE TYPE "public"."enum_bao_gia_hang_muc_loai" AS ENUM('cong', 'phuTung');
  CREATE TYPE "public"."enum_bao_gia_hang_muc_muc_do" AS ENUM('canLamNgay', 'nenLam', 'coTheDeSau');
  CREATE TYPE "public"."enum_bao_gia_trang_thai" AS ENUM('choDuyet', 'daDuyet', 'tuChoi', 'thayThe');
  CREATE TYPE "public"."enum_giao_dich_hinh_thuc" AS ENUM('chuyenKhoan', 'tienMat');
  CREATE TYPE "public"."enum_giao_dich_ket_qua" AS ENUM('du', 'thieu', 'khongThayDon', 'trung', 'hoiVien');
  CREATE TYPE "public"."enum_phieu_bao_hanh_hang_muc_loai" AS ENUM('phuTung', 'cong');
  CREATE TYPE "public"."enum_tin_nhan_kenh" AS ENUM('zalo', 'sms');
  CREATE TYPE "public"."enum_tin_nhan_trang_thai" AS ENUM('daGui', 'loi');
  CREATE TYPE "public"."enum_khieu_nai_van_de" AS ENUM('tre', 'thaido', 'gia', 'chatluong', 'vesinh', 'khac');
  CREATE TYPE "public"."enum_khieu_nai_trang_thai" AS ENUM('moi', 'dangXuLy', 'daXuLy');
  CREATE TYPE "public"."enum_ma_khuyen_mai_loai" AS ENUM('km', 'koc', 'xang', 'bql');
  CREATE TYPE "public"."enum_ma_khuyen_mai_kieu_giam" AS ENUM('phanTram', 'soTien');
  CREATE TYPE "public"."enum_su_kien_loai" AS ENUM('xemTrang', 'bamGoi', 'bamZalo', 'guiForm');
  CREATE TYPE "public"."enum_cam_nang_chu_de" AS ENUM('meo', 'benh', 'dien', 'mua');
  CREATE TYPE "public"."enum__cam_nang_v_version_chu_de" AS ENUM('meo', 'benh', 'dien', 'mua');
  CREATE TYPE "public"."enum_trang_khu_vuc_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daHenGio', 'daDuyet');
  CREATE TYPE "public"."enum_trang_khu_vuc_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__trang_khu_vuc_v_version_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daHenGio', 'daDuyet');
  CREATE TYPE "public"."enum__trang_khu_vuc_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_trang_hang_xe_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daHenGio', 'daDuyet');
  CREATE TYPE "public"."enum_trang_hang_xe_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__trang_hang_xe_v_version_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daHenGio', 'daDuyet');
  CREATE TYPE "public"."enum__trang_hang_xe_v_version_status" AS ENUM('draft', 'published');
  ALTER TYPE "public"."enum_cam_nang_trang_thai_duyet" ADD VALUE 'daHenGio' BEFORE 'daDuyet';
  ALTER TYPE "public"."enum__cam_nang_v_version_trang_thai_duyet" ADD VALUE 'daHenGio' BEFORE 'daDuyet';
  ALTER TYPE "public"."enum_dich_vu_trang_thai_duyet" ADD VALUE 'daHenGio' BEFORE 'daDuyet';
  ALTER TYPE "public"."enum__dich_vu_v_version_trang_thai_duyet" ADD VALUE 'daHenGio' BEFORE 'daDuyet';
  CREATE TABLE "bao_gia_hang_muc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ma" varchar NOT NULL,
  	"ten" varchar NOT NULL,
  	"loai" "enum_bao_gia_hang_muc_loai" DEFAULT 'cong' NOT NULL,
  	"gia" numeric NOT NULL,
  	"ly_do" varchar,
  	"bat_buoc" boolean,
  	"muc_do" "enum_bao_gia_hang_muc_muc_do" DEFAULT 'canLamNgay',
  	"bao_hanh_thang" numeric
  );
  
  CREATE TABLE "bao_gia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"don_hang_id" integer NOT NULL,
  	"ma_don" varchar,
  	"phien_ban" numeric DEFAULT 1,
  	"tieu_de" varchar,
  	"trang_thai" "enum_bao_gia_trang_thai" DEFAULT 'choDuyet',
  	"chan_doan" varchar,
  	"tong_neu_lam_het" numeric,
  	"tao_boi" varchar,
  	"ket_qua_luc" timestamp(3) with time zone,
  	"ket_qua_sdt" varchar,
  	"ket_qua_tien_cong" numeric,
  	"ket_qua_phu_tung" numeric,
  	"ket_qua_ly_do_tu_choi" varchar,
  	"ket_qua_ban_chup" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bao_gia_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "bao_gia_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tep_don_hang_id" integer
  );
  
  CREATE TABLE "giao_dich" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma_giao_dich" varchar NOT NULL,
  	"so_tien" numeric NOT NULL,
  	"hinh_thuc" "enum_giao_dich_hinh_thuc" DEFAULT 'chuyenKhoan',
  	"noi_dung" varchar,
  	"luc" timestamp(3) with time zone,
  	"nguon" varchar,
  	"don_hang_id" integer,
  	"ket_qua" "enum_giao_dich_ket_qua",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "phieu_bao_hanh_hang_muc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL,
  	"loai" "enum_phieu_bao_hanh_hang_muc_loai",
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone
  );
  
  CREATE TABLE "phieu_bao_hanh" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar,
  	"don_hang_id" integer NOT NULL,
  	"bien_so" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tin_nhan" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"loai" varchar NOT NULL,
  	"don_hang_id" integer,
  	"sdt_che" varchar,
  	"kenh" "enum_tin_nhan_kenh",
  	"trang_thai" "enum_tin_nhan_trang_thai",
  	"loi" varchar,
  	"noi_dung" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tho_chung_chi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL
  );
  
  CREATE TABLE "tho" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL,
  	"sdt" varchar,
  	"ma_ben_dieu_phoi" varchar,
  	"anh_id" integer,
  	"so_nam_nghe" numeric,
  	"bien_so_xe_van" varchar,
  	"gioi_thieu" varchar,
  	"dang_hoat_dong" boolean DEFAULT true,
  	"diem_sao" numeric,
  	"so_danh_gia" numeric DEFAULT 0,
  	"vi_tri_lat" numeric,
  	"vi_tri_lng" numeric,
  	"vi_tri_luc" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tho_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"quan_id" integer
  );
  
  CREATE TABLE "khieu_nai_van_de" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_khieu_nai_van_de",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "khieu_nai" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar,
  	"don_hang_id" integer,
  	"so_sao" numeric,
  	"mo_ta" varchar,
  	"sdt_goi_lai" varchar,
  	"trang_thai" "enum_khieu_nai_trang_thai" DEFAULT 'moi',
  	"han_goi_lai" timestamp(3) with time zone,
  	"phu_trach_id" integer,
  	"ket_qua_xu_ly" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ma_khuyen_mai" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ma" varchar NOT NULL,
  	"loai" "enum_ma_khuyen_mai_loai" DEFAULT 'km' NOT NULL,
  	"doi_tac" varchar,
  	"kieu_giam" "enum_ma_khuyen_mai_kieu_giam" DEFAULT 'phanTram' NOT NULL,
  	"gia_tri" numeric NOT NULL,
  	"giam_toi_da" numeric,
  	"bat_dau" timestamp(3) with time zone,
  	"het_han" timestamp(3) with time zone,
  	"so_luot_toi_da" numeric,
  	"moi_sdt_mot_lan" boolean DEFAULT true,
  	"hoa_hong_phan_tram" numeric DEFAULT 0,
  	"tam_dung" boolean DEFAULT false,
  	"ghi_chu" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "su_kien" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"loai" "enum_su_kien_loai" NOT NULL,
  	"duong_dan" varchar,
  	"kenh" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"ma_q_r" varchar,
  	"referrer" varchar,
  	"phien" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "trang_khu_vuc_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "trang_khu_vuc" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"dich_vu_id" integer,
  	"quan_id" integer,
  	"title" varchar,
  	"description" varchar,
  	"keyword" varchar,
  	"doan_rieng" varchar,
  	"noi_dung" jsonb,
  	"slug" varchar,
  	"trang_thai_duyet" "enum_trang_khu_vuc_trang_thai_duyet" DEFAULT 'nhap',
  	"hen_gio_dang" timestamp(3) with time zone,
  	"nguoi_viet_id" integer,
  	"nguoi_duyet_id" integer,
  	"ghi_chu_duyet" varchar,
  	"gia_da_duyet" boolean DEFAULT false,
  	"ket_qua_kiem_tra" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_trang_khu_vuc_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "trang_khu_vuc_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"danh_gia_id" integer
  );
  
  CREATE TABLE "_trang_khu_vuc_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trang_khu_vuc_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_dich_vu_id" integer,
  	"version_quan_id" integer,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_keyword" varchar,
  	"version_doan_rieng" varchar,
  	"version_noi_dung" jsonb,
  	"version_slug" varchar,
  	"version_trang_thai_duyet" "enum__trang_khu_vuc_v_version_trang_thai_duyet" DEFAULT 'nhap',
  	"version_hen_gio_dang" timestamp(3) with time zone,
  	"version_nguoi_viet_id" integer,
  	"version_nguoi_duyet_id" integer,
  	"version_ghi_chu_duyet" varchar,
  	"version_gia_da_duyet" boolean DEFAULT false,
  	"version_ket_qua_kiem_tra" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__trang_khu_vuc_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_trang_khu_vuc_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"danh_gia_id" integer
  );
  
  CREATE TABLE "trang_hang_xe_benh_hay_gap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dong_id" integer,
  	"tieu_de" varchar,
  	"mo_ta" varchar,
  	"dich_vu_id" integer
  );
  
  CREATE TABLE "trang_hang_xe_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "trang_hang_xe" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hang_id" integer,
  	"title" varchar,
  	"description" varchar,
  	"keyword" varchar,
  	"noi_dung" jsonb,
  	"slug" varchar,
  	"trang_thai_duyet" "enum_trang_hang_xe_trang_thai_duyet" DEFAULT 'nhap',
  	"hen_gio_dang" timestamp(3) with time zone,
  	"nguoi_viet_id" integer,
  	"nguoi_duyet_id" integer,
  	"ghi_chu_duyet" varchar,
  	"gia_da_duyet" boolean DEFAULT false,
  	"ket_qua_kiem_tra" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_trang_hang_xe_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_trang_hang_xe_v_version_benh_hay_gap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dong_id" integer,
  	"tieu_de" varchar,
  	"mo_ta" varchar,
  	"dich_vu_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trang_hang_xe_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trang_hang_xe_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hang_id" integer,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_keyword" varchar,
  	"version_noi_dung" jsonb,
  	"version_slug" varchar,
  	"version_trang_thai_duyet" "enum__trang_hang_xe_v_version_trang_thai_duyet" DEFAULT 'nhap',
  	"version_hen_gio_dang" timestamp(3) with time zone,
  	"version_nguoi_viet_id" integer,
  	"version_nguoi_duyet_id" integer,
  	"version_ghi_chu_duyet" varchar,
  	"version_gia_da_duyet" boolean DEFAULT false,
  	"version_ket_qua_kiem_tra" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__trang_hang_xe_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "ma_xac_nhan" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bien_so" varchar,
  	"sdt" varchar,
  	"ma_bam" varchar,
  	"kenh" varchar,
  	"gui_luc" timestamp(3) with time zone,
  	"het_han_luc" timestamp(3) with time zone,
  	"so_lan_thu" numeric DEFAULT 0,
  	"da_dung" boolean DEFAULT false,
  	"phien_bam" varchar,
  	"phien_het_han_luc" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "don_hang" ADD COLUMN "tho_id" integer;
  ALTER TABLE "don_hang" ADD COLUMN "tho_du_kien_den_luc" timestamp(3) with time zone;
  ALTER TABLE "don_hang" ADD COLUMN "vi_tri_tho_lat" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "vi_tri_tho_lng" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "vi_tri_tho_luc" timestamp(3) with time zone;
  ALTER TABLE "don_hang" ADD COLUMN "ket_qua" "enum_don_hang_ket_qua" DEFAULT 'binhThuong';
  ALTER TABLE "don_hang" ADD COLUMN "khuyen_mai_id" integer;
  ALTER TABLE "don_hang" ADD COLUMN "xong_luc" timestamp(3) with time zone;
  ALTER TABLE "don_hang" ADD COLUMN "so_km_khi_xong" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_so_tien" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_giam" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_da_nhan" numeric DEFAULT 0;
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_trang_thai" "enum_don_hang_thanh_toan_trang_thai" DEFAULT 'chuaTinh';
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_chi_tiet" jsonb;
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_thanh_toan_luc" timestamp(3) with time zone;
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_ma_giao_dich" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "thanh_toan_hinh_thuc" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "hoa_don_dien_tu_so" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "hoa_don_dien_tu_ky_hieu" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "hoa_don_dien_tu_ma_c_q_t" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "hoa_don_dien_tu_xuat_luc" timestamp(3) with time zone;
  ALTER TABLE "don_hang" ADD COLUMN "hoa_don_dien_tu_link_xem" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "hoa_don_dien_tu_link_pdf" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "hoa_don_dien_tu_loi" varchar;
  ALTER TABLE "don_hang" ADD COLUMN "phieu_bao_hanh_id" integer;
  ALTER TABLE "don_hang" ADD COLUMN "danh_gia_gui_luc" timestamp(3) with time zone;
  ALTER TABLE "don_hang" ADD COLUMN "danh_gia_luc" timestamp(3) with time zone;
  ALTER TABLE "don_hang" ADD COLUMN "danh_gia_so_sao" numeric;
  ALTER TABLE "don_hang" ADD COLUMN "danh_gia_token" varchar;
  ALTER TABLE "cam_nang" ADD COLUMN "chu_de" "enum_cam_nang_chu_de";
  ALTER TABLE "cam_nang" ADD COLUMN "nguoi_duyet_ky_thuat_id" integer;
  ALTER TABLE "cam_nang" ADD COLUMN "thoi_gian_doc_phut" numeric;
  ALTER TABLE "cam_nang" ADD COLUMN "hen_gio_dang" timestamp(3) with time zone;
  ALTER TABLE "cam_nang" ADD COLUMN "nguoi_viet_id" integer;
  ALTER TABLE "cam_nang" ADD COLUMN "nguoi_duyet_id" integer;
  ALTER TABLE "_cam_nang_v" ADD COLUMN "version_chu_de" "enum__cam_nang_v_version_chu_de";
  ALTER TABLE "_cam_nang_v" ADD COLUMN "version_nguoi_duyet_ky_thuat_id" integer;
  ALTER TABLE "_cam_nang_v" ADD COLUMN "version_thoi_gian_doc_phut" numeric;
  ALTER TABLE "_cam_nang_v" ADD COLUMN "version_hen_gio_dang" timestamp(3) with time zone;
  ALTER TABLE "_cam_nang_v" ADD COLUMN "version_nguoi_viet_id" integer;
  ALTER TABLE "_cam_nang_v" ADD COLUMN "version_nguoi_duyet_id" integer;
  ALTER TABLE "dich_vu" ADD COLUMN "hen_gio_dang" timestamp(3) with time zone;
  ALTER TABLE "dich_vu" ADD COLUMN "nguoi_viet_id" integer;
  ALTER TABLE "dich_vu" ADD COLUMN "nguoi_duyet_id" integer;
  ALTER TABLE "_dich_vu_v" ADD COLUMN "version_hen_gio_dang" timestamp(3) with time zone;
  ALTER TABLE "_dich_vu_v" ADD COLUMN "version_nguoi_viet_id" integer;
  ALTER TABLE "_dich_vu_v" ADD COLUMN "version_nguoi_duyet_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bao_gia_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "giao_dich_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "phieu_bao_hanh_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tin_nhan_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tho_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "khieu_nai_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ma_khuyen_mai_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "su_kien_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trang_khu_vuc_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trang_hang_xe_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ma_xac_nhan_id" integer;
  ALTER TABLE "bang_gia_chung" ADD COLUMN "chu_ky_bao_duong_km" numeric DEFAULT 5000;
  ALTER TABLE "bang_gia_chung" ADD COLUMN "chu_ky_bao_duong_thang" numeric DEFAULT 6;
  ALTER TABLE "cai_dat" ADD COLUMN "ngan_hang_bin" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "ngan_hang_ten" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "so_tai_khoan" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "chu_tai_khoan" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "sdt_cskh" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "ten_cskh" varchar;
  ALTER TABLE "cai_dat" ADD COLUMN "cskh_goi_lai_gio" numeric DEFAULT 2;
  ALTER TABLE "cai_dat" ADD COLUMN "muc_tieu_ty_le_dat_lich" numeric DEFAULT 4;
  ALTER TABLE "bao_gia_hang_muc" ADD CONSTRAINT "bao_gia_hang_muc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bao_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bao_gia" ADD CONSTRAINT "bao_gia_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bao_gia_texts" ADD CONSTRAINT "bao_gia_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bao_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bao_gia_rels" ADD CONSTRAINT "bao_gia_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bao_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bao_gia_rels" ADD CONSTRAINT "bao_gia_rels_tep_don_hang_fk" FOREIGN KEY ("tep_don_hang_id") REFERENCES "public"."tep_don_hang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "giao_dich" ADD CONSTRAINT "giao_dich_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "phieu_bao_hanh_hang_muc" ADD CONSTRAINT "phieu_bao_hanh_hang_muc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."phieu_bao_hanh"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "phieu_bao_hanh" ADD CONSTRAINT "phieu_bao_hanh_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tin_nhan" ADD CONSTRAINT "tin_nhan_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tho_chung_chi" ADD CONSTRAINT "tho_chung_chi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tho"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tho" ADD CONSTRAINT "tho_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tho_rels" ADD CONSTRAINT "tho_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tho"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tho_rels" ADD CONSTRAINT "tho_rels_quan_fk" FOREIGN KEY ("quan_id") REFERENCES "public"."quan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "khieu_nai_van_de" ADD CONSTRAINT "khieu_nai_van_de_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."khieu_nai"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "khieu_nai" ADD CONSTRAINT "khieu_nai_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "khieu_nai" ADD CONSTRAINT "khieu_nai_phu_trach_id_users_id_fk" FOREIGN KEY ("phu_trach_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc_faq" ADD CONSTRAINT "trang_khu_vuc_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trang_khu_vuc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc" ADD CONSTRAINT "trang_khu_vuc_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc" ADD CONSTRAINT "trang_khu_vuc_quan_id_quan_id_fk" FOREIGN KEY ("quan_id") REFERENCES "public"."quan"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc" ADD CONSTRAINT "trang_khu_vuc_nguoi_viet_id_users_id_fk" FOREIGN KEY ("nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc" ADD CONSTRAINT "trang_khu_vuc_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc_rels" ADD CONSTRAINT "trang_khu_vuc_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trang_khu_vuc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc_rels" ADD CONSTRAINT "trang_khu_vuc_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trang_khu_vuc_rels" ADD CONSTRAINT "trang_khu_vuc_rels_danh_gia_fk" FOREIGN KEY ("danh_gia_id") REFERENCES "public"."danh_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v_version_faq" ADD CONSTRAINT "_trang_khu_vuc_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trang_khu_vuc_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v" ADD CONSTRAINT "_trang_khu_vuc_v_parent_id_trang_khu_vuc_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trang_khu_vuc"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v" ADD CONSTRAINT "_trang_khu_vuc_v_version_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("version_dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v" ADD CONSTRAINT "_trang_khu_vuc_v_version_quan_id_quan_id_fk" FOREIGN KEY ("version_quan_id") REFERENCES "public"."quan"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v" ADD CONSTRAINT "_trang_khu_vuc_v_version_nguoi_viet_id_users_id_fk" FOREIGN KEY ("version_nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v" ADD CONSTRAINT "_trang_khu_vuc_v_version_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("version_nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v_rels" ADD CONSTRAINT "_trang_khu_vuc_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_trang_khu_vuc_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v_rels" ADD CONSTRAINT "_trang_khu_vuc_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trang_khu_vuc_v_rels" ADD CONSTRAINT "_trang_khu_vuc_v_rels_danh_gia_fk" FOREIGN KEY ("danh_gia_id") REFERENCES "public"."danh_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trang_hang_xe_benh_hay_gap" ADD CONSTRAINT "trang_hang_xe_benh_hay_gap_dong_id_dong_xe_id_fk" FOREIGN KEY ("dong_id") REFERENCES "public"."dong_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_hang_xe_benh_hay_gap" ADD CONSTRAINT "trang_hang_xe_benh_hay_gap_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_hang_xe_benh_hay_gap" ADD CONSTRAINT "trang_hang_xe_benh_hay_gap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trang_hang_xe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trang_hang_xe_faq" ADD CONSTRAINT "trang_hang_xe_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trang_hang_xe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trang_hang_xe" ADD CONSTRAINT "trang_hang_xe_hang_id_hang_xe_id_fk" FOREIGN KEY ("hang_id") REFERENCES "public"."hang_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_hang_xe" ADD CONSTRAINT "trang_hang_xe_nguoi_viet_id_users_id_fk" FOREIGN KEY ("nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trang_hang_xe" ADD CONSTRAINT "trang_hang_xe_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v_version_benh_hay_gap" ADD CONSTRAINT "_trang_hang_xe_v_version_benh_hay_gap_dong_id_dong_xe_id_fk" FOREIGN KEY ("dong_id") REFERENCES "public"."dong_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v_version_benh_hay_gap" ADD CONSTRAINT "_trang_hang_xe_v_version_benh_hay_gap_dich_vu_id_danh_muc_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."danh_muc_dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v_version_benh_hay_gap" ADD CONSTRAINT "_trang_hang_xe_v_version_benh_hay_gap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trang_hang_xe_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v_version_faq" ADD CONSTRAINT "_trang_hang_xe_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trang_hang_xe_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v" ADD CONSTRAINT "_trang_hang_xe_v_parent_id_trang_hang_xe_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trang_hang_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v" ADD CONSTRAINT "_trang_hang_xe_v_version_hang_id_hang_xe_id_fk" FOREIGN KEY ("version_hang_id") REFERENCES "public"."hang_xe"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v" ADD CONSTRAINT "_trang_hang_xe_v_version_nguoi_viet_id_users_id_fk" FOREIGN KEY ("version_nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trang_hang_xe_v" ADD CONSTRAINT "_trang_hang_xe_v_version_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("version_nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "bao_gia_hang_muc_order_idx" ON "bao_gia_hang_muc" USING btree ("_order");
  CREATE INDEX "bao_gia_hang_muc_parent_id_idx" ON "bao_gia_hang_muc" USING btree ("_parent_id");
  CREATE INDEX "bao_gia_don_hang_idx" ON "bao_gia" USING btree ("don_hang_id");
  CREATE INDEX "bao_gia_trang_thai_idx" ON "bao_gia" USING btree ("trang_thai");
  CREATE INDEX "bao_gia_updated_at_idx" ON "bao_gia" USING btree ("updated_at");
  CREATE INDEX "bao_gia_created_at_idx" ON "bao_gia" USING btree ("created_at");
  CREATE INDEX "bao_gia_texts_order_parent" ON "bao_gia_texts" USING btree ("order","parent_id");
  CREATE INDEX "bao_gia_rels_order_idx" ON "bao_gia_rels" USING btree ("order");
  CREATE INDEX "bao_gia_rels_parent_idx" ON "bao_gia_rels" USING btree ("parent_id");
  CREATE INDEX "bao_gia_rels_path_idx" ON "bao_gia_rels" USING btree ("path");
  CREATE INDEX "bao_gia_rels_tep_don_hang_id_idx" ON "bao_gia_rels" USING btree ("tep_don_hang_id");
  CREATE UNIQUE INDEX "giao_dich_ma_giao_dich_idx" ON "giao_dich" USING btree ("ma_giao_dich");
  CREATE INDEX "giao_dich_don_hang_idx" ON "giao_dich" USING btree ("don_hang_id");
  CREATE INDEX "giao_dich_updated_at_idx" ON "giao_dich" USING btree ("updated_at");
  CREATE INDEX "giao_dich_created_at_idx" ON "giao_dich" USING btree ("created_at");
  CREATE INDEX "phieu_bao_hanh_hang_muc_order_idx" ON "phieu_bao_hanh_hang_muc" USING btree ("_order");
  CREATE INDEX "phieu_bao_hanh_hang_muc_parent_id_idx" ON "phieu_bao_hanh_hang_muc" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "phieu_bao_hanh_ma_idx" ON "phieu_bao_hanh" USING btree ("ma");
  CREATE INDEX "phieu_bao_hanh_don_hang_idx" ON "phieu_bao_hanh" USING btree ("don_hang_id");
  CREATE INDEX "phieu_bao_hanh_bien_so_idx" ON "phieu_bao_hanh" USING btree ("bien_so");
  CREATE INDEX "phieu_bao_hanh_updated_at_idx" ON "phieu_bao_hanh" USING btree ("updated_at");
  CREATE INDEX "phieu_bao_hanh_created_at_idx" ON "phieu_bao_hanh" USING btree ("created_at");
  CREATE INDEX "tin_nhan_loai_idx" ON "tin_nhan" USING btree ("loai");
  CREATE INDEX "tin_nhan_don_hang_idx" ON "tin_nhan" USING btree ("don_hang_id");
  CREATE INDEX "tin_nhan_updated_at_idx" ON "tin_nhan" USING btree ("updated_at");
  CREATE INDEX "tin_nhan_created_at_idx" ON "tin_nhan" USING btree ("created_at");
  CREATE INDEX "tho_chung_chi_order_idx" ON "tho_chung_chi" USING btree ("_order");
  CREATE INDEX "tho_chung_chi_parent_id_idx" ON "tho_chung_chi" USING btree ("_parent_id");
  CREATE INDEX "tho_ma_ben_dieu_phoi_idx" ON "tho" USING btree ("ma_ben_dieu_phoi");
  CREATE INDEX "tho_anh_idx" ON "tho" USING btree ("anh_id");
  CREATE INDEX "tho_updated_at_idx" ON "tho" USING btree ("updated_at");
  CREATE INDEX "tho_created_at_idx" ON "tho" USING btree ("created_at");
  CREATE INDEX "tho_rels_order_idx" ON "tho_rels" USING btree ("order");
  CREATE INDEX "tho_rels_parent_idx" ON "tho_rels" USING btree ("parent_id");
  CREATE INDEX "tho_rels_path_idx" ON "tho_rels" USING btree ("path");
  CREATE INDEX "tho_rels_quan_id_idx" ON "tho_rels" USING btree ("quan_id");
  CREATE INDEX "khieu_nai_van_de_order_idx" ON "khieu_nai_van_de" USING btree ("order");
  CREATE INDEX "khieu_nai_van_de_parent_idx" ON "khieu_nai_van_de" USING btree ("parent_id");
  CREATE UNIQUE INDEX "khieu_nai_ma_idx" ON "khieu_nai" USING btree ("ma");
  CREATE INDEX "khieu_nai_don_hang_idx" ON "khieu_nai" USING btree ("don_hang_id");
  CREATE INDEX "khieu_nai_trang_thai_idx" ON "khieu_nai" USING btree ("trang_thai");
  CREATE INDEX "khieu_nai_phu_trach_idx" ON "khieu_nai" USING btree ("phu_trach_id");
  CREATE INDEX "khieu_nai_updated_at_idx" ON "khieu_nai" USING btree ("updated_at");
  CREATE INDEX "khieu_nai_created_at_idx" ON "khieu_nai" USING btree ("created_at");
  CREATE UNIQUE INDEX "ma_khuyen_mai_ma_idx" ON "ma_khuyen_mai" USING btree ("ma");
  CREATE INDEX "ma_khuyen_mai_updated_at_idx" ON "ma_khuyen_mai" USING btree ("updated_at");
  CREATE INDEX "ma_khuyen_mai_created_at_idx" ON "ma_khuyen_mai" USING btree ("created_at");
  CREATE INDEX "su_kien_loai_idx" ON "su_kien" USING btree ("loai");
  CREATE INDEX "su_kien_duong_dan_idx" ON "su_kien" USING btree ("duong_dan");
  CREATE INDEX "su_kien_kenh_idx" ON "su_kien" USING btree ("kenh");
  CREATE INDEX "su_kien_phien_idx" ON "su_kien" USING btree ("phien");
  CREATE INDEX "su_kien_updated_at_idx" ON "su_kien" USING btree ("updated_at");
  CREATE INDEX "su_kien_created_at_idx" ON "su_kien" USING btree ("created_at");
  CREATE INDEX "trang_khu_vuc_faq_order_idx" ON "trang_khu_vuc_faq" USING btree ("_order");
  CREATE INDEX "trang_khu_vuc_faq_parent_id_idx" ON "trang_khu_vuc_faq" USING btree ("_parent_id");
  CREATE INDEX "trang_khu_vuc_dich_vu_idx" ON "trang_khu_vuc" USING btree ("dich_vu_id");
  CREATE INDEX "trang_khu_vuc_quan_idx" ON "trang_khu_vuc" USING btree ("quan_id");
  CREATE UNIQUE INDEX "trang_khu_vuc_slug_idx" ON "trang_khu_vuc" USING btree ("slug");
  CREATE INDEX "trang_khu_vuc_nguoi_viet_idx" ON "trang_khu_vuc" USING btree ("nguoi_viet_id");
  CREATE INDEX "trang_khu_vuc_nguoi_duyet_idx" ON "trang_khu_vuc" USING btree ("nguoi_duyet_id");
  CREATE INDEX "trang_khu_vuc_updated_at_idx" ON "trang_khu_vuc" USING btree ("updated_at");
  CREATE INDEX "trang_khu_vuc_created_at_idx" ON "trang_khu_vuc" USING btree ("created_at");
  CREATE INDEX "trang_khu_vuc__status_idx" ON "trang_khu_vuc" USING btree ("_status");
  CREATE INDEX "trang_khu_vuc_rels_order_idx" ON "trang_khu_vuc_rels" USING btree ("order");
  CREATE INDEX "trang_khu_vuc_rels_parent_idx" ON "trang_khu_vuc_rels" USING btree ("parent_id");
  CREATE INDEX "trang_khu_vuc_rels_path_idx" ON "trang_khu_vuc_rels" USING btree ("path");
  CREATE INDEX "trang_khu_vuc_rels_media_id_idx" ON "trang_khu_vuc_rels" USING btree ("media_id");
  CREATE INDEX "trang_khu_vuc_rels_danh_gia_id_idx" ON "trang_khu_vuc_rels" USING btree ("danh_gia_id");
  CREATE INDEX "_trang_khu_vuc_v_version_faq_order_idx" ON "_trang_khu_vuc_v_version_faq" USING btree ("_order");
  CREATE INDEX "_trang_khu_vuc_v_version_faq_parent_id_idx" ON "_trang_khu_vuc_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_trang_khu_vuc_v_parent_idx" ON "_trang_khu_vuc_v" USING btree ("parent_id");
  CREATE INDEX "_trang_khu_vuc_v_version_version_dich_vu_idx" ON "_trang_khu_vuc_v" USING btree ("version_dich_vu_id");
  CREATE INDEX "_trang_khu_vuc_v_version_version_quan_idx" ON "_trang_khu_vuc_v" USING btree ("version_quan_id");
  CREATE INDEX "_trang_khu_vuc_v_version_version_slug_idx" ON "_trang_khu_vuc_v" USING btree ("version_slug");
  CREATE INDEX "_trang_khu_vuc_v_version_version_nguoi_viet_idx" ON "_trang_khu_vuc_v" USING btree ("version_nguoi_viet_id");
  CREATE INDEX "_trang_khu_vuc_v_version_version_nguoi_duyet_idx" ON "_trang_khu_vuc_v" USING btree ("version_nguoi_duyet_id");
  CREATE INDEX "_trang_khu_vuc_v_version_version_updated_at_idx" ON "_trang_khu_vuc_v" USING btree ("version_updated_at");
  CREATE INDEX "_trang_khu_vuc_v_version_version_created_at_idx" ON "_trang_khu_vuc_v" USING btree ("version_created_at");
  CREATE INDEX "_trang_khu_vuc_v_version_version__status_idx" ON "_trang_khu_vuc_v" USING btree ("version__status");
  CREATE INDEX "_trang_khu_vuc_v_created_at_idx" ON "_trang_khu_vuc_v" USING btree ("created_at");
  CREATE INDEX "_trang_khu_vuc_v_updated_at_idx" ON "_trang_khu_vuc_v" USING btree ("updated_at");
  CREATE INDEX "_trang_khu_vuc_v_latest_idx" ON "_trang_khu_vuc_v" USING btree ("latest");
  CREATE INDEX "_trang_khu_vuc_v_rels_order_idx" ON "_trang_khu_vuc_v_rels" USING btree ("order");
  CREATE INDEX "_trang_khu_vuc_v_rels_parent_idx" ON "_trang_khu_vuc_v_rels" USING btree ("parent_id");
  CREATE INDEX "_trang_khu_vuc_v_rels_path_idx" ON "_trang_khu_vuc_v_rels" USING btree ("path");
  CREATE INDEX "_trang_khu_vuc_v_rels_media_id_idx" ON "_trang_khu_vuc_v_rels" USING btree ("media_id");
  CREATE INDEX "_trang_khu_vuc_v_rels_danh_gia_id_idx" ON "_trang_khu_vuc_v_rels" USING btree ("danh_gia_id");
  CREATE INDEX "trang_hang_xe_benh_hay_gap_order_idx" ON "trang_hang_xe_benh_hay_gap" USING btree ("_order");
  CREATE INDEX "trang_hang_xe_benh_hay_gap_parent_id_idx" ON "trang_hang_xe_benh_hay_gap" USING btree ("_parent_id");
  CREATE INDEX "trang_hang_xe_benh_hay_gap_dong_idx" ON "trang_hang_xe_benh_hay_gap" USING btree ("dong_id");
  CREATE INDEX "trang_hang_xe_benh_hay_gap_dich_vu_idx" ON "trang_hang_xe_benh_hay_gap" USING btree ("dich_vu_id");
  CREATE INDEX "trang_hang_xe_faq_order_idx" ON "trang_hang_xe_faq" USING btree ("_order");
  CREATE INDEX "trang_hang_xe_faq_parent_id_idx" ON "trang_hang_xe_faq" USING btree ("_parent_id");
  CREATE INDEX "trang_hang_xe_hang_idx" ON "trang_hang_xe" USING btree ("hang_id");
  CREATE UNIQUE INDEX "trang_hang_xe_slug_idx" ON "trang_hang_xe" USING btree ("slug");
  CREATE INDEX "trang_hang_xe_nguoi_viet_idx" ON "trang_hang_xe" USING btree ("nguoi_viet_id");
  CREATE INDEX "trang_hang_xe_nguoi_duyet_idx" ON "trang_hang_xe" USING btree ("nguoi_duyet_id");
  CREATE INDEX "trang_hang_xe_updated_at_idx" ON "trang_hang_xe" USING btree ("updated_at");
  CREATE INDEX "trang_hang_xe_created_at_idx" ON "trang_hang_xe" USING btree ("created_at");
  CREATE INDEX "trang_hang_xe__status_idx" ON "trang_hang_xe" USING btree ("_status");
  CREATE INDEX "_trang_hang_xe_v_version_benh_hay_gap_order_idx" ON "_trang_hang_xe_v_version_benh_hay_gap" USING btree ("_order");
  CREATE INDEX "_trang_hang_xe_v_version_benh_hay_gap_parent_id_idx" ON "_trang_hang_xe_v_version_benh_hay_gap" USING btree ("_parent_id");
  CREATE INDEX "_trang_hang_xe_v_version_benh_hay_gap_dong_idx" ON "_trang_hang_xe_v_version_benh_hay_gap" USING btree ("dong_id");
  CREATE INDEX "_trang_hang_xe_v_version_benh_hay_gap_dich_vu_idx" ON "_trang_hang_xe_v_version_benh_hay_gap" USING btree ("dich_vu_id");
  CREATE INDEX "_trang_hang_xe_v_version_faq_order_idx" ON "_trang_hang_xe_v_version_faq" USING btree ("_order");
  CREATE INDEX "_trang_hang_xe_v_version_faq_parent_id_idx" ON "_trang_hang_xe_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_trang_hang_xe_v_parent_idx" ON "_trang_hang_xe_v" USING btree ("parent_id");
  CREATE INDEX "_trang_hang_xe_v_version_version_hang_idx" ON "_trang_hang_xe_v" USING btree ("version_hang_id");
  CREATE INDEX "_trang_hang_xe_v_version_version_slug_idx" ON "_trang_hang_xe_v" USING btree ("version_slug");
  CREATE INDEX "_trang_hang_xe_v_version_version_nguoi_viet_idx" ON "_trang_hang_xe_v" USING btree ("version_nguoi_viet_id");
  CREATE INDEX "_trang_hang_xe_v_version_version_nguoi_duyet_idx" ON "_trang_hang_xe_v" USING btree ("version_nguoi_duyet_id");
  CREATE INDEX "_trang_hang_xe_v_version_version_updated_at_idx" ON "_trang_hang_xe_v" USING btree ("version_updated_at");
  CREATE INDEX "_trang_hang_xe_v_version_version_created_at_idx" ON "_trang_hang_xe_v" USING btree ("version_created_at");
  CREATE INDEX "_trang_hang_xe_v_version_version__status_idx" ON "_trang_hang_xe_v" USING btree ("version__status");
  CREATE INDEX "_trang_hang_xe_v_created_at_idx" ON "_trang_hang_xe_v" USING btree ("created_at");
  CREATE INDEX "_trang_hang_xe_v_updated_at_idx" ON "_trang_hang_xe_v" USING btree ("updated_at");
  CREATE INDEX "_trang_hang_xe_v_latest_idx" ON "_trang_hang_xe_v" USING btree ("latest");
  CREATE INDEX "ma_xac_nhan_bien_so_idx" ON "ma_xac_nhan" USING btree ("bien_so");
  CREATE INDEX "ma_xac_nhan_phien_bam_idx" ON "ma_xac_nhan" USING btree ("phien_bam");
  CREATE INDEX "ma_xac_nhan_updated_at_idx" ON "ma_xac_nhan" USING btree ("updated_at");
  CREATE INDEX "ma_xac_nhan_created_at_idx" ON "ma_xac_nhan" USING btree ("created_at");
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_tho_id_tho_id_fk" FOREIGN KEY ("tho_id") REFERENCES "public"."tho"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_khuyen_mai_id_ma_khuyen_mai_id_fk" FOREIGN KEY ("khuyen_mai_id") REFERENCES "public"."ma_khuyen_mai"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_phieu_bao_hanh_id_phieu_bao_hanh_id_fk" FOREIGN KEY ("phieu_bao_hanh_id") REFERENCES "public"."phieu_bao_hanh"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cam_nang" ADD CONSTRAINT "cam_nang_nguoi_duyet_ky_thuat_id_users_id_fk" FOREIGN KEY ("nguoi_duyet_ky_thuat_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cam_nang" ADD CONSTRAINT "cam_nang_nguoi_viet_id_users_id_fk" FOREIGN KEY ("nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cam_nang" ADD CONSTRAINT "cam_nang_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cam_nang_v" ADD CONSTRAINT "_cam_nang_v_version_nguoi_duyet_ky_thuat_id_users_id_fk" FOREIGN KEY ("version_nguoi_duyet_ky_thuat_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cam_nang_v" ADD CONSTRAINT "_cam_nang_v_version_nguoi_viet_id_users_id_fk" FOREIGN KEY ("version_nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cam_nang_v" ADD CONSTRAINT "_cam_nang_v_version_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("version_nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dich_vu" ADD CONSTRAINT "dich_vu_nguoi_viet_id_users_id_fk" FOREIGN KEY ("nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dich_vu" ADD CONSTRAINT "dich_vu_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_dich_vu_v" ADD CONSTRAINT "_dich_vu_v_version_nguoi_viet_id_users_id_fk" FOREIGN KEY ("version_nguoi_viet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_dich_vu_v" ADD CONSTRAINT "_dich_vu_v_version_nguoi_duyet_id_users_id_fk" FOREIGN KEY ("version_nguoi_duyet_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bao_gia_fk" FOREIGN KEY ("bao_gia_id") REFERENCES "public"."bao_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_giao_dich_fk" FOREIGN KEY ("giao_dich_id") REFERENCES "public"."giao_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_phieu_bao_hanh_fk" FOREIGN KEY ("phieu_bao_hanh_id") REFERENCES "public"."phieu_bao_hanh"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tin_nhan_fk" FOREIGN KEY ("tin_nhan_id") REFERENCES "public"."tin_nhan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tho_fk" FOREIGN KEY ("tho_id") REFERENCES "public"."tho"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_khieu_nai_fk" FOREIGN KEY ("khieu_nai_id") REFERENCES "public"."khieu_nai"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ma_khuyen_mai_fk" FOREIGN KEY ("ma_khuyen_mai_id") REFERENCES "public"."ma_khuyen_mai"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_su_kien_fk" FOREIGN KEY ("su_kien_id") REFERENCES "public"."su_kien"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trang_khu_vuc_fk" FOREIGN KEY ("trang_khu_vuc_id") REFERENCES "public"."trang_khu_vuc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trang_hang_xe_fk" FOREIGN KEY ("trang_hang_xe_id") REFERENCES "public"."trang_hang_xe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ma_xac_nhan_fk" FOREIGN KEY ("ma_xac_nhan_id") REFERENCES "public"."ma_xac_nhan"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "don_hang_tho_idx" ON "don_hang" USING btree ("tho_id");
  CREATE INDEX "don_hang_khuyen_mai_idx" ON "don_hang" USING btree ("khuyen_mai_id");
  CREATE INDEX "don_hang_phieu_bao_hanh_idx" ON "don_hang" USING btree ("phieu_bao_hanh_id");
  CREATE UNIQUE INDEX "don_hang_danh_gia_danh_gia_token_idx" ON "don_hang" USING btree ("danh_gia_token");
  CREATE INDEX "cam_nang_nguoi_duyet_ky_thuat_idx" ON "cam_nang" USING btree ("nguoi_duyet_ky_thuat_id");
  CREATE INDEX "cam_nang_nguoi_viet_idx" ON "cam_nang" USING btree ("nguoi_viet_id");
  CREATE INDEX "cam_nang_nguoi_duyet_idx" ON "cam_nang" USING btree ("nguoi_duyet_id");
  CREATE INDEX "_cam_nang_v_version_version_nguoi_duyet_ky_thuat_idx" ON "_cam_nang_v" USING btree ("version_nguoi_duyet_ky_thuat_id");
  CREATE INDEX "_cam_nang_v_version_version_nguoi_viet_idx" ON "_cam_nang_v" USING btree ("version_nguoi_viet_id");
  CREATE INDEX "_cam_nang_v_version_version_nguoi_duyet_idx" ON "_cam_nang_v" USING btree ("version_nguoi_duyet_id");
  CREATE INDEX "dich_vu_nguoi_viet_idx" ON "dich_vu" USING btree ("nguoi_viet_id");
  CREATE INDEX "dich_vu_nguoi_duyet_idx" ON "dich_vu" USING btree ("nguoi_duyet_id");
  CREATE INDEX "_dich_vu_v_version_version_nguoi_viet_idx" ON "_dich_vu_v" USING btree ("version_nguoi_viet_id");
  CREATE INDEX "_dich_vu_v_version_version_nguoi_duyet_idx" ON "_dich_vu_v" USING btree ("version_nguoi_duyet_id");
  CREATE INDEX "payload_locked_documents_rels_bao_gia_id_idx" ON "payload_locked_documents_rels" USING btree ("bao_gia_id");
  CREATE INDEX "payload_locked_documents_rels_giao_dich_id_idx" ON "payload_locked_documents_rels" USING btree ("giao_dich_id");
  CREATE INDEX "payload_locked_documents_rels_phieu_bao_hanh_id_idx" ON "payload_locked_documents_rels" USING btree ("phieu_bao_hanh_id");
  CREATE INDEX "payload_locked_documents_rels_tin_nhan_id_idx" ON "payload_locked_documents_rels" USING btree ("tin_nhan_id");
  CREATE INDEX "payload_locked_documents_rels_tho_id_idx" ON "payload_locked_documents_rels" USING btree ("tho_id");
  CREATE INDEX "payload_locked_documents_rels_khieu_nai_id_idx" ON "payload_locked_documents_rels" USING btree ("khieu_nai_id");
  CREATE INDEX "payload_locked_documents_rels_ma_khuyen_mai_id_idx" ON "payload_locked_documents_rels" USING btree ("ma_khuyen_mai_id");
  CREATE INDEX "payload_locked_documents_rels_su_kien_id_idx" ON "payload_locked_documents_rels" USING btree ("su_kien_id");
  CREATE INDEX "payload_locked_documents_rels_trang_khu_vuc_id_idx" ON "payload_locked_documents_rels" USING btree ("trang_khu_vuc_id");
  CREATE INDEX "payload_locked_documents_rels_trang_hang_xe_id_idx" ON "payload_locked_documents_rels" USING btree ("trang_hang_xe_id");
  CREATE INDEX "payload_locked_documents_rels_ma_xac_nhan_id_idx" ON "payload_locked_documents_rels" USING btree ("ma_xac_nhan_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bao_gia_hang_muc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bao_gia" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bao_gia_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bao_gia_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "giao_dich" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "phieu_bao_hanh_hang_muc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "phieu_bao_hanh" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tin_nhan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tho_chung_chi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tho" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tho_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "khieu_nai_van_de" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "khieu_nai" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ma_khuyen_mai" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "su_kien" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trang_khu_vuc_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trang_khu_vuc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trang_khu_vuc_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trang_khu_vuc_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trang_khu_vuc_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trang_khu_vuc_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trang_hang_xe_benh_hay_gap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trang_hang_xe_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trang_hang_xe" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trang_hang_xe_v_version_benh_hay_gap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trang_hang_xe_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trang_hang_xe_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ma_xac_nhan" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "bao_gia_hang_muc" CASCADE;
  DROP TABLE "bao_gia" CASCADE;
  DROP TABLE "bao_gia_texts" CASCADE;
  DROP TABLE "bao_gia_rels" CASCADE;
  DROP TABLE "giao_dich" CASCADE;
  DROP TABLE "phieu_bao_hanh_hang_muc" CASCADE;
  DROP TABLE "phieu_bao_hanh" CASCADE;
  DROP TABLE "tin_nhan" CASCADE;
  DROP TABLE "tho_chung_chi" CASCADE;
  DROP TABLE "tho" CASCADE;
  DROP TABLE "tho_rels" CASCADE;
  DROP TABLE "khieu_nai_van_de" CASCADE;
  DROP TABLE "khieu_nai" CASCADE;
  DROP TABLE "ma_khuyen_mai" CASCADE;
  DROP TABLE "su_kien" CASCADE;
  DROP TABLE "trang_khu_vuc_faq" CASCADE;
  DROP TABLE "trang_khu_vuc" CASCADE;
  DROP TABLE "trang_khu_vuc_rels" CASCADE;
  DROP TABLE "_trang_khu_vuc_v_version_faq" CASCADE;
  DROP TABLE "_trang_khu_vuc_v" CASCADE;
  DROP TABLE "_trang_khu_vuc_v_rels" CASCADE;
  DROP TABLE "trang_hang_xe_benh_hay_gap" CASCADE;
  DROP TABLE "trang_hang_xe_faq" CASCADE;
  DROP TABLE "trang_hang_xe" CASCADE;
  DROP TABLE "_trang_hang_xe_v_version_benh_hay_gap" CASCADE;
  DROP TABLE "_trang_hang_xe_v_version_faq" CASCADE;
  DROP TABLE "_trang_hang_xe_v" CASCADE;
  DROP TABLE "ma_xac_nhan" CASCADE;
  ALTER TABLE "don_hang" DROP CONSTRAINT IF EXISTS "don_hang_tho_id_tho_id_fk";
  
  ALTER TABLE "don_hang" DROP CONSTRAINT IF EXISTS "don_hang_khuyen_mai_id_ma_khuyen_mai_id_fk";
  
  ALTER TABLE "don_hang" DROP CONSTRAINT IF EXISTS "don_hang_phieu_bao_hanh_id_phieu_bao_hanh_id_fk";
  
  ALTER TABLE "cam_nang" DROP CONSTRAINT IF EXISTS "cam_nang_nguoi_duyet_ky_thuat_id_users_id_fk";
  
  ALTER TABLE "cam_nang" DROP CONSTRAINT IF EXISTS "cam_nang_nguoi_viet_id_users_id_fk";
  
  ALTER TABLE "cam_nang" DROP CONSTRAINT IF EXISTS "cam_nang_nguoi_duyet_id_users_id_fk";
  
  ALTER TABLE "_cam_nang_v" DROP CONSTRAINT IF EXISTS "_cam_nang_v_version_nguoi_duyet_ky_thuat_id_users_id_fk";
  
  ALTER TABLE "_cam_nang_v" DROP CONSTRAINT IF EXISTS "_cam_nang_v_version_nguoi_viet_id_users_id_fk";
  
  ALTER TABLE "_cam_nang_v" DROP CONSTRAINT IF EXISTS "_cam_nang_v_version_nguoi_duyet_id_users_id_fk";
  
  ALTER TABLE "dich_vu" DROP CONSTRAINT IF EXISTS "dich_vu_nguoi_viet_id_users_id_fk";
  
  ALTER TABLE "dich_vu" DROP CONSTRAINT IF EXISTS "dich_vu_nguoi_duyet_id_users_id_fk";
  
  ALTER TABLE "_dich_vu_v" DROP CONSTRAINT IF EXISTS "_dich_vu_v_version_nguoi_viet_id_users_id_fk";
  
  ALTER TABLE "_dich_vu_v" DROP CONSTRAINT IF EXISTS "_dich_vu_v_version_nguoi_duyet_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bao_gia_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_giao_dich_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_phieu_bao_hanh_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tin_nhan_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tho_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_khieu_nai_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ma_khuyen_mai_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_su_kien_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_trang_khu_vuc_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_trang_hang_xe_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ma_xac_nhan_fk";
  
  ALTER TABLE "cam_nang" ALTER COLUMN "trang_thai_duyet" SET DATA TYPE text;
  ALTER TABLE "cam_nang" ALTER COLUMN "trang_thai_duyet" SET DEFAULT 'nhap'::text;
  DROP TYPE "public"."enum_cam_nang_trang_thai_duyet";
  CREATE TYPE "public"."enum_cam_nang_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  ALTER TABLE "cam_nang" ALTER COLUMN "trang_thai_duyet" SET DEFAULT 'nhap'::"public"."enum_cam_nang_trang_thai_duyet";
  ALTER TABLE "cam_nang" ALTER COLUMN "trang_thai_duyet" SET DATA TYPE "public"."enum_cam_nang_trang_thai_duyet" USING "trang_thai_duyet"::"public"."enum_cam_nang_trang_thai_duyet";
  ALTER TABLE "_cam_nang_v" ALTER COLUMN "version_trang_thai_duyet" SET DATA TYPE text;
  ALTER TABLE "_cam_nang_v" ALTER COLUMN "version_trang_thai_duyet" SET DEFAULT 'nhap'::text;
  DROP TYPE "public"."enum__cam_nang_v_version_trang_thai_duyet";
  CREATE TYPE "public"."enum__cam_nang_v_version_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  ALTER TABLE "_cam_nang_v" ALTER COLUMN "version_trang_thai_duyet" SET DEFAULT 'nhap'::"public"."enum__cam_nang_v_version_trang_thai_duyet";
  ALTER TABLE "_cam_nang_v" ALTER COLUMN "version_trang_thai_duyet" SET DATA TYPE "public"."enum__cam_nang_v_version_trang_thai_duyet" USING "version_trang_thai_duyet"::"public"."enum__cam_nang_v_version_trang_thai_duyet";
  ALTER TABLE "dich_vu" ALTER COLUMN "trang_thai_duyet" SET DATA TYPE text;
  ALTER TABLE "dich_vu" ALTER COLUMN "trang_thai_duyet" SET DEFAULT 'nhap'::text;
  DROP TYPE "public"."enum_dich_vu_trang_thai_duyet";
  CREATE TYPE "public"."enum_dich_vu_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  ALTER TABLE "dich_vu" ALTER COLUMN "trang_thai_duyet" SET DEFAULT 'nhap'::"public"."enum_dich_vu_trang_thai_duyet";
  ALTER TABLE "dich_vu" ALTER COLUMN "trang_thai_duyet" SET DATA TYPE "public"."enum_dich_vu_trang_thai_duyet" USING "trang_thai_duyet"::"public"."enum_dich_vu_trang_thai_duyet";
  ALTER TABLE "_dich_vu_v" ALTER COLUMN "version_trang_thai_duyet" SET DATA TYPE text;
  ALTER TABLE "_dich_vu_v" ALTER COLUMN "version_trang_thai_duyet" SET DEFAULT 'nhap'::text;
  DROP TYPE "public"."enum__dich_vu_v_version_trang_thai_duyet";
  CREATE TYPE "public"."enum__dich_vu_v_version_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  ALTER TABLE "_dich_vu_v" ALTER COLUMN "version_trang_thai_duyet" SET DEFAULT 'nhap'::"public"."enum__dich_vu_v_version_trang_thai_duyet";
  ALTER TABLE "_dich_vu_v" ALTER COLUMN "version_trang_thai_duyet" SET DATA TYPE "public"."enum__dich_vu_v_version_trang_thai_duyet" USING "version_trang_thai_duyet"::"public"."enum__dich_vu_v_version_trang_thai_duyet";
  DROP INDEX IF EXISTS "don_hang_tho_idx";
  DROP INDEX IF EXISTS "don_hang_khuyen_mai_idx";
  DROP INDEX IF EXISTS "don_hang_phieu_bao_hanh_idx";
  DROP INDEX IF EXISTS "don_hang_danh_gia_danh_gia_token_idx";
  DROP INDEX IF EXISTS "cam_nang_nguoi_duyet_ky_thuat_idx";
  DROP INDEX IF EXISTS "cam_nang_nguoi_viet_idx";
  DROP INDEX IF EXISTS "cam_nang_nguoi_duyet_idx";
  DROP INDEX IF EXISTS "_cam_nang_v_version_version_nguoi_duyet_ky_thuat_idx";
  DROP INDEX IF EXISTS "_cam_nang_v_version_version_nguoi_viet_idx";
  DROP INDEX IF EXISTS "_cam_nang_v_version_version_nguoi_duyet_idx";
  DROP INDEX IF EXISTS "dich_vu_nguoi_viet_idx";
  DROP INDEX IF EXISTS "dich_vu_nguoi_duyet_idx";
  DROP INDEX IF EXISTS "_dich_vu_v_version_version_nguoi_viet_idx";
  DROP INDEX IF EXISTS "_dich_vu_v_version_version_nguoi_duyet_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_bao_gia_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_giao_dich_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_phieu_bao_hanh_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tin_nhan_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tho_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_khieu_nai_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_ma_khuyen_mai_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_su_kien_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_trang_khu_vuc_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_trang_hang_xe_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_ma_xac_nhan_id_idx";
  ALTER TABLE "don_hang" DROP COLUMN "tho_id";
  ALTER TABLE "don_hang" DROP COLUMN "tho_du_kien_den_luc";
  ALTER TABLE "don_hang" DROP COLUMN "vi_tri_tho_lat";
  ALTER TABLE "don_hang" DROP COLUMN "vi_tri_tho_lng";
  ALTER TABLE "don_hang" DROP COLUMN "vi_tri_tho_luc";
  ALTER TABLE "don_hang" DROP COLUMN "ket_qua";
  ALTER TABLE "don_hang" DROP COLUMN "khuyen_mai_id";
  ALTER TABLE "don_hang" DROP COLUMN "xong_luc";
  ALTER TABLE "don_hang" DROP COLUMN "so_km_khi_xong";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_so_tien";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_giam";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_da_nhan";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_trang_thai";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_chi_tiet";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_thanh_toan_luc";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_ma_giao_dich";
  ALTER TABLE "don_hang" DROP COLUMN "thanh_toan_hinh_thuc";
  ALTER TABLE "don_hang" DROP COLUMN "hoa_don_dien_tu_so";
  ALTER TABLE "don_hang" DROP COLUMN "hoa_don_dien_tu_ky_hieu";
  ALTER TABLE "don_hang" DROP COLUMN "hoa_don_dien_tu_ma_c_q_t";
  ALTER TABLE "don_hang" DROP COLUMN "hoa_don_dien_tu_xuat_luc";
  ALTER TABLE "don_hang" DROP COLUMN "hoa_don_dien_tu_link_xem";
  ALTER TABLE "don_hang" DROP COLUMN "hoa_don_dien_tu_link_pdf";
  ALTER TABLE "don_hang" DROP COLUMN "hoa_don_dien_tu_loi";
  ALTER TABLE "don_hang" DROP COLUMN "phieu_bao_hanh_id";
  ALTER TABLE "don_hang" DROP COLUMN "danh_gia_gui_luc";
  ALTER TABLE "don_hang" DROP COLUMN "danh_gia_luc";
  ALTER TABLE "don_hang" DROP COLUMN "danh_gia_so_sao";
  ALTER TABLE "don_hang" DROP COLUMN "danh_gia_token";
  ALTER TABLE "cam_nang" DROP COLUMN "chu_de";
  ALTER TABLE "cam_nang" DROP COLUMN "nguoi_duyet_ky_thuat_id";
  ALTER TABLE "cam_nang" DROP COLUMN "thoi_gian_doc_phut";
  ALTER TABLE "cam_nang" DROP COLUMN "hen_gio_dang";
  ALTER TABLE "cam_nang" DROP COLUMN "nguoi_viet_id";
  ALTER TABLE "cam_nang" DROP COLUMN "nguoi_duyet_id";
  ALTER TABLE "_cam_nang_v" DROP COLUMN "version_chu_de";
  ALTER TABLE "_cam_nang_v" DROP COLUMN "version_nguoi_duyet_ky_thuat_id";
  ALTER TABLE "_cam_nang_v" DROP COLUMN "version_thoi_gian_doc_phut";
  ALTER TABLE "_cam_nang_v" DROP COLUMN "version_hen_gio_dang";
  ALTER TABLE "_cam_nang_v" DROP COLUMN "version_nguoi_viet_id";
  ALTER TABLE "_cam_nang_v" DROP COLUMN "version_nguoi_duyet_id";
  ALTER TABLE "dich_vu" DROP COLUMN "hen_gio_dang";
  ALTER TABLE "dich_vu" DROP COLUMN "nguoi_viet_id";
  ALTER TABLE "dich_vu" DROP COLUMN "nguoi_duyet_id";
  ALTER TABLE "_dich_vu_v" DROP COLUMN "version_hen_gio_dang";
  ALTER TABLE "_dich_vu_v" DROP COLUMN "version_nguoi_viet_id";
  ALTER TABLE "_dich_vu_v" DROP COLUMN "version_nguoi_duyet_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bao_gia_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "giao_dich_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "phieu_bao_hanh_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tin_nhan_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tho_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "khieu_nai_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ma_khuyen_mai_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "su_kien_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trang_khu_vuc_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trang_hang_xe_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ma_xac_nhan_id";
  ALTER TABLE "bang_gia_chung" DROP COLUMN "chu_ky_bao_duong_km";
  ALTER TABLE "bang_gia_chung" DROP COLUMN "chu_ky_bao_duong_thang";
  ALTER TABLE "cai_dat" DROP COLUMN "ngan_hang_bin";
  ALTER TABLE "cai_dat" DROP COLUMN "ngan_hang_ten";
  ALTER TABLE "cai_dat" DROP COLUMN "so_tai_khoan";
  ALTER TABLE "cai_dat" DROP COLUMN "chu_tai_khoan";
  ALTER TABLE "cai_dat" DROP COLUMN "sdt_cskh";
  ALTER TABLE "cai_dat" DROP COLUMN "ten_cskh";
  ALTER TABLE "cai_dat" DROP COLUMN "cskh_goi_lai_gio";
  ALTER TABLE "cai_dat" DROP COLUMN "muc_tieu_ty_le_dat_lich";
  DROP TYPE "public"."enum_don_hang_ket_qua";
  DROP TYPE "public"."enum_don_hang_thanh_toan_trang_thai";
  DROP TYPE "public"."enum_bao_gia_hang_muc_loai";
  DROP TYPE "public"."enum_bao_gia_hang_muc_muc_do";
  DROP TYPE "public"."enum_bao_gia_trang_thai";
  DROP TYPE "public"."enum_giao_dich_hinh_thuc";
  DROP TYPE "public"."enum_giao_dich_ket_qua";
  DROP TYPE "public"."enum_phieu_bao_hanh_hang_muc_loai";
  DROP TYPE "public"."enum_tin_nhan_kenh";
  DROP TYPE "public"."enum_tin_nhan_trang_thai";
  DROP TYPE "public"."enum_khieu_nai_van_de";
  DROP TYPE "public"."enum_khieu_nai_trang_thai";
  DROP TYPE "public"."enum_ma_khuyen_mai_loai";
  DROP TYPE "public"."enum_ma_khuyen_mai_kieu_giam";
  DROP TYPE "public"."enum_su_kien_loai";
  DROP TYPE "public"."enum_cam_nang_chu_de";
  DROP TYPE "public"."enum__cam_nang_v_version_chu_de";
  DROP TYPE "public"."enum_trang_khu_vuc_trang_thai_duyet";
  DROP TYPE "public"."enum_trang_khu_vuc_status";
  DROP TYPE "public"."enum__trang_khu_vuc_v_version_trang_thai_duyet";
  DROP TYPE "public"."enum__trang_khu_vuc_v_version_status";
  DROP TYPE "public"."enum_trang_hang_xe_trang_thai_duyet";
  DROP TYPE "public"."enum_trang_hang_xe_status";
  DROP TYPE "public"."enum__trang_hang_xe_v_version_trang_thai_duyet";
  DROP TYPE "public"."enum__trang_hang_xe_v_version_status";
  DROP SEQUENCE IF EXISTS "ma_so_bh";
  DROP SEQUENCE IF EXISTS "ma_so_kn";`)
}
