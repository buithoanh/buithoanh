import type { CollectionConfig } from "payload";
import { chiQuanTri, la } from "../lib/quyen";

const xem = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu", "marketing");
const sua = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "marketing");

// Mã giới thiệu bạn bè: mỗi số điện thoại khách một mã (TUAN2481). Số đơn hoàn thành, lượt thưởng, lượt đã dùng
// tính từ đơn hàng và hội viên (lib/gioi-thieu.ts), chỉ lượt mở link là bộ đếm.
export const MaGioiThieu: CollectionConfig = {
  slug: "ma-gioi-thieu",
  labels: { singular: "Mã giới thiệu", plural: "Mã giới thiệu bạn bè" },
  admin: { useAsTitle: "ma", defaultColumns: ["ma", "hoTen", "soLuotMo", "createdAt"], group: "Marketing" },
  defaultSort: "-createdAt",
  access: { read: xem, create: sua, update: sua, delete: chiQuanTri },
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã", type: "text", required: true, unique: true, index: true },
      { name: "sdt", label: "Số điện thoại chủ mã", type: "text", required: true, unique: true, index: true },
      { name: "hoTen", label: "Họ tên", type: "text" },
    ] },
    { type: "row", fields: [
      { name: "soLuotMo", label: "Lượt mở link", type: "number", defaultValue: 0, admin: { readOnly: true } },
      { name: "luotThuongThem", label: "Lượt miễn phí cộng tay", type: "number", defaultValue: 0, admin: { description: "CSKH bù cho khách (có thể âm để trừ)." } },
      { name: "tamDung", label: "Tạm dừng mã", type: "checkbox" },
    ] },
    { name: "token", label: "Token link xem", type: "text", index: true, access: { read: () => false }, admin: { hidden: true } },
    { name: "ghiChu", label: "Ghi chú", type: "textarea" },
  ],
};
