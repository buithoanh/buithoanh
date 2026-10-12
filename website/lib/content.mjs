// Đọc bài viết Markdown trong content/. Dùng chung cho website và script kiểm tra bài.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import site from "../site.config.mjs";
import * as mau from "../mock/du-lieu-mau.mjs";

const ROOT = path.join(process.cwd(), "content");

/** "Dấu hiệu ắc quy sắp hết" → "dau-hieu-ac-quy-sap-het" (dùng cho đường dẫn neo #...). */
export function slugify(s) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Tiêu đề cấp 2–3 có id để làm mục lục và gửi link tới đúng đoạn.
marked.use({
  renderer: {
    heading({ tokens, depth, text }) {
      const id = slugify(text);
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
  },
});
export const SECTIONS = { dichVu: "dich-vu", camNang: "cam-nang" };

export function slugsOf(section) {
  const dir = path.join(ROOT, section);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((f) => f.replace(/\.md$/, "")).sort();
}

export function readEntry(section, slug) {
  const file = path.join(ROOT, section, `${slug}.md`);
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const words = content.split(/\s+/).filter(Boolean).length;
  const toc = marked.lexer(content).filter((t) => t.type === "heading" && t.depth === 2).map((t) => ({ id: slugify(t.text), text: t.text.replace(/\*\*|__|`/g, "") }));
  return { slug, section, file, data, body: content, words, toc, html: marked.parse(content) };
}

export function allEntries(section) {
  return slugsOf(section).map((s) => readEntry(section, s));
}

/** Trang dịch vụ theo thứ tự hiển thị (trường thuTu). */
export function sortedServices() {
  return allEntries(SECTIONS.dichVu).sort((a, b) => (a.data.thuTu ?? 99) - (b.data.thuTu ?? 99));
}

/** Giá "từ ..." chỉ hiện khi người phụ trách đã duyệt (giaDaDuyet: true). Chạy thử thì có giá mẫu. */
export function approvedPrice(data, slug) {
  if (data.giaDaDuyet && data.giaTu) return String(data.giaTu);
  return site.mock ? mau.gia[slug] || "" : "";
}

/** Kỹ thuật viên: hồ sơ thật trong content/ky-thuat-vien/; chưa có thì chạy thử dùng hồ sơ mẫu. */
export function team() {
  const real = allEntries("ky-thuat-vien").sort((a, b) => (a.data.thuTu ?? 99) - (b.data.thuTu ?? 99));
  if (real.length || !site.mock) return real;
  return mau.kyThuatVien.map(({ slug, gioiThieu, ...data }) => ({ slug, data, html: `<p>${gioiThieu}</p>` }));
}

/** Đánh giá khách: content/danh-gia.json (thật); chưa có thì chạy thử dùng đánh giá mẫu. */
export function reviews() {
  const file = path.join(ROOT, "danh-gia.json");
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  return site.mock ? mau.danhGia : [];
}

/** Số liệu nổi bật (điểm đánh giá, lượt sửa, thời gian tới). Chỉ có khi chạy thử hoặc khi điền site.soLieu. */
export function stats() {
  return site.soLieu || (site.mock ? mau.soLieu : null);
}

/** Danh sách "Xe đang bị gì?" ở trang chủ. */
export function symptoms() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "trieu-chung.json"), "utf8"));
}

export function sortedArticles() {
  return allEntries(SECTIONS.camNang).sort((a, b) => String(b.data.ngay).localeCompare(String(a.data.ngay)));
}

export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
}

export function isoDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}
