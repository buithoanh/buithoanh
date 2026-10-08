import type { CollectionConfig } from "payload";
import { hookKiemTraVaDuyet, truongDuyet, truongFaq, truongSeo, truongSlug, truongTuLieu, xemTruoc } from "../lib/bai";
import { chiNguoiDuyet, daDangNhap, docBaiDaDang } from "../lib/quyen";

export const DichVu: CollectionConfig = {
  slug: "dich-vu",
  labels: { singular: "Trang dịch vụ", plural: "Trang dịch vụ" },
  admin: {
    useAsTitle: "ten",
    defaultColumns: ["ten", "trangThaiDuyet", "_status", "updatedAt"],
    group: "Nội dung",
    preview: xemTruoc("dich-vu"),
  },
  defaultSort: "thuTu",
  versions: { drafts: true, maxPerDoc: 50 },
  access: { read: docBaiDaDang, create: daDangNhap, update: daDangNhap, delete: chiNguoiDuyet, readVersions: daDangNhap },
  hooks: { beforeChange: [hookKiemTraVaDuyet("dich-vu")] },
  fields: [
    { name: "ten", label: "Tên dịch vụ", type: "text", required: true, admin: { description: "Ngắn, ví dụ: Thay ắc quy" } },
    { name: "tomTat", label: "Tóm tắt (hiện trên thẻ ở trang chủ)", type: "textarea", required: true },
    ...truongSeo,
    { name: "noiDung", label: "Nội dung", type: "richText", required: true },
    truongFaq,
    truongSlug,
    truongTuLieu,
    { name: "thuTu", label: "Thứ tự hiển thị", type: "number", defaultValue: 99, admin: { position: "sidebar" } },
    ...truongDuyet,
  ],
};
