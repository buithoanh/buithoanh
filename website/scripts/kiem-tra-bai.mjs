// Kiểm tra mọi bài trong content/ trước khi build. Lỗi thì build dừng, bài không lên web.
// Chạy riêng: npm run kiem-tra   (thêm tên file để chỉ kiểm tra bài đó). Quy tắc nằm ở lib/kiem-tra.mjs.
import path from "node:path";
import { slugsOf } from "../lib/content.mjs";
import { checkAll } from "../lib/kiem-tra.mjs";

const only = process.argv.slice(2).map((p) => path.basename(p, ".md"));
const errors = [];
const warnings = [];

const { entries, duplicates } = checkAll();
for (const { entry, checks } of entries) {
  if (only.length && !only.includes(entry.slug)) continue;
  const where = `content/${entry.section}/${entry.slug}.md`;
  for (const ch of checks) {
    if (ch.ok) continue;
    for (const m of ch.detail.split("; ")) (ch.level === "warn" ? warnings : errors).push(`${where}: ${m}`);
  }
}
for (const files of duplicates) errors.push(`trùng tiêu đề: ${files.join(", ")}`);

for (const w of warnings) console.warn(`Cảnh báo  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`Lỗi      ${e}`);
  console.error(`\n${errors.length} lỗi. Sửa xong mới build được.`);
  process.exit(1);
}
console.log(`Kiểm tra bài: đạt (${slugsOf("dich-vu").length} trang dịch vụ, ${slugsOf("cam-nang").length} bài cẩm nang).`);
