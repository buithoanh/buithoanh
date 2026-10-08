// Sau khi build: khi chưa bật lập chỉ mục, gắn header noindex cho mọi trang trên Cloudflare Pages.
import fs from "node:fs";
const index = process.env.ALLOW_INDEX === "1";
const headers = index
  ? "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n"
  : "/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n";
fs.writeFileSync("out/_headers", headers);
console.log(index ? "Đang cho phép Google lập chỉ mục." : "Chế độ chạy thử: đã chặn Google lập chỉ mục (noindex).");
