// Đọc tư liệu transcript (chữ lấy từ video TikTok bằng TIKTIKTOTEXT / VCwiki) trong thư mục tu-lieu/transcript ở gốc repo.
// Tư liệu chỉ để tham khảo ý và câu hỏi của khách; không hiển thị lên website công khai.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const TU_LIEU_DIR = process.env.TU_LIEU_DIR || path.join(process.cwd(), "..", "tu-lieu", "transcript");

/** Slug các file tư liệu. File bắt đầu bằng "_" (mẫu, nháp) bị bỏ qua. */
export function tuLieuSlugs() {
  if (!fs.existsSync(TU_LIEU_DIR)) return [];
  return fs.readdirSync(TU_LIEU_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}

export function readTuLieu(slug) {
  const { data, content } = matter(fs.readFileSync(path.join(TU_LIEU_DIR, `${slug}.md`), "utf8"));
  return { slug, data, body: content, words: content.split(/\s+/).filter(Boolean).length };
}

export const allTuLieu = () => tuLieuSlugs().map(readTuLieu);

const words = (s) => String(s).toLowerCase().normalize("NFC")
  .replace(/\[\d{1,2}:\d{2}(:\d{2})?\]/g, " ")
  .split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * Tìm đoạn chép nguyên văn: chuỗi từ N chữ liên tiếp giống hệt nhau giữa bài và tư liệu.
 * Trả về đoạn đầu tiên tìm thấy, hoặc "" nếu không trùng.
 */
export function doanTrung(bai, tuLieu, n = 12) {
  const a = words(bai);
  const b = words(tuLieu);
  if (a.length < n || b.length < n) return "";
  const set = new Set();
  for (let i = 0; i + n <= b.length; i++) set.add(b.slice(i, i + n).join(" "));
  for (let i = 0; i + n <= a.length; i++) {
    const s = a.slice(i, i + n).join(" ");
    if (set.has(s)) return s;
  }
  return "";
}
