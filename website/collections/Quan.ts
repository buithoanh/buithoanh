import type { CollectionConfig } from "payload";
import { chiNguoiSuaGia, chiQuanTri, congKhai } from "../lib/quyen";
import { taoSlug } from "../lib/kiem-tra.mjs";

export const Quan: CollectionConfig = {
  slug: "quan",
  labels: { singular: "Quận", plural: "Quận (vùng phục vụ)" },
  admin: {
    useAsTitle: "ten",
    defaultColumns: ["thuTu", "ten", "dangPhucVu", "etaTu", "etaDen"],
    group: "Vùng phục vụ & lịch",
    description: "Quận đang phục vụ và thời gian thợ tới dự kiến. Tắt cả quận hoặc từng phường ở mục Phường.",
  },
  defaultSort: "thuTu",
  access: { read: congKhai, create: chiNguoiSuaGia, update: chiNguoiSuaGia, delete: chiQuanTri },
  fields: [
    { name: "ten", label: "Tên quận", type: "text", required: true, unique: true },
    {
      name: "slug", label: "Đường dẫn", type: "text", required: true, unique: true, index: true,
      hooks: { beforeValidate: [({ value, data }) => taoSlug(value || data?.ten)] },
    },
    { name: "thanhPho", label: "Thành phố", type: "text", defaultValue: "Hà Nội" },
    { type: "row", fields: [
      { name: "etaTu", label: "Thợ tới sau ít nhất (phút)", type: "number", required: true, min: 0 },
      { name: "etaDen", label: "Thợ tới sau nhiều nhất (phút)", type: "number", required: true, min: 0 },
    ] },
    { name: "ghiChu", label: "Ghi chú", type: "textarea" },
    {
      name: "ranhGioi", label: "Ranh giới (GeoJSON Polygon/MultiPolygon, kinh độ trước)", type: "json",
      admin: { description: "Không bắt buộc. Có ranh giới thì kiểm tra được vị trí theo toạ độ kể cả khi bản đồ không trả tên quận." },
    },
    { name: "dangPhucVu", label: "Đang phục vụ", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
    { name: "thuTu", label: "Thứ tự", type: "number", defaultValue: 99, admin: { position: "sidebar" } },
  ],
};
