// Kiểm tra mọi bài trong content/ trước khi build. Lỗi thì build dừng, bài không lên web.
// Chạy riêng: npm run kiem-tra   (thêm tên file để chỉ kiểm tra bài đó)
import fs from "node:fs";
import path from "node:path";
import { slugsOf, readEntry } from "../lib/content.mjs";

const only = process.argv.slice(2).map((p) => path.basename(p, ".md"));
const errors = [];
const warnings = [];
const services = new Set(slugsOf("dich-vu"));
const norm = (s) => String(s || "").toLowerCase().normalize("NFC");

const RULES = {
  "dich-vu": { required: ["title", "description", "keyword", "ten", "tomTat"], minWords: 350 },
  "cam-nang": { required: ["title", "description", "keyword", "nhom", "ngay"], minWords: 600 },
};

const seenTitles = new Map();
for (const section of Object.keys(RULES)) {
  for (const slug of slugsOf(section)) {
    const e = readEntry(section, slug);
    const where = `content/${section}/${slug}.md`;
    seenTitles.set(norm(e.data.title), [...(seenTitles.get(norm(e.data.title)) || []), where]);
    if (only.length && !only.includes(slug)) continue;
    const err = (m) => errors.push(`${where}: ${m}`);
    const warn = (m) => warnings.push(`${where}: ${m}`);
    const { required, minWords } = RULES[section];

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) err("tên file phải là chữ thường không dấu, nối bằng gạch ngang (ví dụ thay-ac-quy-o-to.md)");
    for (const k of required) if (!e.data[k]) err(`thiếu trường "${k}" ở phần đầu bài`);
    const t = String(e.data.title || "");
    const d = String(e.data.description || "");
    if (t && (t.length < 25 || t.length > 70)) err(`tiêu đề dài ${t.length} ký tự, cần 25–70`);
    if (d && (d.length < 100 || d.length > 170)) err(`mô tả dài ${d.length} ký tự, cần 100–170`);
    if (e.words < minWords) err(`bài có ${e.words} chữ, cần tối thiểu ${minWords}`);
    const kw = norm(e.data.keyword);
    const head = norm(t + " " + e.body.split(/\s+/).slice(0, 120).join(" "));
    if (kw && !head.includes(kw)) err(`từ khoá chính "${e.data.keyword}" phải có trong tiêu đề hoặc đoạn mở đầu`);
    if (/^#\s/m.test(e.body)) err("không dùng tiêu đề cấp 1 (# ) trong thân bài; tiêu đề trang lấy từ trường title");
    if (/\b(TODO|lorem ipsum)\b/i.test(e.body)) err("còn chữ TODO hoặc lorem ipsum");
    for (const s of e.data.dichVuLienQuan || []) if (!services.has(s)) err(`dichVuLienQuan "${s}" không có trong content/dich-vu`);
    for (const [, href] of e.body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      const m = href.match(/^\/(dich-vu|cam-nang)\/([^/]+)\/?$/);
      if (m && !slugsOf(m[1]).includes(m[2])) err(`liên kết nội bộ hỏng: ${href}`);
    }
    if (section === "cam-nang" && !/\]\(\/dich-vu\//.test(e.body)) warn("nên có ít nhất 1 liên kết tới trang dịch vụ");
    if (/\d[\d.,]*\s*(đ|đồng|vnđ|vnd|k|nghìn|ngàn|triệu)(?!\p{L})/iu.test(e.body) && !e.data.giaDaDuyet) {
      err("bài có nêu giá tiền: cần người phụ trách xác nhận rồi thêm giaDaDuyet: true ở phần đầu bài");
    }
  }
}
for (const [title, files] of seenTitles) if (title && files.length > 1) errors.push(`trùng tiêu đề: ${files.join(", ")}`);

// Kế hoạch bài do agent lập (content/ke-hoach-seo.json → baiKeHoach), duyệt trên trang quản trị.
const plan = JSON.parse(fs.readFileSync(path.join("content", "ke-hoach-seo.json"), "utf8"));
const planSlugs = new Set();
const planKeywords = new Map(slugsOf("cam-nang").map((s) => [norm(readEntry("cam-nang", s).data.keyword), `content/cam-nang/${s}.md`]));
for (const [i, b] of (plan.baiKeHoach || []).entries()) {
  const where = `ke-hoach-seo.json baiKeHoach[${i}]${b?.slug ? ` (${b.slug})` : ""}`;
  for (const k of ["thang", "slug", "tieuDe", "tuKhoa", "nhom"]) if (!b?.[k]) errors.push(`${where}: thiếu trường "${k}"`);
  if (b.thang && !/^\d{4}-\d{2}$/.test(b.thang)) errors.push(`${where}: "thang" phải dạng YYYY-MM`);
  if (b.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.slug)) errors.push(`${where}: slug phải chữ thường không dấu, nối bằng gạch ngang`);
  if (b.slug && planSlugs.has(b.slug)) errors.push(`${where}: trùng slug trong kế hoạch`);
  planSlugs.add(b.slug);
  if (b.nhom && !plan.nhomTuKhoa.some((n) => n.nhom === b.nhom)) errors.push(`${where}: nhóm "${b.nhom}" không có trong nhomTuKhoa`);
  for (const s of b.dichVuLienQuan || []) if (!services.has(s)) errors.push(`${where}: dichVuLienQuan "${s}" không có trong content/dich-vu`);
  const kw = norm(b.tuKhoa);
  const owner = planKeywords.get(kw);
  // Bài đã viết theo đúng mục kế hoạch thì dùng chung từ khoá là hợp lệ.
  if (kw && owner && owner !== `content/cam-nang/${b.slug}.md`) errors.push(`${where}: từ khoá "${b.tuKhoa}" đã có ở ${owner}`);
  if (kw) planKeywords.set(kw, `content/cam-nang/${b.slug}.md`);
}

for (const w of warnings) console.warn(`Cảnh báo  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`Lỗi      ${e}`);
  console.error(`\n${errors.length} lỗi. Sửa xong mới build được.`);
  process.exit(1);
}
console.log(`Kiểm tra bài: đạt (${slugsOf("dich-vu").length} trang dịch vụ, ${slugsOf("cam-nang").length} bài cẩm nang).`);
