import type { CollectionConfig } from "payload";
import { chiNguoiXuLyDon, chiQuanTri } from "../lib/quyen";

// Phiếu bảo hành điện tử BH-xxxxxx: gắn biển số, hạn theo từng hạng mục. Khách không cần giữ giấy.
export const PhieuBaoHanh: CollectionConfig = {
  slug: "phieu-bao-hanh",
  labels: { singular: "Phiếu bảo hành", plural: "Phiếu bảo hành" },
  admin: { useAsTitle: "ma", defaultColumns: ["ma", "bienSo", "donHang", "createdAt"], group: "Đơn hàng", listSearchableFields: ["ma", "bienSo"] },
  defaultSort: "-createdAt",
  access: { read: chiNguoiXuLyDon, create: chiNguoiXuLyDon, update: chiNguoiXuLyDon, delete: chiQuanTri },
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã phiếu", type: "text", unique: true, index: true, admin: { readOnly: true } },
      { name: "donHang", label: "Đơn hàng", type: "relationship", relationTo: "don-hang", required: true, index: true },
      { name: "bienSo", label: "Biển số", type: "text", index: true },
    ] },
    {
      name: "hangMuc", label: "Hạng mục bảo hành", type: "array",
      fields: [{ type: "row", fields: [
        { name: "ten", label: "Hạng mục", type: "text", required: true },
        { name: "loai", label: "Loại", type: "select", options: [{ label: "Phụ tùng", value: "phuTung" }, { label: "Tiền công", value: "cong" }] },
        { name: "tuNgay", label: "Từ ngày", type: "date" },
        { name: "denNgay", label: "Đến ngày", type: "date" },
      ] }],
    },
  ],
};
