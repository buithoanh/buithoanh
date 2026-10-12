import type { Access, CollectionConfig, Where } from "payload";
import { chiQuanTri, la } from "../lib/quyen";

const quanLyDanhGia: Access = ({ req }) => la(req, "quanTri", "quanLyDichVu", "marketing");

/** Khách chỉ thấy đánh giá đang bật hiển thị. Production không bao giờ trả đánh giá mẫu. */
export const docDanhGia: Access = ({ req }) => {
  if (req.user) return true;
  const and: Where[] = [{ hienThi: { equals: true } }];
  if (process.env.NODE_ENV === "production") and.push({ duLieuMau: { not_equals: true } });
  return { and };
};

// Đánh giá khách để hiện trên web. Chỉ dùng đánh giá thật, có quận và ngày.
export const DanhGia: CollectionConfig = {
  slug: "danh-gia",
  labels: { singular: "Đánh giá", plural: "Đánh giá hiển thị" },
  admin: {
    useAsTitle: "tenHienThi",
    defaultColumns: ["ngay", "tenHienThi", "soSao", "quan", "dichVu", "hienThi", "duLieuMau"],
    group: "Khách hàng",
    description: "Chỉ dùng đánh giá thật của khách (có quận, ngày). Đánh giá mẫu không bao giờ hiện trên web chạy thật.",
  },
  defaultSort: "-ngay",
  access: { read: docDanhGia, create: quanLyDanhGia, update: quanLyDanhGia, delete: chiQuanTri },
  fields: [
    { name: "noiDung", label: "Nội dung", type: "textarea", required: true },
    { type: "row", fields: [
      { name: "tenHienThi", label: "Tên hiển thị", type: "text", required: true, admin: { placeholder: "Anh T." } },
      { name: "soSao", label: "Số sao", type: "number", required: true, min: 1, max: 5, defaultValue: 5 },
      { name: "ngay", label: "Ngày", type: "date", required: true, admin: { date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } } },
    ] },
    { type: "row", fields: [
      { name: "quan", label: "Quận", type: "relationship", relationTo: "quan", required: true },
      { name: "phuong", label: "Phường (không bắt buộc)", type: "text" },
      { name: "dichVu", label: "Dịch vụ", type: "relationship", relationTo: "danh-muc-dich-vu" },
    ] },
    {
      name: "nguon", label: "Nguồn", type: "select", defaultValue: "google",
      options: [
        { label: "Google", value: "google" }, { label: "Zalo", value: "zalo" },
        { label: "Đánh giá sau đơn trên web", value: "web" }, { label: "Khác", value: "khac" },
      ],
    },
    { name: "donHang", label: "Đơn hàng", type: "relationship", relationTo: "don-hang" },
    { name: "hienThi", label: "Hiện trên web", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
    {
      name: "duLieuMau", label: "Dữ liệu mẫu (không hiện khi chạy thật)", type: "checkbox", defaultValue: false,
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
