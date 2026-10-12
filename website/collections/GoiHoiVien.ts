import type { CollectionConfig, Field } from "payload";
import { chiNguoiSuaGia, chiQuanTri, congKhai } from "../lib/quyen";

/** Một quyền lợi đếm theo lượt/năm: không có, N lần, hoặc không giới hạn. */
const luot = (name: string, label: string): Field => ({
  name, label, type: "group",
  fields: [{ type: "row", fields: [
    {
      name: "kieu", label: "Mức", type: "select", required: true, defaultValue: "khong",
      options: [{ label: "Không có", value: "khong" }, { label: "Số lần mỗi năm", value: "soLan" }, { label: "Không giới hạn", value: "khongGioiHan" }],
    },
    { name: "soLan", label: "Số lần/năm", type: "number", min: 1, admin: { condition: (_, s) => s?.kieu === "soLan" } },
  ] }],
});

// Gói hội viên (thiết kế HoiVien): giá năm và quyền lợi. Người đã mua giữ quyền lợi lúc mua (chép vào đăng ký hội viên),
// sửa gói chỉ áp cho người mua sau.
export const GoiHoiVien: CollectionConfig = {
  slug: "goi-hoi-vien",
  labels: { singular: "Gói hội viên", plural: "Gói hội viên" },
  admin: { useAsTitle: "ten", defaultColumns: ["ten", "giaNam", "dangBan", "thuTu"], group: "Khách hàng" },
  defaultSort: "thuTu",
  access: { read: congKhai, create: chiNguoiSuaGia, update: chiNguoiSuaGia, delete: chiQuanTri },
  fields: [
    { type: "row", fields: [
      { name: "ten", label: "Tên gói", type: "text", required: true, admin: { placeholder: "Gói An tâm" } },
      { name: "slug", label: "Mã gói", type: "text", required: true, unique: true, index: true, admin: { placeholder: "an-tam" } },
      { name: "giaNam", label: "Giá mỗi năm (đ)", type: "number", required: true, min: 0, validate: (v: unknown) => (Number.isInteger(v) && (v as number) >= 0) || "Số nguyên đồng" },
    ] },
    { type: "row", fields: [
      { name: "nhan", label: "Nhãn nổi bật", type: "text", admin: { placeholder: "Nhiều người chọn" } },
      { name: "thuTu", label: "Thứ tự", type: "number", defaultValue: 0 },
      { name: "dangBan", label: "Đang bán", type: "checkbox", defaultValue: true },
    ] },
    luot("mienDiLai", "Miễn phí đi lại"),
    luot("mienKichNo", "Miễn phí kích nổ ắc quy (hạng mục giá gắn quyền lợi \"Kích nổ\")"),
    luot("mienVaLop", "Miễn phí vá lốp (hạng mục giá gắn quyền lợi \"Vá lốp\")"),
    { type: "row", fields: [
      { name: "giamCongPhanTram", label: "Giảm tiền công (%)", type: "number", defaultValue: 0, min: 0, max: 100 },
      { name: "uuTienGoiGap", label: "Ưu tiên xếp thợ khi gọi gấp", type: "checkbox" },
    ] },
    { name: "loiIch", label: "Một câu lợi ích (hiện dưới bảng so sánh)", type: "text" },
    { name: "ghiChu", label: "Ghi chú nội bộ", type: "textarea", admin: { position: "sidebar" } },
  ],
};
