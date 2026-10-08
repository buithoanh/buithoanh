import type { CollectionConfig } from "payload";
import { chiQuanTri, la } from "../lib/quyen";

const cskh = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu", "dieuPhoi");

// Phiếu khiếu nại KN-xxxxxx tạo khi khách chấm 1–3 sao. Chỉ chuyển CSKH, không bao giờ đăng công khai.
export const KhieuNai: CollectionConfig = {
  slug: "khieu-nai",
  labels: { singular: "Phiếu khiếu nại", plural: "Phiếu khiếu nại" },
  admin: { useAsTitle: "ma", defaultColumns: ["ma", "soSao", "vanDe", "trangThai", "hanGoiLai", "createdAt"], group: "Khách hàng" },
  defaultSort: "-createdAt",
  access: { read: cskh, create: cskh, update: cskh, delete: chiQuanTri },
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã phiếu", type: "text", unique: true, index: true, admin: { readOnly: true } },
      { name: "donHang", label: "Đơn hàng", type: "relationship", relationTo: "don-hang", index: true },
      { name: "soSao", label: "Số sao", type: "number", min: 1, max: 5 },
    ] },
    {
      name: "vanDe", label: "Vấn đề", type: "select", hasMany: true,
      options: [
        { label: "Thợ đến trễ", value: "tre" }, { label: "Thái độ thợ", value: "thaido" }, { label: "Giá cao hơn báo", value: "gia" },
        { label: "Sửa chưa hết lỗi", value: "chatluong" }, { label: "Để bẩn xe, chỗ đỗ", value: "vesinh" }, { label: "Vấn đề khác", value: "khac" },
      ],
    },
    { name: "moTa", label: "Khách mô tả", type: "textarea" },
    { name: "sdtGoiLai", label: "Số gọi lại", type: "text" },
    {
      name: "trangThai", label: "Trạng thái", type: "select", defaultValue: "moi", index: true, admin: { position: "sidebar" },
      options: [{ label: "Mới", value: "moi" }, { label: "Đang xử lý", value: "dangXuLy" }, { label: "Đã xử lý", value: "daXuLy" }],
    },
    { name: "hanGoiLai", label: "Hạn gọi lại", type: "date", admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    { name: "phuTrach", label: "Người phụ trách", type: "relationship", relationTo: "users", admin: { position: "sidebar" } },
    { name: "ketQuaXuLy", label: "Kết quả xử lý", type: "textarea" },
  ],
};
