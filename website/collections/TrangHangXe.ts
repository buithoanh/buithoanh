import type { CollectionConfig } from "payload";
import { hookKiemTraVaDuyet, truongDuyet, truongFaq, truongSeo, xemTruoc } from "../lib/bai";
import { chiNguoiDuyet, chiNguoiViet, daDangNhap, docBaiDaDang } from "../lib/quyen";

// Trang hãng xe (/hang-xe/<hãng>/): bài viết về hãng, bệnh hay gặp theo từng dòng. Bảng giá lấy từ bảng giá chung theo phân khúc.
export const TrangHangXe: CollectionConfig = {
  slug: "trang-hang-xe",
  labels: { singular: "Trang hãng xe", plural: "Trang hãng xe" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "hang", "trangThaiDuyet", "_status", "updatedAt"],
    group: "Nội dung",
    preview: xemTruoc("hang-xe"),
  },
  versions: { drafts: true, maxPerDoc: 50 },
  access: { read: docBaiDaDang, create: chiNguoiViet, update: chiNguoiViet, delete: chiNguoiDuyet, readVersions: daDangNhap },
  hooks: { beforeChange: [hookKiemTraVaDuyet("hang-xe")] },
  fields: [
    { name: "hang", label: "Hãng xe", type: "relationship", relationTo: "hang-xe", required: true },
    ...truongSeo,
    { name: "noiDung", label: "Nội dung", type: "richText", required: true },
    {
      name: "benhHayGap", label: "Bệnh hay gặp", type: "array",
      admin: { description: "Theo dòng xe (để trống dòng = áp dụng mọi dòng của hãng)." },
      fields: [
        { type: "row", fields: [
          { name: "dong", label: "Dòng xe", type: "relationship", relationTo: "dong-xe" },
          { name: "tieuDe", label: "Bệnh", type: "text", required: true },
        ] },
        { name: "moTa", label: "Mô tả, cách xử lý", type: "textarea", required: true },
        { name: "dichVu", label: "Dịch vụ xử lý", type: "relationship", relationTo: "danh-muc-dich-vu" },
      ],
    },
    truongFaq,
    {
      name: "slug", label: "Đường dẫn", type: "text", unique: true, index: true,
      admin: { position: "sidebar", readOnly: true, description: "Tự lấy theo hãng: /hang-xe/<hãng>/." },
    },
    ...truongDuyet,
  ],
};
