// Phần dùng chung cho các loại bài: trang dịch vụ, bài cẩm nang, trang khu vực, trang hãng xe.
import { APIError, type CollectionBeforeChangeHook, type Field, type Payload } from "payload";
import { demChu, kiemTraBai, taoSlug, tomTatKiemTra } from "./kiem-tra.mjs";
import { coTheDang, laNguoiDuyet, truongChiNguoiDuyet } from "./quyen";
import { soLieuKhuVuc } from "./noi-dung";
import { noiDungSangMarkdown } from "./soan-thao";
import { readTuLieu, tuLieuSlugs } from "./tu-lieu.mjs";

export type LoaiBai = "dich-vu" | "cam-nang" | "khu-vuc" | "hang-xe";
export const COLLECTION_BAI = { "dich-vu": "dich-vu", "cam-nang": "cam-nang", "khu-vuc": "trang-khu-vuc", "hang-xe": "trang-hang-xe" } as const;

/** Slug của mọi bài (kể cả nháp) và của bài đã đăng. */
export async function slugsDangCo(payload: Payload) {
  const lay = async (collection: "dich-vu" | "cam-nang") => {
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

/** Nội dung tư liệu transcript bài dẫn nguồn; tư liệu không có trong thư mục thì body = null. */
export function docTuLieu(slugs: unknown): { slug: string; body: string | null }[] {
  const co = new Set(tuLieuSlugs());
  return (Array.isArray(slugs) ? slugs : []).map(String).filter(Boolean)
    .map((slug) => ({ slug, body: co.has(slug) ? readTuLieu(slug).body : null }));
}

/**
 * Chạy mỗi lần lưu bài:
 *  - Chặn người không phải người duyệt bấm đăng hoặc hẹn giờ đăng.
 *  - Chạy luật kiểm tra, ghi kết quả vào ô "Kiểm tra bài" để người viết thấy ngay.
 *  - Còn lỗi thì không gửi duyệt được, không hẹn giờ được, không đăng được (kể cả Quản trị).
 */
export const hookKiemTraVaDuyet =
  (loai: LoaiBai): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req, operation }) => {
    const bai = { ...(originalDoc || {}), ...data };
    const dangDang = data._status === "published";
    const truocDo = originalDoc?.trangThaiDuyet;
    const guiDuyet = data.trangThaiDuyet === "choDuyet" && truocDo !== "choDuyet";
    const henGio = data.trangThaiDuyet === "daHenGio" && truocDo !== "daHenGio";

    if (dangDang && !coTheDang(req)) {
      throw new APIError(
        'Bạn chưa có quyền đăng bài. Đổi "Trạng thái duyệt" sang "Chờ duyệt" rồi bấm Lưu nháp để người duyệt xem.',
        403,
        undefined,
        true,
      );
    }
    if (henGio) {
      if (!laNguoiDuyet(req)) throw new APIError("Chỉ người duyệt mới hẹn giờ đăng được.", 403, undefined, true);
      if (!bai.henGioDang || new Date(bai.henGioDang).getTime() <= Date.now()) {
        throw new APIError('Chọn "Hẹn giờ đăng" là một thời điểm trong tương lai.', 400, undefined, true);
      }
    }
    if (operation === "create" && req.user && !bai.nguoiViet) data.nguoiViet = req.user.id;

    // Đường dẫn tự tạo cho trang khu vực, trang hãng xe
    if (loai === "khu-vuc" && bai.dichVu && bai.quan) {
      const [dv, q] = await Promise.all([
        req.payload.findByID({ collection: "danh-muc-dich-vu", id: idCua(bai.dichVu), depth: 0, req }),
        req.payload.findByID({ collection: "quan", id: idCua(bai.quan), depth: 0, req }),
      ]);
      data.slug = `${dv.slug}-${q.slug}`;
    }
    if (loai === "hang-xe" && bai.hang) {
      data.slug = (await req.payload.findByID({ collection: "hang-xe", id: idCua(bai.hang), depth: 0, req })).slug;
    }

    const than = await noiDungSangMarkdown(req.payload, bai.noiDung);
    const markdown = loai === "khu-vuc" ? `${bai.doanRieng || ""}\n\n${than}` : than;
    const { slugs, slugsDaDang } = await slugsDangCo(req.payload);
    if (bai.slug && (loai === "dich-vu" || loai === "cam-nang")) slugs[loai].add(String(bai.slug)); // bài đang sửa có thể chưa lưu lần nào
    const cungTieuDe = bai.title
      ? await req.payload.count({
          collection: COLLECTION_BAI[loai],
          where: { and: [{ title: { equals: bai.title } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] },
          req,
        })
      : { totalDocs: 0 };

    const ketQua = kiemTraBai({
      loai, data: bai, markdown, slugs, slugsDaDang, trungTieuDe: cungTieuDe.totalDocs > 0, tuLieu: docTuLieu(bai.tuLieu),
      khuVuc: loai === "khu-vuc" ? await soLieuKhuVuc(req.payload, bai, originalDoc?.id, `${bai.doanRieng || ""}\n\n${than}`) : undefined,
    });
    data.ketQuaKiemTra = tomTatKiemTra(ketQua);
    if (loai === "cam-nang") data.thoiGianDocPhut = Math.max(1, Math.round(demChu(markdown) / 220));

    const danhSachLoi = `${ketQua.loi.length} lỗi:\n• ${ketQua.loi.join("\n• ")}`;
    if (dangDang && ketQua.loi.length) throw new APIError(`Chưa đăng được, còn ${danhSachLoi}`, 400, undefined, true);
    if (henGio && ketQua.loi.length) throw new APIError(`Chưa hẹn giờ được, còn ${danhSachLoi}`, 400, undefined, true);
    if (guiDuyet && ketQua.loi.length) throw new APIError(`Chưa gửi duyệt được, còn ${danhSachLoi}`, 400, undefined, true);
    if (dangDang) {
      data.trangThaiDuyet = "daDuyet";
      if (req.user && laNguoiDuyet(req)) data.nguoiDuyet = req.user.id;
    }
    return data;
  };

const idCua = (v: unknown) => (typeof v === "object" && v ? (v as { id: number }).id : (v as number));

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

export const truongTuLieu: Field = {
  name: "tuLieu",
  label: "Tư liệu đã dùng",
  type: "text",
  hasMany: true,
  admin: {
    position: "sidebar",
    description: "Slug tư liệu transcript trong tu-lieu/transcript (không hiện trên web). Bài chép nguyên văn từ 12 chữ liên tiếp sẽ không đăng được.",
  },
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
      { label: "Đã hẹn giờ đăng", value: "daHenGio" },
      { label: "Đã duyệt", value: "daDuyet" },
    ],
  },
  {
    name: "henGioDang",
    label: "Hẹn giờ đăng",
    type: "date",
    access: { create: truongChiNguoiDuyet, update: truongChiNguoiDuyet },
    admin: {
      position: "sidebar",
      date: { pickerAppearance: "dayAndTime" },
      description: 'Người duyệt chọn giờ, đổi trạng thái sang "Đã hẹn giờ đăng" rồi Lưu nháp. Nên đăng 7:00 sáng.',
    },
  },
  { name: "nguoiViet", label: "Người viết", type: "relationship", relationTo: "users", admin: { position: "sidebar" } },
  { name: "nguoiDuyet", label: "Người duyệt", type: "relationship", relationTo: "users", admin: { position: "sidebar", readOnly: true } },
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
