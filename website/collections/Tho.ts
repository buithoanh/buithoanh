import type { CollectionConfig } from "payload";
import { chiNguoiXuLyDon, chiQuanTri, la } from "../lib/quyen";

// Thợ. Khách chỉ thấy tên, ảnh, điểm sao, chứng chỉ, số năm nghề, biển số xe van, vị trí khi đang tới (qua link riêng của đơn).
export const Tho: CollectionConfig = {
  slug: "tho",
  labels: { singular: "Thợ", plural: "Thợ" },
  admin: { useAsTitle: "ten", defaultColumns: ["ten", "diemSao", "soNamNghe", "bienSoXeVan", "dangHoatDong"], group: "Đơn hàng" },
  access: {
    read: chiNguoiXuLyDon,
    create: ({ req }) => la(req, "quanTri", "quanLyDichVu"),
    update: chiNguoiXuLyDon,
    delete: chiQuanTri,
  },
  fields: [
    { type: "row", fields: [
      { name: "ten", label: "Họ tên", type: "text", required: true },
      { name: "sdt", label: "Số điện thoại (nội bộ)", type: "text" },
      { name: "maBenDieuPhoi", label: "Mã bên phần mềm điều phối", type: "text", index: true },
    ] },
    { name: "anh", label: "Ảnh", type: "upload", relationTo: "media" },
    { type: "row", fields: [
      { name: "soNamNghe", label: "Số năm nghề", type: "number", min: 0 },
      { name: "bienSoXeVan", label: "Biển số xe van", type: "text" },
      { name: "khuVuc", label: "Khu vực", type: "relationship", relationTo: "quan", hasMany: true },
    ] },
    {
      name: "chungChi", label: "Chứng chỉ VCedu", type: "array",
      fields: [{ name: "ten", label: "Tên chứng chỉ", type: "text", required: true }],
    },
    { name: "gioiThieu", label: "Giới thiệu ngắn", type: "textarea" },
    { name: "dangHoatDong", label: "Đang nhận đơn", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
    {
      name: "diemSao", label: "Điểm sao", type: "number", admin: { position: "sidebar", readOnly: true, description: "Mang sang từ điều phối, tự cộng dồn mỗi đánh giá trên web." },
    },
    { name: "soDanhGia", label: "Số đánh giá", type: "number", defaultValue: 0, admin: { position: "sidebar", readOnly: true } },
    {
      name: "viTri", label: "Vị trí hiện tại", type: "group", admin: { position: "sidebar", readOnly: true },
      fields: [
        { name: "lat", label: "Vĩ độ", type: "number" },
        { name: "lng", label: "Kinh độ", type: "number" },
        { name: "luc", label: "Cập nhật lúc", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
      ],
    },
  ],
};
