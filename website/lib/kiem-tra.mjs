// Luật kiểm tra bài, dùng chung cho CMS (khi lưu/đăng), trang /quan-tri/ và script kiểm tra hàng loạt.
// Đầu vào là dữ liệu bài + thân bài ở dạng Markdown. Không đọc database ở đây.
import site from "../site.config.mjs";
import { doanTrung } from "./tu-lieu.mjs";

export const LUAT = {
  "dich-vu": { batBuoc: ["title", "description", "keyword", "ten", "tomTat"], soChuToiThieu: 350 },
  "cam-nang": { batBuoc: ["title", "description", "keyword", "nhom", "ngay"], soChuToiThieu: 600 },
};

const TEN_TRUONG = {
  title: "Tiêu đề SEO", description: "Mô tả SEO", keyword: "Từ khoá chính", ten: "Tên dịch vụ",
  tomTat: "Tóm tắt", nhom: "Nhóm từ khoá", ngay: "Ngày đăng",
};

export const norm = (s) => String(s || "").toLowerCase().normalize("NFC");
export const demChu = (md) => String(md || "").split(/\s+/).filter(Boolean).length;
export const coNeuGia = (md) => /\d[\d.,]*\s*(đ|đồng|vnđ|vnd|k|nghìn|ngàn|triệu)(?!\p{L})/iu.test(String(md || ""));

/**
 * Danh sách mục kiểm tra của một bài, kể cả mục đã đạt (trang quản trị tính điểm theo tỷ lệ đạt).
 * @param {object} p
 * @param {"dich-vu"|"cam-nang"} p.loai
 * @param {Record<string, any>} p.data   các trường của bài
 * @param {string} p.markdown            thân bài
 * @param {{ "dich-vu": Set<string>, "cam-nang": Set<string> }} p.slugs  slug đang có (cả nháp), để bắt liên kết hỏng
 * @param {{ "dich-vu": Set<string>, "cam-nang": Set<string> }} [p.slugsDaDang]  slug đã đăng; link tới trang chưa đăng thì cảnh báo
 * @param {boolean} [p.trungTieuDe]      đã có bài khác cùng tiêu đề
 * @param {{ slug: string, body: string | null }[]} [p.tuLieu]  tư liệu transcript bài dẫn (body null = không có trong repo)
 * @returns {{ label: string, ok: boolean, detail: string, level: "error" | "warn" }[]}
 */
export function cacMucKiemTra({ loai, data, markdown, slugs, slugsDaDang = slugs, trungTieuDe = false, tuLieu = [] }) {
  const md = String(markdown || "");
  const { batBuoc, soChuToiThieu } = LUAT[loai];
  const soChu = demChu(md);
  const t = String(data.title || "");
  const d = String(data.description || "");
  const kw = norm(data.keyword);
  const dau = norm(t + " " + md.split(/\s+/).slice(0, 120).join(" "));
  const thieu = batBuoc.filter((k) => !data[k]);
  const hong = [];
  const chuaDang = [];
  for (const [, href] of md.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const m = href.match(/^\/(dich-vu|cam-nang)\/([^/]+)\/?$/);
    if (m && !slugs[m[1]].has(m[2])) hong.push(href);
    else if (m && !slugsDaDang[m[1]].has(m[2])) chuaDang.push(href);
  }
  const tlThieu = tuLieu.filter((x) => x.body == null).map((x) => x.slug);
  const trung = tuLieu.filter((x) => x.body != null)
    .map((x) => ({ slug: x.slug, doan: doanTrung(md, x.body) }))
    .filter((x) => x.doan);

  const c = (label, ok, detail, level = "error") => ({ label, ok: Boolean(ok), detail: ok ? "" : detail, level });
  const muc = [
    c("Đường dẫn chữ thường không dấu", !data.slug || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug),
      "Đường dẫn (slug) chỉ dùng chữ thường không dấu, nối bằng gạch ngang"),
    c("Đủ các trường bắt buộc", !thieu.length, thieu.map((k) => `Chưa điền "${TEN_TRUONG[k] || k}"`).join("; ")),
    c("Tiêu đề SEO 25–70 ký tự", !t || (t.length >= 25 && t.length <= 70), `Tiêu đề SEO dài ${t.length} ký tự, cần 25–70`),
    c("Mô tả SEO 100–170 ký tự", !d || (d.length >= 100 && d.length <= 170), `Mô tả SEO dài ${d.length} ký tự, cần 100–170`),
    c(`Tối thiểu ${soChuToiThieu} chữ`, soChu >= soChuToiThieu, `Bài có ${soChu} chữ, cần tối thiểu ${soChuToiThieu}`),
    c("Từ khoá ở tiêu đề hoặc mở bài", !kw || dau.includes(kw),
      `Từ khoá chính "${data.keyword}" phải có trong tiêu đề hoặc đoạn mở đầu`),
    c("Không có tiêu đề cấp 1 trong thân bài", !/^#\s/m.test(md),
      "Không dùng tiêu đề cấp 1 trong thân bài; tiêu đề trang lấy từ trường Tiêu đề"),
    c("Không còn TODO / lorem ipsum", !/\b(TODO|lorem ipsum)\b/i.test(md), "Còn chữ TODO hoặc lorem ipsum"),
    c("Không trùng tiêu đề bài khác", !trungTieuDe, "Đã có bài khác cùng tiêu đề"),
    c("Liên kết nội bộ không hỏng", !hong.length, hong.map((h) => `Liên kết nội bộ hỏng: ${h}`).join("; ")),
    c("Liên kết tới trang đã đăng", !chuaDang.length, chuaDang.map((h) => `Liên kết tới trang chưa đăng: ${h}`).join("; "), "warn"),
    c("Giá tiền đã được duyệt", !coNeuGia(md) || Boolean(data.giaDaDuyet),
      'Bài có nêu giá tiền: người duyệt cần kiểm tra giá rồi tick "Giá đã duyệt"'),
    c("Không chép nguyên văn tư liệu", !trung.length,
      trung.map((x) => `Chép nguyên văn từ tư liệu "${x.slug}": "${x.doan}…", cần viết lại bằng lời của mình`).join("; ")),
    c("Tiêu đề không tự ghi tên thương hiệu", !site.name || !norm(t).includes(norm(site.name)),
      `Tiêu đề SEO đã có "${site.name}", website tự thêm " | ${site.name}" nên tên sẽ hiện hai lần trên Google`, "warn"),
  ];
  if (loai === "cam-nang") {
    muc.push(c("Có liên kết tới trang dịch vụ", /\]\(\/dich-vu\//.test(md), "Nên có ít nhất 1 liên kết tới trang dịch vụ", "warn"));
  }
  if (tuLieu.length) {
    muc.push(c("Tư liệu dẫn nguồn có trong repo", !tlThieu.length,
      tlThieu.map((s) => `Tư liệu "${s}" không có trong tu-lieu/transcript (bản xuất riêng tư thì bỏ qua)`).join("; "), "warn"));
  }
  return muc;
}

/** Gọn cho CMS: lỗi chặn đăng, cảnh báo chỉ để biết. */
export function kiemTraBai(p) {
  const muc = cacMucKiemTra(p);
  const tach = (level) => muc.filter((m) => !m.ok && m.level === level).flatMap((m) => m.detail.split("; "));
  return { loi: tach("error"), canhBao: tach("warn"), soChu: demChu(p.markdown) };
}

export function tomTatKiemTra({ loi, canhBao, soChu }) {
  const dong = [`${soChu} chữ`];
  if (!loi.length && !canhBao.length) dong.push("Đạt, có thể đăng.");
  for (const l of loi) dong.push(`✗ ${l}`);
  for (const c of canhBao) dong.push(`! ${c}`);
  return dong.join("\n");
}

/** Bỏ dấu tiếng Việt, ra slug dạng thay-ac-quy-o-to */
export function taoSlug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
