// Trang quản trị nội dung & SEO /quan-tri/ (giao diện một trang, điều hướng bằng #). Dữ liệu đọc thẳng từ CMS
// mỗi lần mở, nên luôn khớp với bài trong /admin. Chỉ người đăng nhập CMS mới xem được.
import config from "@payload-config";
import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import site from "../../site.config.mjs";
import { duLieuQuanTri } from "../../lib/quan-tri/du-lieu";

export const dynamic = "force-dynamic";

const docTep = (f: string) => fs.readFileSync(path.join(process.cwd(), "lib", "quan-tri", f), "utf8");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function GET(req: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return Response.redirect(new URL("/admin/login?redirect=%2Fquan-tri%2F", site.url), 303);
  }
  const data = await duLieuQuanTri(payload);
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const ten = esc(String((user as { ten?: string }).ten || user.email));
  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Quản trị nội dung · ${esc(site.name)}</title>
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap">
<style>${docTep("giao-dien.css")}</style>
</head>
<body>
<div class="shell">
  <aside class="side">
    <a class="brand" href="#tong-quan"><b>${esc(site.name)}</b><span>Quản trị nội dung &amp; SEO</span></a>
    <nav id="nav" aria-label="Mục quản trị"></nav>
    <div class="foot">${ten}<br><a href="/admin">Mở CMS (/admin)</a><br><a href="/" target="_blank" rel="noopener">Mở website ↗</a></div>
  </aside>
  <main class="main" id="view" tabindex="-1"></main>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="data" type="application/json">${json}</script>
<script>${docTep("giao-dien.js")}</script>
</body>
</html>
`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
