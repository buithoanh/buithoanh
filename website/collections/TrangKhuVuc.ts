import type { CollectionConfig } from "payload";
import { hookKiemTraVaDuyet, truongDuyet, truongFaq, truongSeo, xemTruoc } from "../lib/bai";
import { chiNguoiDuyet, chiNguoiViet, daDangNhap, docBaiDaDang, laNguoiViet } from "../lib/quyen";
import { taoTrangKhuVucTuMau } from "../lib/noi-dung";
import { docBody, json, traLoi } from "../lib/api/chung";
import { LoiNguoiDung } from "../lib/cong-khai";

// Trang khu vực: một dịch vụ ở một quận (/dich-vu/<dịch vụ>/<quận>/). Tạo từ mẫu rồi viết đoạn riêng.
// Trước khi gửi duyệt bắt buộc: đoạn riêng ≥150 chữ, ≥2 ảnh việc thật tại quận, ≥1 đánh giá thật của khách ở quận,
// không trùng quá 70% nội dung với trang khác (lib/kiem-tra.mjs).
export const TrangKhuVuc: CollectionConfig = {
  slug: "trang-khu-vuc",
  labels: { singular: "Trang khu vực", plural: "Trang khu vực" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "dichVu", "quan", "trangThaiDuyet", "_status", "updatedAt"],
    group: "Nội dung",
    preview: xemTruoc("khu-vuc"),
    description: "Tạo nhanh: POST /api/trang-khu-vuc/tao-tu-mau hoặc nút \"Tạo từ mẫu\" ở /quan-tri/bai-viet/.",
  },
  versions: { drafts: true, maxPerDoc: 50 },
  access: { read: docBaiDaDang, create: chiNguoiViet, update: chiNguoiViet, delete: chiNguoiDuyet, readVersions: daDangNhap },
  hooks: { beforeChange: [hookKiemTraVaDuyet("khu-vuc")] },
  endpoints: [
    {
      path: "/tao-tu-mau",
      method: "post",
      handler: async (req) => {
        try {
          if (!laNguoiViet(req)) throw new LoiNguoiDung("Bạn không có quyền tạo trang.", 403, "KHONG_CO_QUYEN");
          const { duLieu } = await docBody(req);
          return json(await taoTrangKhuVucTuMau(req.payload, req, { dichVu: String(duLieu.dichVu || ""), quan: String(duLieu.quan || "") }), 201);
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
  ],
  fields: [
    { type: "row", fields: [
      { name: "dichVu", label: "Dịch vụ", type: "relationship", relationTo: "danh-muc-dich-vu", required: true },
      { name: "quan", label: "Quận", type: "relationship", relationTo: "quan", required: true },
    ] },
    ...truongSeo,
    {
      name: "doanRieng", label: "Đoạn mô tả riêng của quận (≥150 chữ)", type: "textarea", required: true,
      admin: { description: "Khu chung cư, tuyến đường, giờ cao điểm, lỗi khách ở quận này hay gặp. Không chép từ trang quận khác." },
    },
    { name: "noiDung", label: "Nội dung (từ mẫu, sửa lại cho quận)", type: "richText", required: true },
    {
      name: "anhThat", label: "Ảnh việc thật tại quận (≥2, có mô tả)", type: "upload", relationTo: "media", hasMany: true,
    },
    {
      name: "danhGia", label: "Đánh giá thật của khách ở quận (≥1)", type: "relationship", relationTo: "danh-gia", hasMany: true,
      filterOptions: ({ data }) => (data?.quan ? { quan: { equals: typeof data.quan === "object" ? data.quan.id : data.quan } } : true),
    },
    truongFaq,
    {
      name: "slug", label: "Đường dẫn", type: "text", unique: true, index: true,
      admin: { position: "sidebar", readOnly: true, description: "Tự tạo: <dịch vụ>-<quận>. Trang ở /dich-vu/<dịch vụ>/<quận>/." },
    },
    ...truongDuyet,
  ],
};
