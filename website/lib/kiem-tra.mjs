// Luật kiểm tra bài, dùng chung cho CMS (khi lưu/đăng) và script kiểm tra hàng loạt.
// Đầu vào là dữ liệu bài + thân bài ở dạng Markdown. Không đọc database ở đây.

export const LUAT = {
  "dich-vu": { batBuoc: ["title", "description", "keyword", "ten", "tomTat"], soChuToiThieu: 350 },
  "cam-nang": { batBuoc: ["title", "description", "keyword", "nhom", "ngay"], soChuToiThieu: 600 },
};

const TEN_TRUONG = {
  title: "Tiêu đề SEO", description: "Mô tả SEO", keyword: "Từ khoá chính", ten: "Tên dịch vụ",
  tomTat: "Tóm tắt", nhom: "Nhóm từ khoá", ngay: "Ngày đăng",
};

const norm = (s) => String(s || "").toLowerCase().normalize("NFC");
export const demChu = (md) => String(md || "").split(/\s+/).filter(Boolean).length;
export const coNeuGia = (md) => /\d[\d.,]*\s*(đ|đồng|vnđ|vnd|k|nghìn|ngàn|triệu)(?!\p{L})/iu.test(String(md || ""));

/**
 * @param {object} p
 * @param {"dich-vu"|"cam-nang"} p.loai
 * @param {Record<string, any>} p.data   các trường của bài
 * @param {string} p.markdown            thân bài
 * @param {{ "dich-vu": Set<string>, "cam-nang": Set<string> }} p.slugs  slug đang có (cả nháp), để bắt liên kết hỏng
 * @param {{ "dich-vu": Set<string>, "cam-nang": Set<string> }} [p.slugsDaDang]  slug đã đăng; link tới trang chưa đăng thì cảnh báo
 * @param {boolean} [p.trungTieuDe]      đã có bài khác cùng tiêu đề
 * @returns {{ loi: string[], canhBao: string[], soChu: number }}
 */
export function kiemTraBai({ loai, data, markdown, slugs, slugsDaDang = slugs, trungTieuDe = false }) {
  const loi = [];
  const canhBao = [];
  const { batBuoc, soChuToiThieu } = LUAT[loai];
  const soChu = demChu(markdown);

  if (data.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug)) loi.push("Đường dẫn (slug) chỉ dùng chữ thường không dấu, nối bằng gạch ngang");
  for (const k of batBuoc) if (!data[k]) loi.push(`Chưa điền "${TEN_TRUONG[k] || k}"`);
  const t = String(data.title || "");
  const d = String(data.description || "");
  if (t && (t.length < 25 || t.length > 70)) loi.push(`Tiêu đề SEO dài ${t.length} ký tự, cần 25–70`);
  if (d && (d.length < 100 || d.length > 170)) loi.push(`Mô tả SEO dài ${d.length} ký tự, cần 100–170`);
  if (soChu < soChuToiThieu) loi.push(`Bài có ${soChu} chữ, cần tối thiểu ${soChuToiThieu}`);
  const kw = norm(data.keyword);
  const dau = norm(t + " " + String(markdown || "").split(/\s+/).slice(0, 120).join(" "));
  if (kw && !dau.includes(kw)) loi.push(`Từ khoá chính "${data.keyword}" phải có trong tiêu đề hoặc đoạn mở đầu`);
  if (/^#\s/m.test(markdown || "")) loi.push("Không dùng tiêu đề cấp 1 trong thân bài; tiêu đề trang lấy từ trường Tiêu đề");
  if (/\b(TODO|lorem ipsum)\b/i.test(markdown || "")) loi.push("Còn chữ TODO hoặc lorem ipsum");
  if (trungTieuDe) loi.push("Đã có bài khác cùng tiêu đề");
  for (const [, href] of String(markdown || "").matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const m = href.match(/^\/(dich-vu|cam-nang)\/([^/]+)\/?$/);
    if (m && !slugs[m[1]].has(m[2])) loi.push(`Liên kết nội bộ hỏng: ${href}`);
    else if (m && !slugsDaDang[m[1]].has(m[2])) canhBao.push(`Liên kết tới trang chưa đăng: ${href}`);
  }
  if (loai === "cam-nang" && !/\]\(\/dich-vu\//.test(markdown || "")) canhBao.push("Nên có ít nhất 1 liên kết tới trang dịch vụ");
  if (coNeuGia(markdown) && !data.giaDaDuyet) loi.push('Bài có nêu giá tiền: người duyệt cần kiểm tra giá rồi tick "Giá đã duyệt"');
  return { loi, canhBao, soChu };
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
