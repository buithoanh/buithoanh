// Tạo icon (favicon, màn hình chính) và ảnh chia sẻ og.png (hiện khi gửi link qua Zalo/Facebook).
// Chạy lại khi đổi tên, slogan hoặc thành phố:  npx -y -p playwright@1.56.1 node scripts/tao-anh.mjs
// (cần trình duyệt Chromium; máy đã có Playwright thì chạy thẳng: node scripts/tao-anh.mjs)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import site from "../site.config.mjs";

const font = (w) => `data:font/woff2;base64,${fs.readFileSync(`node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-${w}-normal.woff2`).toString("base64")}`;
const fontLatin = (w) => `data:font/woff2;base64,${fs.readFileSync(`node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-${w}-normal.woff2`).toString("base64")}`;
const faces = [600, 800].map((w) => `
  @font-face { font-family: B; font-weight: ${w}; src: url(${fontLatin(w)}) format("woff2"); unicode-range: U+0000-00FF; }
  @font-face { font-family: B; font-weight: ${w}; src: url(${font(w)}) format("woff2"); unicode-range: U+0100-1EF9; }`).join("");

const pin = (fill, cut) => `<svg viewBox="0 0 36 36" width="100%" height="100%"><path d="M18 7.5c-4.4 0-8 3.4-8 7.7 0 5.6 8 13.3 8 13.3s8-7.7 8-13.3c0-4.3-3.6-7.7-8-7.7z" fill="${fill}"/><path d="M20.6 12.2a.6.6 0 0 0 0 .8l1 1a.6.6 0 0 0 .8 0l1.6-1.6a3.4 3.4 0 0 1-4.5 4.5l-3.4 3.4a1.2 1.2 0 0 1-1.7-1.7l3.4-3.4a3.4 3.4 0 0 1 4.5-4.5z" fill="${cut}"/></svg>`;
const [a, b] = site.slogan.split(/,\s*/);

const og = `<!doctype html><meta charset="utf-8"><style>${faces}
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: B; color: #0f1f33; overflow: hidden;
  background: radial-gradient(900px 500px at 100% 0%, #ffd9c2 0%, rgba(255,217,194,0) 60%), linear-gradient(180deg, #fff8f3, #fff); }
.wrap { position: absolute; inset: 0; padding: 72px 80px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 18px; font-size: 34px; font-weight: 800; letter-spacing: -.02em; }
.logo { width: 64px; height: 64px; border-radius: 18px; background: #e8590c; padding: 6px; }
h1 { margin-top: auto; font-size: 104px; line-height: 1.02; font-weight: 800; letter-spacing: -.04em; }
h1 em { font-style: normal; color: #e8590c; }
p { margin-top: 28px; font-size: 34px; font-weight: 600; color: #56657a; }
.big { position: absolute; right: -60px; top: 110px; width: 470px; height: 470px; border-radius: 120px; background: #e8590c; transform: rotate(-8deg); padding: 50px; box-shadow: 0 40px 80px rgba(217,72,15,.35); }
</style><div class="big">${pin("#fff", "#e8590c")}</div>
<div class="wrap"><div class="brand"><div class="logo">${pin("#fff", "#e8590c")}</div>${site.name}</div>
<h1>${a},<br><em>${b}.</em></h1><p>Sửa ô tô tận nơi · ${site.city}</p></div>`;

const icon = (size, radius) => `<!doctype html><style>* { margin: 0; } body { width: ${size}px; height: ${size}px; }
div { width: 100%; height: 100%; background: #e8590c; border-radius: ${radius}; padding: ${size * 0.12}px; box-sizing: border-box; }</style><div>${pin("#fff", "#e8590c")}</div>`;

const b2 = await chromium.launch();
const shots = [["public/og.png", og, 1200, 630], ["public/icon-512.png", icon(512, "0"), 512, 512], ["public/icon-192.png", icon(192, "0"), 192, 192], ["app/apple-icon.png", icon(180, "0"), 180, 180]];
for (const [file, html, w, h] of shots) {
  const p = await b2.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.resolve(file) });
  console.log("Đã tạo", file);
}
await b2.close();
