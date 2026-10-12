// Dữ liệu cho trang quản trị nội dung /quan-tri/: đọc bài, từ khoá, kế hoạch SEO từ CMS và tư liệu transcript,
// chạy cùng bộ luật kiểm tra mà CMS dùng khi đăng bài. Giao diện (giao-dien.js) chỉ hiển thị, không ghi gì.
import type { Payload } from "payload";
import site from "../../site.config.mjs";
import { docTuLieu, slugsDangCo } from "../bai";
import { cacMucKiemTra, demChu, norm } from "../kiem-tra.mjs";
import { noiDungSangMarkdown } from "../soan-thao";
import { allTuLieu } from "../tu-lieu.mjs";

const iso = (d: unknown) => (d ? new Date(String(d)).toISOString().slice(0, 10) : "");
type Loai = "dich-vu" | "cam-nang";

export async function duLieuQuanTri(payload: Payload) {
  const { slugs, slugsDaDang } = await slugsDangCo(payload);
  const [dichVu, camNang, tuKhoa, keHoach] = await Promise.all([
    payload.find({ collection: "dich-vu", draft: true, limit: 1000, depth: 0, pagination: false }),
    payload.find({ collection: "cam-nang", draft: true, limit: 1000, depth: 0, pagination: false }),
    payload.find({ collection: "tu-khoa", limit: 2000, depth: 1, pagination: false, sort: "createdAt" }),
    payload.findGlobal({ slug: "ke-hoach-seo" }),
  ]);
  const slugDichVu = new Map(dichVu.docs.map((d) => [d.id, String(d.slug)]));
  const demTieuDe = new Map<string, number>();
  for (const d of [...dichVu.docs, ...camNang.docs]) demTieuDe.set(norm(d.title), (demTieuDe.get(norm(d.title)) || 0) + 1);

  const docs: { loai: Loai; doc: (typeof dichVu.docs)[number] | (typeof camNang.docs)[number] }[] = [
    ...dichVu.docs.map((doc) => ({ loai: "dich-vu" as const, doc })),
    ...camNang.docs.map((doc) => ({ loai: "cam-nang" as const, doc })),
  ];
  const markdowns = await Promise.all(docs.map(({ doc }) => noiDungSangMarkdown(payload, (doc as { noiDung?: unknown }).noiDung)));
  const pages = docs.map(({ loai, doc }, i) => {
    const d = doc as Record<string, any>;
    const markdown = markdowns[i];
    const kw = norm(d.keyword);
    const body = norm(markdown);
    const dichVuLienQuan = loai === "cam-nang"
      ? ((d.dichVuLienQuan || []) as number[]).map((id) => slugDichVu.get(id)).filter(Boolean)
      : [];
    return {
      section: loai,
      slug: String(d.slug),
      path: `/${loai}/${d.slug}/`,
      sua: `/admin/collections/${loai}/${d.id}`,
      daDang: d._status === "published",
      trangThaiDuyet: d.trangThaiDuyet || "",
      title: d.title || "",
      description: d.description || "",
      keyword: d.keyword || "",
      ten: d.ten || "",
      nhom: d.nhom || "",
      ngay: iso(d.ngay),
      capNhat: iso(d.capNhat || d.updatedAt),
      words: demChu(markdown),
      kwCount: kw ? body.split(kw).length - 1 : 0,
      faq: ((d.faq || []) as { q: string }[]).map((f) => f.q),
      headings: [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map(([, h, text]) => ({ level: h.length, text: text.trim() })),
      linksOut: [...new Set([...markdown.matchAll(/\]\((\/[^)\s#]*)/g)].map(([, h]) => (h.endsWith("/") ? h : `${h}/`)))],
      images: (markdown.match(/!\[/g) || []).length,
      dichVuLienQuan,
      tuLieu: ((d.tuLieu || []) as string[]).map(String),
      giaDaDuyet: Boolean(d.giaDaDuyet),
      checks: cacMucKiemTra({
        loai, data: d, markdown, slugs, slugsDaDang,
        trungTieuDe: (demTieuDe.get(norm(d.title)) || 0) > 1, tuLieu: docTuLieu(d.tuLieu),
      }),
    };
  });
  for (const p of pages) {
    (p as typeof p & { linksIn: string[] }).linksIn = pages
      .filter((o) => o !== p && (o.linksOut.includes(p.path) || (p.section === "dich-vu" && o.dichVuLienQuan.includes(p.slug))))
      .map((o) => o.path);
  }
  const trungTieuDe = [...demTieuDe].filter(([, n]) => n > 1).map(([t]) =>
    pages.filter((p) => norm(p.title) === t).map((p) => p.path));

  // Nhóm từ khoá dựng lại từ bảng Từ khoá trong CMS (giữ thứ tự nhóm như lúc nạp).
  const nhomTuKhoa: { nhom: string; yDinh: string; luotTimThang: string; dichVu: string; tuKhoa: string[] }[] = [];
  for (const k of tuKhoa.docs) {
    let g = nhomTuKhoa.find((x) => x.nhom === k.nhom);
    if (!g) {
      g = { nhom: k.nhom, yDinh: k.yDinh || "", luotTimThang: k.luotTimThang || "", dichVu: "", tuKhoa: [] };
      nhomTuKhoa.push(g);
    }
    if (!g.dichVu && k.dichVu && typeof k.dichVu === "object") g.dichVu = String(k.dichVu.slug);
    g.tuKhoa.push(k.tuKhoa);
  }
  const noiDungDayDu = new Map(pages.map((p, i) => [p.path, norm(p.title + " " + markdowns[i])]));
  const kwIndex: Record<string, { chinh: string[]; nhac: string[] }> = {};
  for (const g of nhomTuKhoa) {
    for (const k of g.tuKhoa) {
      const nk = norm(k);
      kwIndex[k] = {
        chinh: pages.filter((p) => norm(p.keyword) === nk).map((p) => p.path),
        nhac: [...noiDungDayDu].filter(([, b]) => !nk.includes("[") && b.includes(nk)).map(([p]) => p),
      };
    }
  }

  const tuLieu = allTuLieu();
  return {
    kwIndex,
    site: { name: site.name, slogan: site.slogan, url: site.url, allowIndex: site.allowIndex },
    builtAt: new Date().toISOString(),
    pages,
    duplicates: trungTieuDe,
    plan: {
      nhomTuKhoa,
      lichDang: (keHoach.lichDang || []).map((x) => ({ thang: x.thang, baiCamNang: x.baiCamNang ?? 0, trangKhac: x.trangKhac || "", chuDe: x.chuDe || "" })),
      quyTac: (keHoach.quyTac || []).map((x) => x.noiDung),
      nguon: keHoach.nguon || "",
    },
    tuLieu: tuLieu.map((t) => ({
      slug: t.slug,
      link: t.data.link || "",
      kenh: t.data.kenh || "",
      tieuDe: t.data.tieuDe || t.slug,
      ngayLay: iso(t.data.ngayLay),
      ngayDang: iso(t.data.ngayDang),
      luotXem: t.data.luotXem ?? null,
      chuDe: t.data.chuDe || [],
      loai: t.data.loai || "",
      cauHoiKhach: t.data.cauHoiKhach || [],
      words: t.words,
      dungBoi: pages.filter((p) => p.tuLieu.includes(t.slug)).map((p) => p.path),
    })),
  };
}
