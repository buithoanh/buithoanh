// Gửi bài cẩm nang vào CMS dưới dạng bản nháp. Dùng: node gui-bai.mjs <file.md>
// Cần VCMC_URL và VCMC_API_KEY.
import { readFileSync } from "node:fs";

const [file] = process.argv.slice(2);
const { VCMC_URL, VCMC_API_KEY } = process.env;
if (!file || !VCMC_URL || !VCMC_API_KEY) {
  console.error("Thiếu file bài hoặc biến VCMC_URL / VCMC_API_KEY.");
  process.exit(1);
}

const raw = readFileSync(file, "utf8");
const [, fm, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
const field = (k) => fm.match(new RegExp(`^${k}: "(.*)"$`, "m"))?.[1];
const faq = [...fm.matchAll(/- q: "(.*)"\n\s+a: "(.*)"/g)].map(([, q, a]) => ({ q, a }));
const dichVu = fm.match(/^dichVuLienQuan: \[(.*)\]$/m)?.[1].split(",").map((s) => s.trim()) ?? [];

const bai = {
  title: field("title"),
  description: field("description"),
  keyword: field("keyword"),
  slug: file.split("/").pop().replace(/\.md$/, ""),
  noiDungMarkdown: body.trim(),
  faq,
  dichVuLienQuan: dichVu,
  tuLieu: [],
  nguon: [],
  ghiChuChoNguoiDuyet: [
    "Không dùng transcript/VCwiki, không tra web. Số khẩn cấp 113/114/115 là số công khai.",
    "Cần xem kỹ: 1) chức năng ghi cho 113/114/115; 2) bài chưa ghi khoảng cách đặt biển cảnh báo; 3) đoạn giới thiệu ThợTới và xưởng Auto Speedy; 4) không có hotline trong bài.",
  ].join("\n"),
};

const res = await fetch(`${VCMC_URL}/api/cam-nang/nhap-tu-markdown`, {
  method: "POST",
  headers: { Authorization: `users API-Key ${VCMC_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(bai),
});
console.log(res.status, JSON.stringify(await res.json(), null, 2));
