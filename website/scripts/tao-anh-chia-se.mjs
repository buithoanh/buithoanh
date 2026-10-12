// Tạo ảnh chia sẻ public/og.png (hiện khi gửi link qua Zalo/Facebook) và icon màn hình chính (apple-icon, icon-192, icon-512)
// từ logo public/favicon.svg. Chạy lại khi đổi tên, slogan hoặc logo:  node scripts/tao-anh-chia-se.mjs
import fs from "node:fs";
import { chromium } from "@playwright/test";
import site from "../site.config.mjs";

const font = (sub, w) => `data:font/woff2;base64,${fs.readFileSync(`node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-${sub}-${w}-normal.woff2`).toString("base64")}`;
const faces = [600, 800].map((w) => `
  @font-face { font-family: B; font-weight: ${w}; src: url(${font("latin", w)}) format("woff2"); unicode-range: U+0000-00FF; }
  @font-face { font-family: B; font-weight: ${w}; src: url(${font("vietnamese", w)}) format("woff2"); unicode-range: U+0100-1EF9; }`).join("");
const logo = fs.readFileSync("public/favicon.svg", "utf8");
const [dau, ...sau] = site.slogan.split(/,\s*/);

const og = `<!doctype html><meta charset="utf-8"><style>${faces}
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: B; color: #fff; overflow: hidden;
  background: radial-gradient(700px 520px at 92% 30%, rgba(232, 89, 12, .45), rgba(232, 89, 12, 0) 70%), #13283f; }
.wrap { position: absolute; inset: 0; padding: 72px 80px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 18px; }
.brand svg { width: 68px; height: 68px; }
.brand b { display: block; font-size: 40px; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
.brand small { display: block; margin-top: 6px; font-size: 20px; font-weight: 600; color: #ffb27a; }
h1 { margin-top: auto; font-size: 100px; line-height: 1.03; font-weight: 800; letter-spacing: -.04em; }
h1 em { font-style: normal; color: #ffb27a; }
p { margin-top: 26px; font-size: 32px; font-weight: 600; color: #c3cfdc; }
.big { position: absolute; right: -40px; top: 120px; width: 400px; height: 400px; transform: rotate(-8deg); filter: drop-shadow(0 40px 60px rgba(0,0,0,.35)); }
.big svg { width: 100%; height: 100%; }
</style><div class="big">${logo}</div>
<div class="wrap"><div class="brand">${logo}<span><b>${site.name}</b><small>${site.tagline}</small></span></div>
<h1>${sau.length ? `${dau},<br><em>${sau.join(", ")}.</em>` : site.slogan}</h1><p>Sửa ô tô tận nơi · ${site.city}</p></div>`;

// Icon vuông tràn viền (iOS tự bo góc, Android cắt theo khuôn): nền cam, logo không khung.
const icon = (n) => `<!doctype html><style>* { margin: 0; } body { width: ${n}px; height: ${n}px; background: #e8590c; }
svg { width: 100%; height: 100%; } svg > rect { rx: 0; }</style>${logo}`;

const trinhDuyet = await chromium.launch();
for (const [file, html, w, h] of [["public/og.png", og, 1200, 630], ["public/apple-icon.png", icon(180), 180, 180], ["public/icon-192.png", icon(192), 192, 192], ["public/icon-512.png", icon(512), 512, 512]]) {
  const p = await trinhDuyet.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: file });
  console.log("Đã tạo", file);
}
await trinhDuyet.close();
