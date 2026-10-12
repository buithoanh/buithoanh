import type { CollectionConfig } from "payload";
import { chiQuanTri, la } from "../lib/quyen";
import { LOAI_DOI_XE, LOAI_XE_DOANH_NGHIEP } from "../lib/p2-dau-vao.mjs";

const b2b = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu", "marketing");

// Yêu cầu báo giá hợp đồng doanh nghiệp DN-000045 (thiết kế DoanhNghiep), giao sales B2B.
export const YeuCauDoanhNghiep: CollectionConfig = {
  slug: "yeu-cau-doanh-nghiep",
  labels: { singular: "Yêu cầu doanh nghiệp", plural: "Yêu cầu báo giá doanh nghiệp" },
  admin: { useAsTitle: "ma", defaultColumns: ["ma", "tenCongTy", "soXe", "loaiDoiXe", "trangThai", "createdAt"], group: "Khách hàng" },
  defaultSort: "-createdAt",
  access: { read: b2b, create: b2b, update: b2b, delete: chiQuanTri },
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã yêu cầu", type: "text", unique: true, index: true, admin: { readOnly: true } },
      { name: "tenCongTy", label: "Tên công ty", type: "text", required: true },
      { name: "mst", label: "Mã số thuế", type: "text", index: true },
    ] },
    { name: "diaChi", label: "Địa chỉ (theo MST)", type: "text" },
    { type: "row", fields: [
      { name: "soXe", label: "Số xe", type: "number", required: true, min: 1 },
      { name: "loaiXe", label: "Loại xe chính", type: "select", options: LOAI_XE_DOANH_NGHIEP },
      { name: "loaiDoiXe", label: "Loại đội xe", type: "select", options: LOAI_DOI_XE },
    ] },
    { name: "khuVuc", label: "Khu vực bãi xe", type: "json", admin: { description: "Slug quận, \"khac\" = quận khác" } },
    { type: "row", fields: [
      { name: "nguoiLienHe", label: "Người liên hệ", type: "text", required: true },
      { name: "sdt", label: "Số điện thoại", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
    ] },
    { name: "ghiChu", label: "Ghi chú của khách", type: "textarea" },
    {
      name: "trangThai", label: "Trạng thái", type: "select", defaultValue: "moi", index: true, admin: { position: "sidebar" },
      options: [
        { label: "Mới", value: "moi" }, { label: "Đang tư vấn", value: "dangTuVan" }, { label: "Đã gửi báo giá", value: "daBaoGia" },
        { label: "Đã ký hợp đồng", value: "daKy" }, { label: "Không thành", value: "khongThanh" },
      ],
    },
    { name: "phuTrach", label: "Sales phụ trách", type: "relationship", relationTo: "users", admin: { position: "sidebar" } },
    { name: "dongYLuc", label: "Đồng ý xử lý dữ liệu lúc", type: "date", admin: { readOnly: true, position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    { name: "ghiChuNoiBo", label: "Ghi chú nội bộ", type: "textarea" },
    { name: "nguon", label: "Nguồn (utm)", type: "json", admin: { readOnly: true } },
  ],
};
