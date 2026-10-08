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
    DonHang, TepDonHang, DanhGia,
    DanhMucDichVu, HangMucGia, NhatKyGia, HangXe, DongXe,
    Quan, Phuong,
    CamNang, DichVu, TuKhoa, Media, Users,
  ],
  globals: [BangGiaChung, LichNhanDon, CaiDat, KeHoachSeo],
  endpoints: endpointCongKhai,
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
