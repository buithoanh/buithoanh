import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import sharp from "sharp";

import { CamNang } from "./collections/CamNang";
import { DanhGia } from "./collections/DanhGia";
import { DanhMucDichVu } from "./collections/DanhMucDichVu";
import { DichVu } from "./collections/DichVu";
import { DonHang } from "./collections/DonHang";
import { DongXe } from "./collections/DongXe";
import { HangMucGia } from "./collections/HangMucGia";
import { HangXe } from "./collections/HangXe";
import { Media } from "./collections/Media";
import { NhatKyGia } from "./collections/NhatKyGia";
import { Phuong } from "./collections/Phuong";
import { Quan } from "./collections/Quan";
import { TepDonHang } from "./collections/TepDonHang";
import { TuKhoa } from "./collections/TuKhoa";
import { Users } from "./collections/Users";
import { BangGiaChung } from "./globals/BangGiaChung";
import { CaiDat } from "./globals/CaiDat";
import { KeHoachSeo } from "./globals/KeHoachSeo";
import { LichNhanDon } from "./globals/LichNhanDon";
import { endpointCongKhai } from "./lib/api/cong-khai";
import { endpointP1 } from "./lib/api/p1";
import { BaoGia } from "./collections/BaoGia";
import { GiaoDich } from "./collections/GiaoDich";
import { KhieuNai } from "./collections/KhieuNai";
import { MaKhuyenMai } from "./collections/MaKhuyenMai";
import { MaXacNhan } from "./collections/MaXacNhan";
import { PhieuBaoHanh } from "./collections/PhieuBaoHanh";
import { SuKien } from "./collections/SuKien";
import { Tho } from "./collections/Tho";
import { TinNhan } from "./collections/TinNhan";
import { TrangHangXe } from "./collections/TrangHangXe";
import { TrangKhuVuc } from "./collections/TrangKhuVuc";
import { GoiHoiVien } from "./collections/GoiHoiVien";
import { HoiVien } from "./collections/HoiVien";
import { MaGioiThieu } from "./collections/MaGioiThieu";
import { YeuCauDoanhNghiep } from "./collections/YeuCauDoanhNghiep";
import { HoSoTho, TepHoSo } from "./collections/HoSoTho";
import { endpointP2 } from "./lib/api/p2";
import { tinhTrangTichHop } from "./lib/tich-hop/chung";
import { migrations } from "./migrations";
import { tinhNang } from "./lib/soan-thao";
import site from "./site.config.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production" && !process.env.PAYLOAD_SECRET) {
  throw new Error("Thiếu biến môi trường PAYLOAD_SECRET");
}

export default buildConfig({
  serverURL: site.url,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ` – ${site.name}` },
    avatar: "default",
  },
  collections: [
    DonHang, BaoGia, GiaoDich, PhieuBaoHanh, TepDonHang, TinNhan, Tho,
    DanhGia, KhieuNai, GoiHoiVien, HoiVien, YeuCauDoanhNghiep,
    DanhMucDichVu, HangMucGia, NhatKyGia, HangXe, DongXe,
    Quan, Phuong,
    MaKhuyenMai, MaGioiThieu, SuKien,
    CamNang, DichVu, TrangKhuVuc, TrangHangXe, TuKhoa, Media,
    HoSoTho, TepHoSo,
    Users, MaXacNhan,
  ],
  globals: [BangGiaChung, LichNhanDon, CaiDat, KeHoachSeo],
  endpoints: [...endpointCongKhai, ...endpointP1, ...endpointP2],
  onInit: async (payload) => {
    // Báo ngay lúc khởi động tích hợp nào đang giả lập hoặc thiếu cấu hình (xem lib/tich-hop/chung.ts).
    for (const t of tinhTrangTichHop()) {
      if (t.tinhTrang === "that") continue;
      const msg = `Tích hợp "${t.ten}" (${t.moTa}): ${t.tinhTrang === "giaLap" ? "đang GIẢ LẬP" : "CHƯA CẤU HÌNH, gọi tới sẽ báo lỗi"}, thiếu ${t.thieu.join(", ")}`;
      if (t.tinhTrang === "loi") payload.logger.error(msg);
      else payload.logger.warn(msg);
    }
  },
  editor: lexicalEditor({ features: tinhNang }),
  i18n: { supportedLanguages: { vi }, fallbackLanguage: "vi" },
  secret: process.env.PAYLOAD_SECRET || "chi-dung-khi-chay-thu-tren-may",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || "" },
    // Khi chạy thử (npm run dev) tự cập nhật bảng; production dùng migration.
    push: process.env.NODE_ENV !== "production",
    migrationDir: path.resolve(dirname, "migrations"),
    // Server production tự chạy migration còn thiếu mỗi lần khởi động.
    prodMigrations: migrations,
  }),
  sharp,
});
