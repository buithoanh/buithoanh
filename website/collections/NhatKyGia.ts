import type { CollectionConfig } from "payload";
import { chiNguoiSuaGia } from "../lib/quyen";

// Mỗi lần lưu giá (hạng mục hoặc phí chung) ghi một dòng: ai sửa, lúc nào, giá cũ, giá mới, lý do. Không sửa, không xoá.
export const NhatKyGia: CollectionConfig = {
  slug: "nhat-ky-gia",
  labels: { singular: "Dòng nhật ký giá", plural: "Nhật ký đổi giá" },
  admin: {
    useAsTitle: "moTa",
    defaultColumns: ["createdAt", "tenNguoi", "moTa", "giaCu", "giaMoi", "lyDo"],
    group: "Bảng giá & danh mục",
  },
  defaultSort: "-createdAt",
  access: { read: chiNguoiSuaGia, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: "moTa", label: "Hạng mục", type: "text", required: true },
    { name: "hangMuc", label: "Hạng mục giá", type: "relationship", relationTo: "hang-muc-gia" },
    { name: "dichVu", label: "Dịch vụ", type: "relationship", relationTo: "danh-muc-dich-vu" },
    { type: "row", fields: [
      { name: "giaCu", label: "Giá cũ", type: "text" },
      { name: "giaMoi", label: "Giá mới", type: "text" },
    ] },
    { name: "lyDo", label: "Lý do", type: "text" },
    { type: "row", fields: [
      { name: "nguoi", label: "Người sửa", type: "relationship", relationTo: "users" },
      { name: "tenNguoi", label: "Tên người sửa", type: "text" },
      { name: "vaiTro", label: "Vai trò", type: "text" },
    ] },
  ],
};
