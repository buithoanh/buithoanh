import type { CollectionConfig } from "payload";
import path from "node:path";
import { chiQuanTri, la } from "../lib/quyen";
import { ANH_HO_SO, DUNG_CU, NAM_KINH_NGHIEM } from "../lib/p2-dau-vao.mjs";

const nhanSu = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu");

// Hồ sơ thợ cộng tác TH-000087 (thiết kế TuyenTho), chuyển nhân sự. Ảnh chứng chỉ không công khai.
export const HoSoTho: CollectionConfig = {
  slug: "ho-so-tho",
  labels: { singular: "Hồ sơ thợ cộng tác", plural: "Hồ sơ thợ cộng tác" },
  admin: { useAsTitle: "ma", defaultColumns: ["ma", "hoTen", "namKinhNghiem", "trangThai", "createdAt"], group: "Đơn hàng" },
  defaultSort: "-createdAt",
  access: { read: nhanSu, create: nhanSu, update: nhanSu, delete: chiQuanTri },
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã hồ sơ", type: "text", unique: true, index: true, admin: { readOnly: true } },
      { name: "hoTen", label: "Họ tên", type: "text", required: true },
      { name: "sdt", label: "Số điện thoại", type: "text", required: true, index: true },
    ] },
    { type: "row", fields: [
      { name: "namKinhNghiem", label: "Kinh nghiệm", type: "select", options: NAM_KINH_NGHIEM },
      { name: "khuVuc", label: "Khu vực muốn nhận đơn", type: "json" },
    ] },
    { name: "dungCu", label: "Dụng cụ đang có", type: "select", hasMany: true, options: DUNG_CU },
    { name: "anhChungChi", label: "Ảnh chứng chỉ, bằng nghề", type: "relationship", relationTo: "tep-ho-so", hasMany: true, maxRows: ANH_HO_SO.soAnh },
    { name: "ghiChu", label: "Ghi chú của thợ", type: "textarea" },
    {
      name: "trangThai", label: "Trạng thái", type: "select", defaultValue: "moi", index: true, admin: { position: "sidebar" },
      options: [
        { label: "Mới", value: "moi" }, { label: "Đã gọi", value: "daGoi" }, { label: "Hẹn kiểm tra tay nghề", value: "henKiemTra" },
        { label: "Đã nhận vào tổ", value: "daNhan" }, { label: "Không đạt", value: "khongDat" },
      ],
    },
    { name: "dongYLuc", label: "Đồng ý xử lý dữ liệu lúc", type: "date", admin: { readOnly: true, position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    { name: "ghiChuNoiBo", label: "Ghi chú nhân sự", type: "textarea" },
  ],
};

export const TepHoSo: CollectionConfig = {
  slug: "tep-ho-so",
  labels: { singular: "Ảnh hồ sơ thợ", plural: "Ảnh hồ sơ thợ" },
  admin: { group: "Đơn hàng", defaultColumns: ["filename", "hoSo", "createdAt"] },
  access: { read: nhanSu, create: nhanSu, update: nhanSu, delete: chiQuanTri },
  upload: { staticDir: path.join(process.env.MEDIA_DIR || "media", "ho-so-tho"), mimeTypes: ANH_HO_SO.loai },
  fields: [{ name: "hoSo", label: "Hồ sơ", type: "relationship", relationTo: "ho-so-tho", index: true }],
};
