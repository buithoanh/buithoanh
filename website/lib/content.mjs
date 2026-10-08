// Đọc bài viết Markdown trong content/. Dùng chung cho website và script kiểm tra bài.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = path.join(process.cwd(), "content");
export const SECTIONS = { dichVu: "dich-vu", camNang: "cam-nang" };

export function slugsOf(section) {
  const dir = path.join(ROOT, section);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();
}

export function readEntry(section, slug) {
  const file = path.join(ROOT, section, `${slug}.md`);
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const words = content.split(/\s+/).filter(Boolean).length;
  return { slug, section, file, data, body: content, words, html: marked.parse(content) };
}

export function allEntries(section) {
  return slugsOf(section).map((s) => readEntry(section, s));
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
