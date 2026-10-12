import type { CollectionConfig } from "payload";
import { chiQuanTri } from "../lib/quyen";

// Mã 6 số tra cứu lịch sử xe và phiên xem sau khi nhập đúng. Chỉ lưu mã đã băm. Không ai đọc qua API (trừ quản trị).
export const MaXacNhan: CollectionConfig = {
  slug: "ma-xac-nhan",
  labels: { singular: "Mã xác nhận", plural: "Mã xác nhận tra cứu xe" },
  admin: { useAsTitle: "bienSo", group: "Hệ thống", hidden: ({ user }) => (user as { vaiTro?: string } | null)?.vaiTro !== "quanTri" },
  access: { read: chiQuanTri, create: () => false, update: () => false, delete: chiQuanTri },
  fields: [
    { name: "bienSo", type: "text", index: true },
    { name: "sdt", type: "text" },
    { name: "maBam", type: "text" },
    { name: "kenh", type: "text" },
    { name: "guiLuc", type: "date" },
    { name: "hetHanLuc", type: "date" },
    { name: "soLanThu", type: "number", defaultValue: 0 },
    { name: "daDung", type: "checkbox", defaultValue: false },
    { name: "phienBam", type: "text", index: true },
    { name: "phienHetHanLuc", type: "date" },
  ],
};
