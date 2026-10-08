// Phần dùng chung cho hai loại bài: trang dịch vụ và bài cẩm nang.
import { APIError, type CollectionBeforeChangeHook, type Field, type Payload } from "payload";
import { kiemTraBai, taoSlug, tomTatKiemTra } from "./kiem-tra.mjs";
import { coTheDang, truongChiNguoiDuyet } from "./quyen";
import { noiDungSangMarkdown } from "./soan-thao";

export type LoaiBai = "dich-vu" | "cam-nang";

/** Slug của mọi bài (kể cả nháp) và của bài đã đăng. */
export async function slugsDangCo(payload: Payload) {
  const lay = async (collection: LoaiBai) => {
    const { docs } = await payload.find({
      collection, limit: 1000, depth: 0, pagination: false, select: { slug: true, _status: true },
    });
    return {
      tatCa: new Set(docs.map((d) => String(d.slug))),
      daDang: new Set(docs.filter((d) => d._status === "published").map((d) => String(d.slug))),
    };
  };
  const [dv, cn] = [await lay("dich-vu"), await lay("cam-nang")];
  return {
    slugs: { "dich-vu": dv.tatCa, "cam-nang": cn.tatCa },
    slugsDaDang: { "dich-vu": dv.daDang, "cam-nang": cn.daDang },
  };
}

/**
 * Chạy mỗi lần lưu bài:
 *  - Chặn người không có quyền "Duyệt bài" bấm đăng.
 *  - Chạy luật kiểm tra, ghi kết quả vào ô "Kiểm tra bài" để người viết thấy ngay.
 *  - Đang đăng mà còn lỗi thì từ chối, bài không lên web.
 */
export const hookKiemTraVaDuyet =
  (loai: LoaiBai): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const bai = { ...(originalDoc || {}), ...data };
    const dangDang = data._status === "published";

    if (dangDang && !coTheDang(req)) {
      throw new APIError(
        'Bạn chưa có quyền đăng bài. Đổi "Trạng thái duyệt" sang "Chờ duyệt" rồi bấm Lưu nháp để người duyệt xem.',
        403,
        undefined,
        true,
      );
    }

    const markdown = await noiDungSangMarkdown(req.payload, bai.noiDung);
    const { slugs, slugsDaDang } = await slugsDangCo(req.payload);
    if (bai.slug) slugs[loai].add(String(bai.slug)); // bài đang sửa có thể chưa lưu lần nào
    const cungTieuDe = bai.title
      ? await req.payload.count({
          collection: loai,
          where: { and: [{ title: { equals: bai.title } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] },
          req,
        })
      : { totalDocs: 0 };

    const ketQua = kiemTraBai({ loai, data: bai, markdown, slugs, slugsDaDang, trungTieuDe: cungTieuDe.totalDocs > 0 });
    data.ketQuaKiemTra = tomTatKiemTra(ketQua);

    if (dangDang && ketQua.loi.length) {
      throw new APIError(`Chưa đăng được, còn ${ketQua.loi.length} lỗi:\n• ${ketQua.loi.join("\n• ")}`, 400, undefined, true);
    }
    if (dangDang) data.trangThaiDuyet = "daDuyet";
    return data;
  };

export const truongSlug: Field = {
  name: "slug",
  label: "Đường dẫn",
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: { position: "sidebar", description: "Tự tạo từ tiêu đề nếu để trống. Đổi sau khi đã đăng sẽ làm mất thứ hạng Google." },
  hooks: {
    beforeValidate: [({ value, data }) => (value ? taoSlug(value) : taoSlug(data?.title))],
  },
};

export const truongSeo: Field[] = [
  {
    name: "title",
    label: "Tiêu đề SEO",
    type: "text",
    required: true,
    admin: { description: "25–70 ký tự, có từ khoá chính. Hiện trên Google và tab trình duyệt." },
  },
  {
    name: "description",
    label: "Mô tả SEO",
    type: "textarea",
    required: true,
    admin: { description: "100–170 ký tự. Đoạn mô tả hiện dưới tiêu đề trên Google." },
  },
  { name: "keyword", label: "Từ khoá chính", type: "text", required: true },
];

export const truongFaq: Field = {
  name: "faq",
  label: "Câu hỏi thường gặp",
  type: "array",
  labels: { singular: "Câu hỏi", plural: "Câu hỏi" },
  fields: [
    { name: "q", label: "Câu hỏi", type: "text", required: true },
    { name: "a", label: "Trả lời", type: "textarea", required: true },
  ],
};

export const truongDuyet: Field[] = [
  {
    name: "trangThaiDuyet",
    label: "Trạng thái duyệt",
    type: "select",
    defaultValue: "nhap",
    admin: { position: "sidebar" },
    options: [
      { label: "Đang viết", value: "nhap" },
      { label: "Chờ duyệt", value: "choDuyet" },
      { label: "Cần sửa", value: "canSua" },
      { label: "Đã duyệt", value: "daDuyet" },
    ],
  },
  {
    name: "ghiChuDuyet",
    label: "Ghi chú của người duyệt",
    type: "textarea",
    admin: { position: "sidebar" },
  },
  {
    name: "giaDaDuyet",
    label: "Giá đã duyệt",
    type: "checkbox",
    defaultValue: false,
    access: { create: truongChiNguoiDuyet, update: truongChiNguoiDuyet },
    admin: { position: "sidebar", description: "Chỉ người duyệt tick được. Bài có nêu giá phải tick mới đăng được." },
  },
  {
    name: "ketQuaKiemTra",
    label: "Kiểm tra bài",
    type: "textarea",
    admin: { position: "sidebar", readOnly: true, description: "Tự cập nhật mỗi lần lưu." },
  },
];

export const xemTruoc = (loai: LoaiBai) => (doc: Record<string, unknown>) =>
  doc?.slug ? `/xem-truoc/?loai=${loai}&slug=${encodeURIComponent(String(doc.slug))}` : null;
