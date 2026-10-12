import type { CollectionConfig } from "payload";
import { chiNguoiDuyet, daDangNhap } from "../lib/quyen";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Ảnh", plural: "Ảnh" },
  admin: { group: "Nội dung" },
  access: { read: () => true, create: daDangNhap, update: daDangNhap, delete: chiNguoiDuyet },
  upload: {
    // Thư mục lưu ảnh tải lên. Trên server Docker đặt MEDIA_DIR=/app/media (gắn ổ đĩa riêng).
    staticDir: process.env.MEDIA_DIR || "media",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      label: "Mô tả ảnh (cho người khiếm thị và Google)",
      type: "text",
      required: true,
    },
  ],
};
