// Nội dung (P1): trang khu vực từ mẫu, số liệu kiểm tra trang khu vực, hẹn giờ đăng, danh sách bài cho /quan-tri/bai-viet/,
// đổi nội dung bài (có khối giá, khối đặt lịch, video YouTube) ra HTML với giá lấy từ bảng giá tại thời điểm xem.
import crypto from "node:crypto";
import { convertLexicalToHTML, type HTMLConvertersFunction } from "@payloadcms/richtext-lexical/html";
import type { Payload, PayloadRequest, Where } from "payload";
import { demChu } from "./kiem-tra.mjs";
import { tyLeTrung } from "./trung-noi-dung.mjs";
import { LoiNguoiDung, hangMucHienThi, layPhiChung } from "./cong-khai";
import { markdownSangNoiDung, maYoutube, noiDungSangMarkdown } from "./soan-thao";

const idCua = (v: unknown) => (typeof v === "object" && v ? (v as { id: number }).id : (v as number));
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// ------------------------------------------------------------------ trang khu vực

/** Số liệu để chạy luật trang khu vực (lib/kiem-tra.mjs). */
export async function soLieuKhuVuc(payload: Payload, bai: Record<string, unknown>, idHienTai: number | string | undefined, vanBan: string) {
  const anhIds = ((bai.anhThat || []) as unknown[]).map(idCua).filter(Boolean);
  const anh = anhIds.length
    ? (await payload.find({ collection: "media", where: { id: { in: anhIds } }, limit: 50, depth: 0, overrideAccess: true })).docs
    : [];
  const dgIds = ((bai.danhGia || []) as unknown[]).map(idCua).filter(Boolean);
  const quanId = idCua(bai.quan);
  const danhGia = dgIds.length
    ? (await payload.find({ collection: "danh-gia", where: { id: { in: dgIds } }, limit: 50, depth: 0, overrideAccess: true })).docs
    : [];
  const khac = (await payload.find({
    collection: "trang-khu-vuc", draft: true, limit: 500, depth: 0, pagination: false, overrideAccess: true,
    where: idHienTai ? { id: { not_equals: idHienTai } } : {},
  })).docs;
  let max = 0;
  let trangTrung = "";
  for (const t of khac) {
    const vb = `${t.doanRieng || ""}\n\n${await noiDungSangMarkdown(payload, t.noiDung)}`;
    const a = tyLeTrung(vanBan, vb);
    if (a > max) { max = a; trangTrung = `"${t.title}"`; }
  }
  return {
    soChuDoanRieng: demChu(String(bai.doanRieng || "")),
    soAnh: anh.length,
    soAnhThieuMoTa: anh.filter((a) => !String(a.alt || "").trim()).length,
    soDanhGiaThat: danhGia.filter((d) => idCua(d.quan) === quanId && !d.duLieuMau).length,
    tyLeTrung: max,
    trangTrung,
  };
}

const idKhoi = () => crypto.randomBytes(12).toString("hex");
const khoi = (blockType: string, fields: Record<string, unknown>) => ({
  type: "block", version: 2, format: "", fields: { id: idKhoi(), blockName: "", blockType, ...fields },
});

/** Tạo bản nháp trang khu vực từ mẫu: điền tiêu đề, khung bài, khối giá, phường, thời gian tới, câu hỏi thường gặp. */
export async function taoTrangKhuVucTuMau(payload: Payload, req: PayloadRequest, p: { dichVu: string; quan: string }) {
  const tim = async <T extends "danh-muc-dich-vu" | "quan">(collection: T, v: string) =>
    (await payload.find({ collection, limit: 1, depth: 0, where: /^\d+$/.test(v) ? { id: { equals: Number(v) } } : { slug: { equals: v } } })).docs[0];
  const [dv, q] = [await tim("danh-muc-dich-vu", p.dichVu), await tim("quan", p.quan)];
  if (!dv) throw new LoiNguoiDung("Không có dịch vụ này.", 400, "DICH_VU_KHONG_CO");
  if (!q) throw new LoiNguoiDung("Không có quận này.", 400, "QUAN_KHONG_CO");
  const slug = `${dv.slug}-${q.slug}`;
  const daCo = (await payload.find({ collection: "trang-khu-vuc", draft: true, where: { slug: { equals: slug } }, limit: 1, depth: 0 })).docs[0];
  if (daCo) throw new LoiNguoiDung(`Đã có trang "${daCo.title}". Mở trang đó để sửa.`, 409, "DA_CO_TRANG", { id: daCo.id });
  const [phuong, phi] = await Promise.all([
    payload.find({ collection: "phuong", where: { and: [{ quan: { equals: q.id } }, { dangPhucVu: { equals: true } }] }, limit: 100, depth: 0, sort: "ten" }),
    layPhiChung(payload),
  ]);
  const eta = `${q.etaTu}–${q.etaDen} phút`;
  const tenThuong = dv.ten.charAt(0).toLowerCase() + dv.ten.slice(1);
  const md = [
    `## Thợ làm gì khi tới ${q.ten}`,
    `${dv.moTaNgan ? `${dv.moTaNgan}. ` : ""}Thợ mang đồ nghề và phụ tùng tới tận chỗ xe đang đỗ ở ${q.ten}, kiểm tra rồi gửi báo giá từng hạng mục qua điện thoại. Bạn đồng ý thì thợ mới làm. ${dv.ghiChuBangGia || ""}`,
    `## Giá ${tenThuong} tại ${q.ten}`,
    "%%KHOI_GIA%%",
    `Cùng một bảng giá với trang dịch vụ. Giá chính thức chốt sau khi thợ kiểm tra xe.`,
    `## Phường đang phục vụ ở ${q.ten}`,
    phuong.docs.map((x) => x.ten).join(", ") + ".",
    `## Bao lâu thì thợ tới`,
    `Trong ${q.ten}, thợ tới dự kiến sau ${eta} kể từ khi đơn được xác nhận. Gọi gấp khi xe hỏng giữa đường, thợ có mặt trong ${phi.camKetCuuHoPhut} phút.`,
    "%%KHOI_DAT_LICH%%",
  ].join("\n\n");
  const noiDung = (await markdownSangNoiDung(payload, md)) as { root: { children: Record<string, unknown>[] } };
  noiDung.root.children = noiDung.root.children.flatMap((n) => {
    const chu = JSON.stringify(n);
    if (chu.includes("%%KHOI_GIA%%")) return [khoi("khoiGia", { tieuDe: `Giá ${tenThuong} tại ${q.ten}`, dichVu: dv.id, kemPhiDiLai: true })];
    if (chu.includes("%%KHOI_DAT_LICH%%")) return [khoi("khoiDatLich", { tieuDe: `Đặt thợ tới ${q.ten}`, dichVu: dv.id })];
    return [n];
  });
  const doc = await payload.create({
    collection: "trang-khu-vuc", draft: true, req, overrideAccess: false,
    data: {
      _status: "draft",
      dichVu: dv.id, quan: q.id,
      title: `${dv.ten} ô tô tận nơi ${q.ten}, thợ tới ${eta}`.slice(0, 70),
      description: `Thợ ThợTới tới tận nơi ở ${q.ten}: ${(dv.moTaNgan || dv.ten).toLowerCase()}. Có mặt dự kiến ${eta}, báo giá trước khi làm, bảo hành ${phi.baoHanhPhuTungThang} tháng phụ tùng.`.slice(0, 170),
      keyword: `${dv.ten} ô tô tận nơi ${q.ten}`.toLowerCase(),
      doanRieng: "",
      noiDung: noiDung as never,
      faq: [
        { q: `Thợ tới ${q.ten} mất bao lâu?`, a: `Dự kiến ${eta} kể từ khi đơn được xác nhận. Gọi gấp thì thợ có mặt trong ${phi.camKetCuuHoPhut} phút.` },
        { q: `Xe đỗ trong hầm chung cư ở ${q.ten} thợ có vào được không?`, a: "Được. Bạn báo trước với ban quản lý toà nhà và ghi tầng hầm, ô đỗ khi đặt lịch." },
        { q: `Giá ở ${q.ten} có khác các quận khác không?`, a: `Không. Giá theo bảng giá chung, phí đi lại ${phi.hienThi.phiDiLai} trong vùng phục vụ.` },
      ],
      trangThaiDuyet: "nhap",
    },
  });
  return { id: doc.id, slug: doc.slug, title: doc.title, sua: `/admin/collections/trang-khu-vuc/${doc.id}`, ketQuaKiemTra: doc.ketQuaKiemTra };
}

// ------------------------------------------------------------------ hẹn giờ đăng

const BAI = ["dich-vu", "cam-nang", "trang-khu-vuc", "trang-hang-xe"] as const;
type CollectionBai = (typeof BAI)[number];

/** Việc định kỳ: đăng các bài đã hẹn giờ tới giờ. Không đăng được (còn lỗi) thì trả về "Cần sửa" kèm lý do. */
export async function dangBaiHenGio(payload: Payload, bayGio = new Date()) {
  let soBai = 0;
  for (const collection of BAI) {
    const { docs } = await payload.find({
      collection, draft: true, limit: 100, depth: 0, overrideAccess: true,
      where: { and: [{ trangThaiDuyet: { equals: "daHenGio" } }, { henGioDang: { less_than_equal: bayGio.toISOString() } }] },
    });
    for (const d of docs) {
      try {
        await payload.update({ collection, id: d.id, overrideAccess: true, context: { choPhepDang: true }, data: { _status: "published" } as never });
        soBai++;
      } catch (e) {
        await payload.update({
          collection, id: d.id, draft: true, overrideAccess: true,
          data: { trangThaiDuyet: "canSua", ghiChuDuyet: `Không tự đăng được lúc ${bayGio.toISOString()}: ${(e as Error).message}` } as never,
        }).catch(() => {});
      }
    }
  }
  return soBai;
}

// ------------------------------------------------------------------ danh sách cho /quan-tri/bai-viet/

const LOAI_NHAN: Record<CollectionBai, { loai: string; nhan: string }> = {
  "cam-nang": { loai: "cam-nang", nhan: "Bài cẩm nang" },
  "dich-vu": { loai: "dich-vu", nhan: "Trang dịch vụ" },
  "trang-khu-vuc": { loai: "khu-vuc", nhan: "Trang khu vực" },
  "trang-hang-xe": { loai: "hang-xe", nhan: "Trang hãng xe" },
};

/** Trạng thái hiển thị theo thiết kế QtBaiViet: nhap | cho-duyet | hen-gio | da-dang. */
export const trangThaiHienThi = (d: { _status?: string | null; trangThaiDuyet?: string | null }) =>
  d.trangThaiDuyet === "daHenGio" ? "hen-gio" : d._status === "published" && d.trangThaiDuyet !== "choDuyet" ? "da-dang" : d.trangThaiDuyet === "choDuyet" ? "cho-duyet" : "nhap";

export async function danhSachBai(payload: Payload, p: { trangThai?: string; loai?: string; q?: string }) {
  const out: { trangThai: string; [k: string]: unknown }[] = [];
  for (const collection of BAI) {
    if (p.loai && LOAI_NHAN[collection].loai !== p.loai) continue;
    const where: Where = p.q ? { title: { like: p.q } } : {};
    const { docs } = await payload.find({ collection, draft: true, limit: 500, depth: 1, pagination: false, where, sort: "-updatedAt", overrideAccess: true });
    for (const d of docs as Record<string, any>[]) {
      const tt = trangThaiHienThi(d);
      if (p.trangThai && tt !== p.trangThai) continue;
      const loai = LOAI_NHAN[collection].loai;
      const duongDan = loai === "khu-vuc"
        ? `/dich-vu/${d.dichVu?.slug || ""}/${d.quan?.slug || ""}/`
        : loai === "hang-xe" ? `/hang-xe/${d.slug}/` : `/${loai}/${d.slug}/`;
      out.push({
        id: d.id, collection, loai, loaiNhan: LOAI_NHAN[collection].nhan,
        tieuDe: d.ten || d.title, title: d.title, description: d.description, duongDan,
        trangThai: tt, trangThaiDuyet: d.trangThaiDuyet || null, daDang: d._status === "published",
        tacGia: typeof d.nguoiViet === "object" && d.nguoiViet ? d.nguoiViet.ten || d.nguoiViet.email : null,
        nguoiDuyet: typeof d.nguoiDuyet === "object" && d.nguoiDuyet ? d.nguoiDuyet.ten || d.nguoiDuyet.email : null,
        henGioDang: d.henGioDang || null, capNhat: d.updatedAt, ngay: d.ngay || d.createdAt,
        chuDe: d.chuDe || null, ketQuaKiemTra: d.ketQuaKiemTra || "", ghiChuDuyet: d.ghiChuDuyet || "",
        sua: `/admin/collections/${collection}/${d.id}`,
      });
    }
  }
  const dem = (t: string) => out.filter((x) => x.trangThai === t).length;
  return { bai: out, dem: { tatCa: out.length, nhap: dem("nhap"), choDuyet: dem("cho-duyet"), henGio: dem("hen-gio"), daDang: dem("da-dang") } };
}

// ------------------------------------------------------------------ nội dung → HTML

/**
 * Đổi nội dung bài ra HTML cho trang công khai. Khối giá lấy giá hiện hành trong bảng giá (đổi giá là bài đổi theo),
 * video YouTube chỉ là ảnh xem trước + nút phát (giao diện tải iframe khi bấm), khối đặt lịch là liên kết /dat-lich/?dv=…
 */
export async function noiDungHtml(payload: Payload, noiDung: unknown) {
  if (!noiDung || typeof noiDung !== "object" || !("root" in noiDung)) return "";
  const [hm, dv, phi] = await Promise.all([
    payload.find({ collection: "hang-muc-gia", limit: 2000, depth: 0, pagination: false, sort: "thuTu" }),
    payload.find({ collection: "danh-muc-dich-vu", limit: 100, depth: 0, pagination: false }),
    layPhiChung(payload),
  ]);
  const slugDv = new Map(dv.docs.map((d) => [d.id, d.slug]));
  const converters: HTMLConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    blocks: {
      khoiGia: ({ node }: { node: { fields: Record<string, unknown> } }) => {
        const f = node.fields;
        const dvId = idCua(f.dichVu);
        const chon = ((f.hangMuc || []) as unknown[]).map(idCua);
        const dong = hm.docs.filter((h) => idCua(h.dichVu) === dvId && (!chon.length || chon.includes(h.id)))
          .map((h) => hangMucHienThi(h as never));
        const tr = dong.map((d) => `<tr><td>${esc(d.ten)}<small>${esc(d.loaiNhan)}</small></td><td>${esc(d.giaHienThi)}</td></tr>`);
        if (f.kemPhiDiLai) tr.push(`<tr><td>Phí đi lại<small>Trong vùng phục vụ</small></td><td>${esc(phi.hienThi.phiDiLai)}</td></tr>`);
        return `<figure class="khoi-gia" data-dich-vu="${esc(slugDv.get(dvId) || "")}"><figcaption>${esc(f.tieuDe || "Giá tham khảo")}</figcaption><table><tbody>${tr.join("")}</tbody></table><p class="khoi-gia-ghi-chu">Giá lấy từ bảng giá chung. Giá chính thức chốt sau khi thợ kiểm tra xe.</p></figure>`;
      },
      khoiDatLich: ({ node }: { node: { fields: Record<string, unknown> } }) => {
        const f = node.fields;
        const dvSlug = f.dichVu ? slugDv.get(idCua(f.dichVu)) : "";
        const href = f.khanCap ? "/goi-gap/" : `/dat-lich/${dvSlug ? `?dv=${encodeURIComponent(dvSlug)}` : ""}`;
        return `<aside class="khoi-dat-lich"><p class="khoi-dat-lich-tieu-de">${esc(f.tieuDe || "Cần thợ tới tận nơi?")}</p>${f.moTa ? `<p>${esc(f.moTa)}</p>` : ""}<a class="btn btn-primary nut nut-chinh" href="${esc(href)}">${f.khanCap ? "Gọi thợ gấp" : "Đặt lịch"}</a></aside>`;
      },
      videoYoutube: ({ node }: { node: { fields: Record<string, unknown> } }) => {
        const id = maYoutube(String(node.fields.url || ""));
        if (!id) return "";
        return `<figure class="video-youtube" data-youtube-id="${id}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${esc(node.fields.tieuDe)}" loading="lazy" width="480" height="360"><button type="button" class="video-youtube-phat" aria-label="Phát video: ${esc(node.fields.tieuDe)}">▶</button><figcaption>${esc(node.fields.tieuDe)}</figcaption></figure>`;
      },
    },
  });
  return convertLexicalToHTML({ data: noiDung as never, disableContainer: true, converters });
}
