import type { CollectionConfig } from "payload";
import { chiNguoiSuaGia, congKhai, chiQuanTri } from "../lib/quyen";
import { taoSlug } from "../lib/kiem-tra.mjs";

// Danh mục dịch vụ dùng chung cho cả web: đặt lịch, bảng giá, báo giá sơ bộ, trang dịch vụ.
// Nội dung bài viết của trang dịch vụ nằm ở "Trang dịch vụ" (cùng đường dẫn).
export const DanhMucDichVu: CollectionConfig = {
  slug: "danh-muc-dich-vu",
  labels: { singular: "Dịch vụ", plural: "Danh mục dịch vụ" },
  admin: {
    useAsTitle: "ten",
    defaultColumns: ["thuTu", "ma", "ten", "nhanDatLich", "baoGiaSoBo"],
    group: "Bảng giá & danh mục",
    description: "Một chỗ cho cả web. Tắt \"Nhận đặt lịch\" thì dịch vụ ẩn khỏi form đặt lịch.",
  },
  defaultSort: "thuTu",
  access: { read: congKhai, create: chiNguoiSuaGia, update: chiNguoiSuaGia, delete: chiQuanTri },
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã", type: "text", required: true, unique: true, admin: { width: "20%", description: "Vd BD, AQ" } },
      { name: "ten", label: "Tên dịch vụ", type: "text", required: true },
    ] },
    {
      name: "slug", label: "Đường dẫn", type: "text", required: true, unique: true, index: true,
      admin: { description: "Trùng đường dẫn của Trang dịch vụ (vd ac-quy → /dich-vu/ac-quy/)." },
      hooks: { beforeValidate: [({ value, data }) => taoSlug(value || data?.ten)] },
    },
    { name: "moTaNgan", label: "Mô tả ngắn", type: "text", admin: { description: "Một dòng dưới tên, vd \"Kích nổ, thay mới tại chỗ\"." } },
    { name: "ghiChuBangGia", label: "Ghi chú trên bảng giá", type: "textarea" },
    { type: "row", fields: [
      { name: "nutKeuGoi", label: "Chữ trên nút đặt (bảng giá)", type: "text", admin: { placeholder: "Đặt lịch bảo dưỡng" } },
      { name: "thoiGianLam", label: "Thời gian làm", type: "text", admin: { placeholder: "20–30 phút" } },
    ] },
    { name: "thuTu", label: "Thứ tự", type: "number", defaultValue: 99, admin: { position: "sidebar" } },
    {
      name: "nhanDatLich", label: "Nhận đặt lịch", type: "checkbox", defaultValue: true,
      admin: { position: "sidebar", description: "Tắt = tạm ẩn khỏi form đặt lịch." },
    },
    {
      name: "baoGiaSoBo", label: "Tính giá sơ bộ ngay theo xe", type: "checkbox", defaultValue: true,
      admin: { position: "sidebar", description: "Tắt với việc phức tạp: khách thấy \"Cố vấn gọi lại\" thay cho khoảng giá." },
    },
    { name: "hienTrenBangGia", label: "Hiện trên bảng giá", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
  ],
};
