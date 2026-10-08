import type { CollectionConfig } from "payload";
import path from "node:path";
import { chiNguoiXuLyDon, chiQuanTri } from "../lib/quyen";

// Ảnh, video khách gửi kèm đơn (tối đa 3 ảnh và 1 video 30 giây). Chỉ người xử lý đơn xem được, không công khai.
export const TepDonHang: CollectionConfig = {
  slug: "tep-don-hang",
  labels: { singular: "Tệp của đơn", plural: "Ảnh, video của đơn" },
  admin: { group: "Đơn hàng", defaultColumns: ["filename", "donHang", "loai", "createdAt"] },
  access: { read: chiNguoiXuLyDon, create: chiNguoiXuLyDon, update: chiNguoiXuLyDon, delete: chiQuanTri },
  upload: {
    staticDir: path.join(process.env.MEDIA_DIR || "media", "don-hang"),
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "video/mp4", "video/quicktime", "video/webm"],
  },
  fields: [
    { name: "donHang", label: "Đơn hàng", type: "relationship", relationTo: "don-hang", index: true },
    { name: "loai", label: "Loại", type: "select", options: [{ label: "Ảnh", value: "anh" }, { label: "Video", value: "video" }] },
    { name: "thoiLuongGiay", label: "Thời lượng video (giây, trình duyệt báo)", type: "number" },
  ],
};
