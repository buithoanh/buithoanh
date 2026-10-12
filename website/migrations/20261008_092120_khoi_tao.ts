import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cam_nang_nguon_tham_khao_loai" AS ENUM('vcwiki', 'web', 'hang');
  CREATE TYPE "public"."enum_cam_nang_nhom" AS ENUM('Khẩn cấp', 'Ắc quy', 'Lốp', 'Tận nơi', 'Bảo dưỡng', 'Chẩn đoán', 'Xe điện', 'Bản đồ', 'Thông tin');
  CREATE TYPE "public"."enum_cam_nang_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  CREATE TYPE "public"."enum_cam_nang_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cam_nang_v_version_nguon_tham_khao_loai" AS ENUM('vcwiki', 'web', 'hang');
  CREATE TYPE "public"."enum__cam_nang_v_version_nhom" AS ENUM('Khẩn cấp', 'Ắc quy', 'Lốp', 'Tận nơi', 'Bảo dưỡng', 'Chẩn đoán', 'Xe điện', 'Bản đồ', 'Thông tin');
  CREATE TYPE "public"."enum__cam_nang_v_version_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  CREATE TYPE "public"."enum__cam_nang_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_dich_vu_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  CREATE TYPE "public"."enum_dich_vu_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__dich_vu_v_version_trang_thai_duyet" AS ENUM('nhap', 'choDuyet', 'canSua', 'daDuyet');
  CREATE TYPE "public"."enum__dich_vu_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_tu_khoa_nhom" AS ENUM('Khẩn cấp', 'Ắc quy', 'Lốp', 'Tận nơi', 'Bảo dưỡng', 'Chẩn đoán', 'Xe điện', 'Bản đồ', 'Thông tin');
  CREATE TYPE "public"."enum_tu_khoa_trang_thai" AS ENUM('chuaViet', 'dangViet', 'daCoBai', 'boQua');
  CREATE TYPE "public"."enum_tu_khoa_ai_trang_thai" AS ENUM('chuaChay', 'dangChay', 'xong', 'loi');
  CREATE TYPE "public"."enum_dat_lich_trang_thai" AS ENUM('moi', 'daGoi', 'daHen', 'xong', 'huy');
  CREATE TYPE "public"."enum_users_vai_tro" AS ENUM('quanTri', 'duyetBai', 'bienTap');
  CREATE TABLE "cam_nang_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "cam_nang_nguon_tham_khao" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ten" varchar,
  	"url" varchar,
  	"loai" "enum_cam_nang_nguon_tham_khao_loai" DEFAULT 'web'
  );
  
  CREATE TABLE "cam_nang" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"keyword" varchar,
  	"nhom" "enum_cam_nang_nhom",
  	"noi_dung" jsonb,
  	"slug" varchar,
  	"ngay" timestamp(3) with time zone,
  	"cap_nhat" timestamp(3) with time zone,
  	"trang_thai_duyet" "enum_cam_nang_trang_thai_duyet" DEFAULT 'nhap',
  	"ghi_chu_duyet" varchar,
  	"gia_da_duyet" boolean DEFAULT false,
  	"ket_qua_kiem_tra" varchar,
  	"ghi_chu_a_i" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_cam_nang_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cam_nang_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"dich_vu_id" integer
  );
  
  CREATE TABLE "_cam_nang_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cam_nang_v_version_nguon_tham_khao" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar,
  	"url" varchar,
  	"loai" "enum__cam_nang_v_version_nguon_tham_khao_loai" DEFAULT 'web',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cam_nang_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_keyword" varchar,
  	"version_nhom" "enum__cam_nang_v_version_nhom",
  	"version_noi_dung" jsonb,
  	"version_slug" varchar,
  	"version_ngay" timestamp(3) with time zone,
  	"version_cap_nhat" timestamp(3) with time zone,
  	"version_trang_thai_duyet" "enum__cam_nang_v_version_trang_thai_duyet" DEFAULT 'nhap',
  	"version_ghi_chu_duyet" varchar,
  	"version_gia_da_duyet" boolean DEFAULT false,
  	"version_ket_qua_kiem_tra" varchar,
  	"version_ghi_chu_a_i" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cam_nang_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_cam_nang_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"dich_vu_id" integer
  );
  
  CREATE TABLE "dich_vu_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "dich_vu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar,
  	"tom_tat" varchar,
  	"title" varchar,
  	"description" varchar,
  	"keyword" varchar,
  	"noi_dung" jsonb,
  	"slug" varchar,
  	"thu_tu" numeric DEFAULT 99,
  	"trang_thai_duyet" "enum_dich_vu_trang_thai_duyet" DEFAULT 'nhap',
  	"ghi_chu_duyet" varchar,
  	"gia_da_duyet" boolean DEFAULT false,
  	"ket_qua_kiem_tra" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_dich_vu_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_dich_vu_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_dich_vu_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_ten" varchar,
  	"version_tom_tat" varchar,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_keyword" varchar,
  	"version_noi_dung" jsonb,
  	"version_slug" varchar,
  	"version_thu_tu" numeric DEFAULT 99,
  	"version_trang_thai_duyet" "enum__dich_vu_v_version_trang_thai_duyet" DEFAULT 'nhap',
  	"version_ghi_chu_duyet" varchar,
  	"version_gia_da_duyet" boolean DEFAULT false,
  	"version_ket_qua_kiem_tra" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__dich_vu_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "tu_khoa" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tu_khoa" varchar NOT NULL,
  	"nhom" "enum_tu_khoa_nhom" NOT NULL,
  	"y_dinh" varchar,
  	"luot_tim_thang" varchar,
  	"dich_vu_id" integer,
  	"trang_thai" "enum_tu_khoa_trang_thai" DEFAULT 'chuaViet',
  	"bai_viet_id" integer,
  	"ghi_chu" varchar,
  	"ai_trang_thai" "enum_tu_khoa_ai_trang_thai" DEFAULT 'chuaChay',
  	"ai_thong_bao" varchar,
  	"ai_bat_dau_luc" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
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
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
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
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar,
  	"vai_tro" "enum_users_vai_tro" DEFAULT 'bienTap' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cam_nang_id" integer,
  	"dich_vu_id" integer,
  	"tu_khoa_id" integer,
  	"dat_lich_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cai_dat_khu_vuc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL
  );
  
  CREATE TABLE "cai_dat" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hotline" varchar,
  	"zalo" varchar,
  	"email" varchar,
  	"xuong_doi_tac" varchar DEFAULT 'xưởng Auto Speedy',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ke_hoach_seo_lich_dang" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"thang" varchar NOT NULL,
  	"bai_cam_nang" numeric,
  	"trang_khac" varchar,
  	"chu_de" varchar
  );
  
  CREATE TABLE "ke_hoach_seo_quy_tac" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"noi_dung" varchar NOT NULL
  );
  
  CREATE TABLE "ke_hoach_seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nguon" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cam_nang_faq" ADD CONSTRAINT "cam_nang_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cam_nang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cam_nang_nguon_tham_khao" ADD CONSTRAINT "cam_nang_nguon_tham_khao_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cam_nang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cam_nang_rels" ADD CONSTRAINT "cam_nang_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cam_nang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cam_nang_rels" ADD CONSTRAINT "cam_nang_rels_dich_vu_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."dich_vu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cam_nang_v_version_faq" ADD CONSTRAINT "_cam_nang_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cam_nang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cam_nang_v_version_nguon_tham_khao" ADD CONSTRAINT "_cam_nang_v_version_nguon_tham_khao_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cam_nang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cam_nang_v" ADD CONSTRAINT "_cam_nang_v_parent_id_cam_nang_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cam_nang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cam_nang_v_rels" ADD CONSTRAINT "_cam_nang_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cam_nang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cam_nang_v_rels" ADD CONSTRAINT "_cam_nang_v_rels_dich_vu_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."dich_vu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dich_vu_faq" ADD CONSTRAINT "dich_vu_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."dich_vu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dich_vu_v_version_faq" ADD CONSTRAINT "_dich_vu_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_dich_vu_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dich_vu_v" ADD CONSTRAINT "_dich_vu_v_parent_id_dich_vu_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tu_khoa" ADD CONSTRAINT "tu_khoa_dich_vu_id_dich_vu_id_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."dich_vu"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tu_khoa" ADD CONSTRAINT "tu_khoa_bai_viet_id_cam_nang_id_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "public"."cam_nang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cam_nang_fk" FOREIGN KEY ("cam_nang_id") REFERENCES "public"."cam_nang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dich_vu_fk" FOREIGN KEY ("dich_vu_id") REFERENCES "public"."dich_vu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tu_khoa_fk" FOREIGN KEY ("tu_khoa_id") REFERENCES "public"."tu_khoa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dat_lich_fk" FOREIGN KEY ("dat_lich_id") REFERENCES "public"."dat_lich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cai_dat_khu_vuc" ADD CONSTRAINT "cai_dat_khu_vuc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cai_dat"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ke_hoach_seo_lich_dang" ADD CONSTRAINT "ke_hoach_seo_lich_dang_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ke_hoach_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ke_hoach_seo_quy_tac" ADD CONSTRAINT "ke_hoach_seo_quy_tac_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ke_hoach_seo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cam_nang_faq_order_idx" ON "cam_nang_faq" USING btree ("_order");
  CREATE INDEX "cam_nang_faq_parent_id_idx" ON "cam_nang_faq" USING btree ("_parent_id");
  CREATE INDEX "cam_nang_nguon_tham_khao_order_idx" ON "cam_nang_nguon_tham_khao" USING btree ("_order");
  CREATE INDEX "cam_nang_nguon_tham_khao_parent_id_idx" ON "cam_nang_nguon_tham_khao" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "cam_nang_slug_idx" ON "cam_nang" USING btree ("slug");
  CREATE INDEX "cam_nang_updated_at_idx" ON "cam_nang" USING btree ("updated_at");
  CREATE INDEX "cam_nang_created_at_idx" ON "cam_nang" USING btree ("created_at");
  CREATE INDEX "cam_nang__status_idx" ON "cam_nang" USING btree ("_status");
  CREATE INDEX "cam_nang_rels_order_idx" ON "cam_nang_rels" USING btree ("order");
  CREATE INDEX "cam_nang_rels_parent_idx" ON "cam_nang_rels" USING btree ("parent_id");
  CREATE INDEX "cam_nang_rels_path_idx" ON "cam_nang_rels" USING btree ("path");
  CREATE INDEX "cam_nang_rels_dich_vu_id_idx" ON "cam_nang_rels" USING btree ("dich_vu_id");
  CREATE INDEX "_cam_nang_v_version_faq_order_idx" ON "_cam_nang_v_version_faq" USING btree ("_order");
  CREATE INDEX "_cam_nang_v_version_faq_parent_id_idx" ON "_cam_nang_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_cam_nang_v_version_nguon_tham_khao_order_idx" ON "_cam_nang_v_version_nguon_tham_khao" USING btree ("_order");
  CREATE INDEX "_cam_nang_v_version_nguon_tham_khao_parent_id_idx" ON "_cam_nang_v_version_nguon_tham_khao" USING btree ("_parent_id");
  CREATE INDEX "_cam_nang_v_parent_idx" ON "_cam_nang_v" USING btree ("parent_id");
  CREATE INDEX "_cam_nang_v_version_version_slug_idx" ON "_cam_nang_v" USING btree ("version_slug");
  CREATE INDEX "_cam_nang_v_version_version_updated_at_idx" ON "_cam_nang_v" USING btree ("version_updated_at");
  CREATE INDEX "_cam_nang_v_version_version_created_at_idx" ON "_cam_nang_v" USING btree ("version_created_at");
  CREATE INDEX "_cam_nang_v_version_version__status_idx" ON "_cam_nang_v" USING btree ("version__status");
  CREATE INDEX "_cam_nang_v_created_at_idx" ON "_cam_nang_v" USING btree ("created_at");
  CREATE INDEX "_cam_nang_v_updated_at_idx" ON "_cam_nang_v" USING btree ("updated_at");
  CREATE INDEX "_cam_nang_v_latest_idx" ON "_cam_nang_v" USING btree ("latest");
  CREATE INDEX "_cam_nang_v_rels_order_idx" ON "_cam_nang_v_rels" USING btree ("order");
  CREATE INDEX "_cam_nang_v_rels_parent_idx" ON "_cam_nang_v_rels" USING btree ("parent_id");
  CREATE INDEX "_cam_nang_v_rels_path_idx" ON "_cam_nang_v_rels" USING btree ("path");
  CREATE INDEX "_cam_nang_v_rels_dich_vu_id_idx" ON "_cam_nang_v_rels" USING btree ("dich_vu_id");
  CREATE INDEX "dich_vu_faq_order_idx" ON "dich_vu_faq" USING btree ("_order");
  CREATE INDEX "dich_vu_faq_parent_id_idx" ON "dich_vu_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "dich_vu_slug_idx" ON "dich_vu" USING btree ("slug");
  CREATE INDEX "dich_vu_updated_at_idx" ON "dich_vu" USING btree ("updated_at");
  CREATE INDEX "dich_vu_created_at_idx" ON "dich_vu" USING btree ("created_at");
  CREATE INDEX "dich_vu__status_idx" ON "dich_vu" USING btree ("_status");
  CREATE INDEX "_dich_vu_v_version_faq_order_idx" ON "_dich_vu_v_version_faq" USING btree ("_order");
  CREATE INDEX "_dich_vu_v_version_faq_parent_id_idx" ON "_dich_vu_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_dich_vu_v_parent_idx" ON "_dich_vu_v" USING btree ("parent_id");
  CREATE INDEX "_dich_vu_v_version_version_slug_idx" ON "_dich_vu_v" USING btree ("version_slug");
  CREATE INDEX "_dich_vu_v_version_version_updated_at_idx" ON "_dich_vu_v" USING btree ("version_updated_at");
  CREATE INDEX "_dich_vu_v_version_version_created_at_idx" ON "_dich_vu_v" USING btree ("version_created_at");
  CREATE INDEX "_dich_vu_v_version_version__status_idx" ON "_dich_vu_v" USING btree ("version__status");
  CREATE INDEX "_dich_vu_v_created_at_idx" ON "_dich_vu_v" USING btree ("created_at");
  CREATE INDEX "_dich_vu_v_updated_at_idx" ON "_dich_vu_v" USING btree ("updated_at");
  CREATE INDEX "_dich_vu_v_latest_idx" ON "_dich_vu_v" USING btree ("latest");
  CREATE UNIQUE INDEX "tu_khoa_tu_khoa_idx" ON "tu_khoa" USING btree ("tu_khoa");
  CREATE INDEX "tu_khoa_dich_vu_idx" ON "tu_khoa" USING btree ("dich_vu_id");
  CREATE INDEX "tu_khoa_bai_viet_idx" ON "tu_khoa" USING btree ("bai_viet_id");
  CREATE INDEX "tu_khoa_updated_at_idx" ON "tu_khoa" USING btree ("updated_at");
  CREATE INDEX "tu_khoa_created_at_idx" ON "tu_khoa" USING btree ("created_at");
  CREATE INDEX "dat_lich_updated_at_idx" ON "dat_lich" USING btree ("updated_at");
  CREATE INDEX "dat_lich_created_at_idx" ON "dat_lich" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_cam_nang_id_idx" ON "payload_locked_documents_rels" USING btree ("cam_nang_id");
  CREATE INDEX "payload_locked_documents_rels_dich_vu_id_idx" ON "payload_locked_documents_rels" USING btree ("dich_vu_id");
  CREATE INDEX "payload_locked_documents_rels_tu_khoa_id_idx" ON "payload_locked_documents_rels" USING btree ("tu_khoa_id");
  CREATE INDEX "payload_locked_documents_rels_dat_lich_id_idx" ON "payload_locked_documents_rels" USING btree ("dat_lich_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "cai_dat_khu_vuc_order_idx" ON "cai_dat_khu_vuc" USING btree ("_order");
  CREATE INDEX "cai_dat_khu_vuc_parent_id_idx" ON "cai_dat_khu_vuc" USING btree ("_parent_id");
  CREATE INDEX "ke_hoach_seo_lich_dang_order_idx" ON "ke_hoach_seo_lich_dang" USING btree ("_order");
  CREATE INDEX "ke_hoach_seo_lich_dang_parent_id_idx" ON "ke_hoach_seo_lich_dang" USING btree ("_parent_id");
  CREATE INDEX "ke_hoach_seo_quy_tac_order_idx" ON "ke_hoach_seo_quy_tac" USING btree ("_order");
  CREATE INDEX "ke_hoach_seo_quy_tac_parent_id_idx" ON "ke_hoach_seo_quy_tac" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cam_nang_faq" CASCADE;
  DROP TABLE "cam_nang_nguon_tham_khao" CASCADE;
  DROP TABLE "cam_nang" CASCADE;
  DROP TABLE "cam_nang_rels" CASCADE;
  DROP TABLE "_cam_nang_v_version_faq" CASCADE;
  DROP TABLE "_cam_nang_v_version_nguon_tham_khao" CASCADE;
  DROP TABLE "_cam_nang_v" CASCADE;
  DROP TABLE "_cam_nang_v_rels" CASCADE;
  DROP TABLE "dich_vu_faq" CASCADE;
  DROP TABLE "dich_vu" CASCADE;
  DROP TABLE "_dich_vu_v_version_faq" CASCADE;
  DROP TABLE "_dich_vu_v" CASCADE;
  DROP TABLE "tu_khoa" CASCADE;
  DROP TABLE "dat_lich" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "cai_dat_khu_vuc" CASCADE;
  DROP TABLE "cai_dat" CASCADE;
  DROP TABLE "ke_hoach_seo_lich_dang" CASCADE;
  DROP TABLE "ke_hoach_seo_quy_tac" CASCADE;
  DROP TABLE "ke_hoach_seo" CASCADE;
  DROP TYPE "public"."enum_cam_nang_nguon_tham_khao_loai";
  DROP TYPE "public"."enum_cam_nang_nhom";
  DROP TYPE "public"."enum_cam_nang_trang_thai_duyet";
  DROP TYPE "public"."enum_cam_nang_status";
  DROP TYPE "public"."enum__cam_nang_v_version_nguon_tham_khao_loai";
  DROP TYPE "public"."enum__cam_nang_v_version_nhom";
  DROP TYPE "public"."enum__cam_nang_v_version_trang_thai_duyet";
  DROP TYPE "public"."enum__cam_nang_v_version_status";
  DROP TYPE "public"."enum_dich_vu_trang_thai_duyet";
  DROP TYPE "public"."enum_dich_vu_status";
  DROP TYPE "public"."enum__dich_vu_v_version_trang_thai_duyet";
  DROP TYPE "public"."enum__dich_vu_v_version_status";
  DROP TYPE "public"."enum_tu_khoa_nhom";
  DROP TYPE "public"."enum_tu_khoa_trang_thai";
  DROP TYPE "public"."enum_tu_khoa_ai_trang_thai";
  DROP TYPE "public"."enum_dat_lich_trang_thai";
  DROP TYPE "public"."enum_users_vai_tro";`)
}
