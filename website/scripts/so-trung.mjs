// So một bài hoặc kịch bản với tư liệu transcript, báo đoạn chép nguyên văn (12 chữ liên tiếp trở lên).
// Dùng: node website/scripts/so-trung.mjs <bai-hoac-kich-ban> <tu-lieu.md> [tu-lieu-khac.md ...]
import fs from "node:fs";
import { doanTrung } from "../lib/tu-lieu.mjs";

const [bai, ...tuLieu] = process.argv.slice(2);
if (!bai || !tuLieu.length) {
  console.error("Dùng: node website/scripts/so-trung.mjs <bai-hoac-kich-ban> <tu-lieu.md> [...]");
  process.exit(2);
}
const text = fs.readFileSync(bai, "utf8");
let trung = 0;
for (const f of tuLieu) {
  const d = doanTrung(text, fs.readFileSync(f, "utf8").replace(/^---[\s\S]*?\n---/, ""));
  if (d) { trung++; console.error(`Trùng với ${f}: "${d}…". Viết lại đoạn này bằng lời của mình.`); }
}
if (trung) process.exit(1);
console.log(`Không có đoạn chép nguyên văn (${tuLieu.length} tư liệu).`);
