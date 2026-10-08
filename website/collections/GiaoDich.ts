import type { CollectionConfig } from "payload";
import { chiNguoiXuLyDon } from "../lib/quyen";

// Giao dịch tiền về (webhook ngân hàng) hoặc thu tay (tiền mặt). Mỗi mã giao dịch chỉ ghi một lần.
export const GiaoDich: CollectionConfig = {
  slug: "giao-dich",
  labels: { singular: "Giao dịch", plural: "Giao dịch thanh toán" },
  admin: { useAsTitle: "maGiaoDich", defaultColumns: ["createdAt", "maGiaoDich", "soTien", "noiDung", "donHang", "ketQua"], group: "Đơn hàng" },
  defaultSort: "-createdAt",
  access: { read: chiNguoiXuLyDon, create: () => false, update: () => false, delete: () => false },
  fields: [
    { type: "row", fields: [
      { name: "maGiaoDich", label: "Mã giao dịch", type: "text", required: true, unique: true, index: true },
      { name: "soTien", label: "Số tiền (đ)", type: "number", required: true },
      { name: "hinhThuc", label: "Hình thức", type: "select", defaultValue: "chuyenKhoan", options: [{ label: "Chuyển khoản VietQR", value: "chuyenKhoan" }, { label: "Tiền mặt", value: "tienMat" }] },
    ] },
    { name: "noiDung", label: "Nội dung chuyển khoản", type: "text" },
    { type: "row", fields: [
      { name: "luc", label: "Thời điểm", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
      { name: "nguon", label: "Nguồn", type: "text" },
      { name: "donHang", label: "Đơn hàng", type: "relationship", relationTo: "don-hang" },
      { name: "hoiVien", label: "Gói hội viên", type: "relationship", relationTo: "hoi-vien" },
    ] },
    {
      name: "ketQua", label: "Kết quả", type: "select",
      options: [
        { label: "Đủ tiền, đơn hoàn tất", value: "du" }, { label: "Thiếu tiền", value: "thieu" },
        { label: "Không tìm thấy đơn", value: "khongThayDon" }, { label: "Đơn đã thanh toán trước đó", value: "trung" },
        { label: "Gói hội viên: đủ tiền, đã kích hoạt", value: "hoiVien" }, { label: "Gói hội viên: thiếu tiền", value: "hoiVienThieu" },
      ],
    },
  ],
};
