import type { GlobalConfig } from "payload";
import { chiNguoiDuyet } from "../lib/quyen";

// Thông tin liên hệ hiện trên web. Sửa ở trang admin, không cần sửa code.
export const CaiDat: GlobalConfig = {
  slug: "cai-dat",
  label: "Thông tin liên hệ",
  admin: { group: "Hệ thống" },
  access: { read: () => true, update: chiNguoiDuyet },
  fields: [
    { name: "hotline", label: "Hotline", type: "text", admin: { description: "Để trống thì nút gọi hiện \"Hotline sắp có\"." } },
    { name: "zalo", label: "Link Zalo OA", type: "text", admin: { placeholder: "https://zalo.me/..." } },
    { name: "email", label: "Email", type: "email" },
    {
      name: "khuVuc",
      label: "Quận đang phục vụ",
      type: "array",
      labels: { singular: "Quận", plural: "Quận" },
      admin: { description: "Để trống thì web ghi chung là thành phố." },
      fields: [{ name: "ten", label: "Tên quận", type: "text", required: true }],
    },
    { name: "xuongDoiTac", label: "Xưởng nhận ca phức tạp", type: "text", defaultValue: "xưởng Auto Speedy" },
  ],
};
