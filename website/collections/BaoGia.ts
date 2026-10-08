import type { CollectionConfig } from "payload";
import { chiNguoiXuLyDon, chiQuanTri } from "../lib/quyen";
import { MUC_DO } from "../lib/bao-gia.mjs";

// Báo giá chính thức do thợ/điều phối tạo sau khi kiểm tra xe. Khách duyệt qua link riêng (bỏ bớt hạng mục tuỳ chọn).
// Phát sinh giữa chừng thì tạo báo giá bổ sung (phiên bản mới) chỉ gồm hạng mục mới.
export const BaoGia: CollectionConfig = {
  slug: "bao-gia",
  labels: { singular: "Báo giá", plural: "Báo giá chính thức" },
  admin: { useAsTitle: "tieuDe", defaultColumns: ["tieuDe", "donHang", "trangThai", "tongNeuLamHet", "createdAt"], group: "Đơn hàng" },
  defaultSort: "-createdAt",
  access: { read: chiNguoiXuLyDon, create: chiNguoiXuLyDon, update: chiNguoiXuLyDon, delete: chiQuanTri },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const d = { ...(originalDoc || {}), ...data };
        const hm = (d.hangMuc || []) as { gia?: number }[];
        data.tongNeuLamHet = hm.reduce((a, h) => a + Math.round(h.gia || 0), 0);
        data.tieuDe = `${d.maDon || ""} · ${d.phienBan > 1 ? `phát sinh ${d.phienBan - 1}` : "báo giá"}`;
        return data;
      },
    ],
  },
  fields: [
    { type: "row", fields: [
      { name: "donHang", label: "Đơn hàng", type: "relationship", relationTo: "don-hang", required: true, index: true },
      { name: "maDon", label: "Mã đơn", type: "text", admin: { readOnly: true } },
      { name: "phienBan", label: "Lần", type: "number", defaultValue: 1, admin: { readOnly: true, description: "1 = báo giá đầu, 2+ = phát sinh" } },
    ] },
    { name: "tieuDe", type: "text", admin: { hidden: true } },
    {
      name: "trangThai", label: "Trạng thái", type: "select", defaultValue: "choDuyet", index: true, admin: { position: "sidebar" },
      options: [
        { label: "Chờ khách duyệt", value: "choDuyet" }, { label: "Khách đã đồng ý", value: "daDuyet" },
        { label: "Khách từ chối", value: "tuChoi" }, { label: "Đã thay bằng báo giá khác", value: "thayThe" },
      ],
    },
    { name: "chanDoan", label: "Kết quả kiểm tra (hiện cho khách)", type: "textarea", admin: { placeholder: "Ắc quy chỉ còn 8,9V khi đề, cần thay mới." } },
    {
      name: "hangMuc", label: "Hạng mục", type: "array", minRows: 1, required: true,
      fields: [
        { type: "row", fields: [
          { name: "ma", label: "Mã", type: "text", required: true, admin: { width: "15%", description: "Ngắn, không trùng trong báo giá" } },
          { name: "ten", label: "Tên", type: "text", required: true },
          { name: "loai", label: "Loại", type: "select", required: true, defaultValue: "cong", options: [{ label: "Tiền công", value: "cong" }, { label: "Phụ tùng", value: "phuTung" }] },
          { name: "gia", label: "Giá (đ)", type: "number", required: true, min: 0, validate: (v: unknown) => (Number.isInteger(v) && (v as number) >= 0) || "Số nguyên đồng" },
        ] },
        { name: "lyDo", label: "Lý do (hiện cho khách)", type: "text" },
        { type: "row", fields: [
          { name: "batBuoc", label: "Bắt buộc (khách không bỏ được)", type: "checkbox" },
          { name: "mucDo", label: "Mức độ", type: "select", defaultValue: "canLamNgay", options: MUC_DO },
          { name: "baoHanhThang", label: "Bảo hành (tháng, để trống = theo mặc định)", type: "number", min: 0 },
        ] },
        { name: "anh", label: "Ảnh lỗi", type: "relationship", relationTo: "tep-don-hang", hasMany: true },
      ],
    },
    { name: "tongNeuLamHet", label: "Tổng nếu làm hết (đ)", type: "number", admin: { readOnly: true, position: "sidebar" } },
    { name: "taoBoi", label: "Tạo bởi", type: "text", admin: { readOnly: true, position: "sidebar" } },
    {
      name: "ketQua", label: "Khách duyệt / từ chối", type: "group", admin: { readOnly: true },
      fields: [
        { type: "row", fields: [
          { name: "luc", label: "Lúc", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
          { name: "sdt", label: "Số điện thoại người duyệt", type: "text" },
          { name: "boHangMuc", label: "Hạng mục khách bỏ", type: "text", hasMany: true },
        ] },
        { type: "row", fields: [
          { name: "tienCong", label: "Tiền công (đ)", type: "number" },
          { name: "phuTung", label: "Phụ tùng (đ)", type: "number" },
        ] },
        { name: "lyDoTuChoi", label: "Lý do từ chối", type: "text" },
        { name: "banChup", label: "Bản chụp nội dung khách đã duyệt", type: "json", admin: { description: "Đúng nội dung khách thấy lúc bấm đồng ý; không đổi được." } },
      ],
    },
  ],
};
