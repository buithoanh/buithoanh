// Sau khi build: khi chưa bật lập chỉ mục, gắn header noindex cho mọi trang trên Cloudflare Pages.
import fs from "node:fs";
import path from "node:path";
import { lienHe, kyThuatVien } from "../mock/du-lieu-mau.mjs";
const index = process.env.ALLOW_INDEX === "1";
const headers = index
  ? "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n"
  : "/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n";
fs.writeFileSync("out/_headers", headers);
console.log(index ? "Đang cho phép Google lập chỉ mục." : "Chế độ chạy thử: đã chặn Google lập chỉ mục (noindex).");

// Bản thật (ALLOW_INDEX=1) tuyệt đối không được còn dữ liệu mẫu trong trang.
if (index) {
  const dau = [lienHe.hotline, lienHe.email, ...kyThuatVien.map((k) => k.ten)];
  const html = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? html(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
  const loi = html("out").flatMap((f) => { const t = fs.readFileSync(f, "utf8"); return dau.filter((x) => t.includes(x)).map((x) => `${f}: còn "${x}"`); });
  if (loi.length) { console.error("Bản thật còn dữ liệu mẫu:\n" + loi.join("\n")); process.exit(1); }
  console.log("Không còn dữ liệu mẫu trong trang.");
}
