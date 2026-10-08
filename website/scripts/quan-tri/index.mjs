// Tạo trang quản trị tĩnh out/quan-tri/index.html từ content/, kế hoạch SEO, tư liệu transcript và kết quả kiểm tra bài.
// Chạy sau next build (đã nằm trong npm run build). Chạy riêng: npm run quan-tri  (thêm --out <thư mục> để đổi nơi ghi).
// Trang chỉ đọc. Sửa bài thì mở trình sửa của GitHub và gửi pull request, giống quy trình SEO Editor.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import site from "../../site.config.mjs";
import { checkAll, norm } from "../../lib/kiem-tra.mjs";
import { allTuLieu } from "../../lib/tu-lieu.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outArg = process.argv.indexOf("--out");
const outDir = outArg > -1 ? process.argv[outArg + 1] : path.join(process.cwd(), "out", "quan-tri");
const plan = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "ke-hoach-seo.json"), "utf8"));
const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d ? String(d) : "");
const gh = `https://github.com/${site.repo}`;

const { entries, duplicates } = checkAll();
const tuLieu = allTuLieu();

const pages = entries.map(({ entry: e, checks }) => {
  const kw = norm(e.data.keyword);
  const body = norm(e.body);
  return {
    section: e.section,
    slug: e.slug,
    path: `/${e.section}/${e.slug}/`,
    file: `website/content/${e.section}/${e.slug}.md`,
    title: e.data.title || "",
    description: e.data.description || "",
    keyword: e.data.keyword || "",
    ten: e.data.ten || "",
    nhom: e.data.nhom || "",
    ngay: iso(e.data.ngay),
    capNhat: iso(e.data.capNhat),
    words: e.words,
    kwCount: kw ? body.split(kw).length - 1 : 0,
    faq: (e.data.faq || []).map((f) => f.q),
    headings: [...e.body.matchAll(/^(#{2,3})\s+(.+)$/gm)].map(([, h, text]) => ({ level: h.length, text: text.trim() })),
    linksOut: [...new Set([...e.body.matchAll(/\]\((\/[^)\s#]*)/g)].map(([, h]) => (h.endsWith("/") ? h : `${h}/`)))],
    images: (e.body.match(/!\[/g) || []).length,
    dichVuLienQuan: e.data.dichVuLienQuan || [],
    tuLieu: e.data.tuLieu || [],
    giaDaDuyet: !!e.data.giaDaDuyet,
    checks,
  };
});
for (const p of pages) {
  p.linksIn = pages.filter((o) => o !== p && (o.linksOut.includes(p.path) || o.dichVuLienQuan.includes(p.section === "dich-vu" ? p.slug : "")))
    .map((o) => o.path);
}

// Mỗi từ khoá trong kế hoạch: trang nào nhắm làm từ khoá chính, trang nào có nhắc tới.
const bodies = new Map(entries.map(({ entry: e }) => [`/${e.section}/${e.slug}/`, norm(e.data.title + " " + e.body)]));
const kwIndex = {};
for (const g of plan.nhomTuKhoa) {
  for (const k of g.tuKhoa) {
    const nk = norm(k);
    kwIndex[k] = {
      chinh: pages.filter((p) => norm(p.keyword) === nk).map((p) => p.path),
      nhac: [...bodies].filter(([, b]) => !nk.includes("[") && b.includes(nk)).map(([p]) => p),
    };
  }
}

const data = {
  kwIndex,
  site: { name: site.name, slogan: site.slogan, url: site.url, allowIndex: site.allowIndex, repo: site.repo, branch: site.repoBranch, gh },
  builtAt: new Date().toISOString(),
  pages,
  duplicates,
  plan: { nhomTuKhoa: plan.nhomTuKhoa, lichDang: plan.lichDang, quyTac: plan.quyTac, nguon: plan._nguon },
  tuLieu: tuLieu.map((t) => ({
    slug: t.slug,
    link: t.data.link || "",
    kenh: t.data.kenh || "",
    tieuDe: t.data.tieuDe || t.slug,
    ngayLay: iso(t.data.ngayLay),
    ngayDang: iso(t.data.ngayDang),
    luotXem: t.data.luotXem ?? null,
    chuDe: t.data.chuDe || [],
    loai: t.data.loai || "",
    cauHoiKhach: t.data.cauHoiKhach || [],
    words: t.words,
    dungBoi: pages.filter((p) => p.tuLieu.includes(t.slug)).map((p) => p.path),
  })),
};

const read = (f) => fs.readFileSync(path.join(here, f), "utf8");
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Quản trị nội dung · ${site.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap">
<style>${read("giao-dien.css")}</style>
</head>
<body>
<div class="shell">
  <aside class="side">
    <a class="brand" href="#tong-quan"><b>${site.name}</b><span>Quản trị nội dung &amp; SEO</span></a>
    <nav id="nav" aria-label="Mục quản trị"></nav>
    <div class="foot">Cập nhật mỗi lần build.<br><a href="${site.url}/" target="_blank" rel="noopener">Mở website ↗</a></div>
  </aside>
  <main class="main" id="view" tabindex="-1"></main>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="data" type="application/json">${json}</script>
<script>${read("giao-dien.js")}</script>
</body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
const err = pages.filter((p) => p.checks.some((c) => !c.ok && c.level === "error")).length;
console.log(`Trang quản trị: ${path.relative(process.cwd(), path.join(outDir, "index.html"))} (${pages.length} trang, ${tuLieu.length} tư liệu, ${err} trang có lỗi).`);
