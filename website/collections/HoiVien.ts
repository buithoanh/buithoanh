import type { CollectionConfig } from "payload";
import { chiQuanTri, la, truongChiNguoiXuLyDon } from "../lib/quyen";
import { endpointHoiVien } from "../lib/api/p2";

const xem = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu", "marketing", "dieuPhoi");
const sua = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu");
const soLan = (name: string, label: string) => ({ name, label, type: "number" as const, admin: { description: "Để trống = không giới hạn, 0 = không có" } });

// Đăng ký gói hội viên HV-000123: 1 biển số, 12 tháng kể từ khi thanh toán (VietQR, nội dung HV000123).
// Quyền lợi chép từ gói lúc đăng ký. Số lượt đã dùng tính từ các đơn có gắn hội viên này (không lưu bộ đếm).
export const HoiVien: CollectionConfig = {
  slug: "hoi-vien",
  labels: { singular: "Hội viên", plural: "Hội viên (đăng ký gói)" },
  admin: { useAsTitle: "ma", defaultColumns: ["ma", "bienSo", "tenGoi", "trangThai", "hetHanLuc", "createdAt"], group: "Khách hàng" },
  defaultSort: "-createdAt",
  access: { read: xem, create: sua, update: sua, delete: chiQuanTri },
  endpoints: endpointHoiVien,
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã", type: "text", unique: true, index: true, admin: { readOnly: true } },
      { name: "bienSo", label: "Biển số", type: "text", required: true, index: true },
      { name: "goi", label: "Gói", type: "relationship", relationTo: "goi-hoi-vien", required: true },
      { name: "tenGoi", label: "Tên gói", type: "text", admin: { readOnly: true } },
    ] },
    { type: "row", fields: [
      { name: "hoTen", label: "Họ tên", type: "text" },
      { name: "sdt", label: "Số điện thoại", type: "text", required: true, index: true },
      { name: "maGioiThieu", label: "Mã giới thiệu đã nhập", type: "text" },
      { name: "gioiThieu", label: "Người giới thiệu", type: "relationship", relationTo: "ma-gioi-thieu", index: true },
    ] },
    {
      name: "trangThai", label: "Trạng thái", type: "select", required: true, defaultValue: "choThanhToan", index: true, admin: { position: "sidebar" },
      options: [
        { label: "Chờ thanh toán", value: "choThanhToan" }, { label: "Đang hiệu lực", value: "hieuLuc" },
        { label: "Hết hạn", value: "hetHan" }, { label: "Đã huỷ", value: "huy" },
      ],
    },
    { name: "batDauLuc", label: "Hiệu lực từ", type: "date", index: true, admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    { name: "hetHanLuc", label: "Hết hạn lúc", type: "date", index: true, admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    {
      name: "quyenLoi", label: "Quyền lợi (chép từ gói lúc đăng ký)", type: "group",
      fields: [
        { type: "row", fields: [
          { name: "soTien", label: "Giá gói (đ)", type: "number" },
          { name: "giamCongPhanTram", label: "Giảm tiền công (%)", type: "number" },
          { name: "uuTienGoiGap", label: "Ưu tiên gọi gấp", type: "checkbox" },
        ] },
        { type: "row", fields: [soLan("mienDiLaiSoLan", "Miễn đi lại (lần/năm)"), soLan("mienKichNoSoLan", "Miễn kích nổ (lần/năm)"), soLan("mienVaLopSoLan", "Miễn vá lốp (lần/năm)")] },
      ],
    },
    {
      name: "thanhToan", label: "Thanh toán", type: "group",
      fields: [{ type: "row", fields: [
        { name: "daNhan", label: "Đã nhận (đ)", type: "number", defaultValue: 0 },
        { name: "maGiaoDich", label: "Mã giao dịch", type: "text" },
        { name: "thanhToanLuc", label: "Lúc", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
      ] }],
    },
    { name: "dongYLuc", label: "Đồng ý xử lý dữ liệu lúc", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "nhacGiaHanLuc", label: "Đã nhắc gia hạn lúc", type: "date", admin: { readOnly: true, position: "sidebar" } },
    { name: "token", label: "Token link thanh toán", type: "text", index: true, access: { read: truongChiNguoiXuLyDon }, admin: { readOnly: true, position: "sidebar" } },
    { name: "ghiChu", label: "Ghi chú (huỷ, hoàn tiền…)", type: "textarea" },
  ],
};
