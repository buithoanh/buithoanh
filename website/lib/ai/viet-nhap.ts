// Luồng "AI viết bản nháp" bấm từ trang Từ khoá:
//   kiểm tra → đánh dấu "Đang viết…" → (chạy nền) Claude viết → lưu thành BẢN NHÁP bài cẩm nang → báo kết quả.
// AI không bao giờ đăng bài. Người duyệt đọc, sửa, rồi mới bấm đăng.
import type { Payload } from "payload";
import site from "../../site.config.mjs";
import { taoSlug } from "../kiem-tra.mjs";
import { markdownSangNoiDung } from "../soan-thao";
import { vietBaiBangAI, type BaiAI } from "./claude";

const QUA_HAN_MS = 20 * 60 * 1000; // "Đang viết" quá 20 phút coi như đã chết (server khởi động lại...)

export async function batDauAIVietNhap(
  payload: Payload,
  id: string,
): Promise<{ ok: true } | { ok: false; status: number; loi: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, status: 503, loi: "Chưa cấu hình ANTHROPIC_API_KEY trên server." };
  }
  const tk = await payload.findByID({ collection: "tu-khoa", id, depth: 0 }).catch(() => null);
  if (!tk) return { ok: false, status: 404, loi: "Không tìm thấy từ khoá." };
  if (tk.trangThai === "daCoBai" || tk.trangThai === "boQua") {
    return { ok: false, status: 409, loi: "Từ khoá này đã có bài hoặc đánh dấu không viết." };
  }
  const batDau = tk.ai?.batDauLuc ? new Date(tk.ai.batDauLuc).getTime() : 0;
  if (tk.ai?.trangThai === "dangChay" && Date.now() - batDau < QUA_HAN_MS) {
    return { ok: false, status: 409, loi: "AI đang viết bài cho từ khoá này." };
  }

  await payload.update({
    collection: "tu-khoa",
    id,
    data: { ai: { trangThai: "dangChay", thongBao: "AI đang viết, thường mất 2–5 phút.", batDauLuc: new Date().toISOString() } },
  });
  // Chạy nền: trả lời ngay cho trình duyệt, kết quả ghi vào từ khoá.
  void chayNen(payload, id);
  return { ok: true };
}

async function chayNen(payload: Payload, id: string) {
  try {
    const tk = await payload.findByID({ collection: "tu-khoa", id, depth: 1 });
    const [dichVu, baiDaCo, caiDat] = await Promise.all([
      payload.find({ collection: "dich-vu", limit: 100, depth: 0, pagination: false, select: { slug: true, ten: true } }),
      payload.find({ collection: "cam-nang", limit: 1000, depth: 0, pagination: false, draft: true, select: { slug: true, title: true, keyword: true } }),
      payload.findGlobal({ slug: "cai-dat" }),
    ]);
    const dv = typeof tk.dichVu === "object" && tk.dichVu ? { slug: String(tk.dichVu.slug), ten: String(tk.dichVu.ten) } : null;

    const bai = await vietBaiBangAI({
      tuKhoa: tk.tuKhoa,
      nhom: tk.nhom,
      yDinh: tk.yDinh,
      dichVuDich: dv,
      dichVu: dichVu.docs.map((d) => ({ slug: String(d.slug), ten: String(d.ten) })),
      baiDaCo: baiDaCo.docs.map((b) => ({ slug: String(b.slug), title: String(b.title), keyword: String(b.keyword) })),
      thuongHieu: {
        ten: site.name,
        slogan: site.slogan,
        thanhPho: caiDat.khuVuc?.length ? `${caiDat.khuVuc.map((k) => k.ten).join(", ")} (${site.city})` : site.city,
        xuongDoiTac: caiDat.xuongDoiTac || site.partnerWorkshop,
        congTyMe: site.parent,
      },
      ngayHomNay: new Date().toISOString().slice(0, 10),
    });

    const baiMoi = await luuBanNhap(payload, bai, tk.tuKhoa, tk.nhom, dichVu.docs);
    await payload.update({
      collection: "tu-khoa",
      id,
      data: {
        trangThai: "dangViet",
        baiViet: baiMoi.id,
        ai: { trangThai: "xong", thongBao: `Đã tạo bản nháp "${bai.title}". Mở mục "Bài viết nhắm từ khoá này" để đọc và sửa.` },
      },
    });
  } catch (e) {
    payload.logger.error({ err: e, msg: `AI viết nháp lỗi (từ khoá ${id})` });
    await payload
      .update({ collection: "tu-khoa", id, data: { ai: { trangThai: "loi", thongBao: `Lỗi: ${(e as Error).message}` } } })
      .catch(() => {});
  }
}

/** Agent bên ngoài gửi bài Markdown vào: tạo bản nháp và gắn vào từ khoá (nếu có trong danh sách). */
export async function nhanBanNhapTuNgoai(payload: Payload, d: Record<string, unknown>) {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const ds = <T>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  const bai: BaiAI = {
    title: s(d.title), description: s(d.description), slug: s(d.slug), noiDungMarkdown: s(d.noiDungMarkdown),
    faq: ds<{ q: string; a: string }>(d.faq).filter((f) => f?.q && f?.a),
    dichVuLienQuan: ds<string>(d.dichVuLienQuan).map(String),
    nguon: ds<BaiAI["nguon"][number]>(d.nguon).filter((n) => n?.ten),
    ghiChuChoNguoiDuyet: s(d.ghiChuChoNguoiDuyet),
  };
  const tuKhoa = s(d.keyword);
  if (!bai.title || !tuKhoa || !bai.noiDungMarkdown) throw new Error("Cần title, keyword và noiDungMarkdown.");
  const tk = (await payload.find({ collection: "tu-khoa", where: { tuKhoa: { equals: tuKhoa } }, limit: 1, depth: 0 })).docs[0];
  const nhom = s(d.nhom) || tk?.nhom || "Thông tin";
  const dichVu = (await payload.find({ collection: "dich-vu", limit: 100, depth: 0, pagination: false, select: { slug: true } })).docs;
  const moi = await luuBanNhap(payload, bai, tuKhoa, nhom, dichVu);
  if (tk) await payload.update({ collection: "tu-khoa", id: tk.id, data: { trangThai: "dangViet", baiViet: moi.id } });
  return moi;
}

export async function luuBanNhap(
  payload: Payload,
  bai: BaiAI,
  tuKhoa: string,
  nhom: string,
  dichVu: { id: number | string; slug?: string | null }[],
) {
  const noiDung = await markdownSangNoiDung(payload, bai.noiDungMarkdown);

  // Slug không trùng bài đang có
  const goc = taoSlug(bai.slug || bai.title);
  let slug = goc;
  for (let i = 2; (await payload.count({ collection: "cam-nang", where: { slug: { equals: slug } } })).totalDocs > 0; i++) {
    slug = `${goc}-${i}`;
  }

  const ghiChu = [
    "Bài do AI viết. Đọc kỹ trước khi đăng.",
    bai.ghiChuChoNguoiDuyet,
    bai.nguon.some((n) => n.loai === "vcwiki") ? "" : "Chưa dùng nguồn VCwiki.",
  ].filter(Boolean).join("\n\n");

  return payload.create({
    collection: "cam-nang",
    draft: true,
    data: {
      _status: "draft",
      title: bai.title,
      description: bai.description,
      keyword: tuKhoa,
      nhom: nhom as never,
      slug,
      noiDung: noiDung as never,
      faq: bai.faq,
      nguonThamKhao: bai.nguon,
      dichVuLienQuan: dichVu.filter((d) => bai.dichVuLienQuan.includes(String(d.slug))).map((d) => d.id) as never,
      ngay: new Date().toISOString(),
      trangThaiDuyet: "nhap",
      ghiChuAI: ghiChu,
    },
  });
}
