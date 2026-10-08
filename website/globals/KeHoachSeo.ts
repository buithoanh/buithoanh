import type { GlobalConfig } from "payload";
import { chiNguoiDuyet, daDangNhap } from "../lib/quyen";

export const KeHoachSeo: GlobalConfig = {
  slug: "ke-hoach-seo",
  label: "Kế hoạch SEO",
  admin: { group: "SEO" },
  access: { read: daDangNhap, update: chiNguoiDuyet },
  fields: [
    { name: "nguon", label: "Nguồn kế hoạch", type: "textarea" },
    {
      name: "lichDang",
      label: "Lịch đăng theo tháng",
      type: "array",
      fields: [
        { type: "row", fields: [
          { name: "thang", label: "Tháng (YYYY-MM)", type: "text", required: true },
          { name: "baiCamNang", label: "Số bài cẩm nang", type: "number" },
        ] },
        { type: "row", fields: [
          { name: "trangKhac", label: "Trang khác", type: "text" },
          { name: "chuDe", label: "Chủ đề theo mùa", type: "text" },
        ] },
      ],
    },
    {
      name: "quyTac",
      label: "Quy tắc nội dung",
      type: "array",
      fields: [{ name: "noiDung", label: "Quy tắc", type: "textarea", required: true }],
    },
  ],
};
