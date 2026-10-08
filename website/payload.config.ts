import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import sharp from "sharp";

import { CamNang } from "./collections/CamNang";
import { DatLich } from "./collections/DatLich";
import { DichVu } from "./collections/DichVu";
import { Media } from "./collections/Media";
import { TuKhoa } from "./collections/TuKhoa";
import { Users } from "./collections/Users";
import { CaiDat } from "./globals/CaiDat";
import { KeHoachSeo } from "./globals/KeHoachSeo";
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
  collections: [CamNang, DichVu, TuKhoa, DatLich, Media, Users],
  globals: [CaiDat, KeHoachSeo],
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
