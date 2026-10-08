// Chụp màn hình nhanh một hoặc nhiều đường dẫn để so với thiết kế.
// node scripts/chup-man-hinh.mjs /bang-gia/ /dat-lich/ --rong=390 --ra=/tmp/anh
import { chromium } from "@playwright/test";
import fs from "node:fs";

const goc = process.env.BASE_URL || "http://localhost:3000";
const thamSo = process.argv.slice(2);
const rong = Number(thamSo.find((a) => a.startsWith("--rong="))?.slice(7) || 390);
const ra = thamSo.find((a) => a.startsWith("--ra="))?.slice(5) || "/tmp/anh-chup";
const duongDan = thamSo.filter((a) => !a.startsWith("--"));
fs.mkdirSync(ra, { recursive: true });

const trinhDuyet = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? undefined : undefined });
const trang = await trinhDuyet.newPage({ viewport: { width: rong, height: 844 } });
for (const p of duongDan) {
  const r = await trang.goto(goc + p, { waitUntil: "load" });
  await trang.waitForTimeout(800);
  const ten = `${ra}/${(p.replace(/[^\w-]+/g, "_") || "goc")}-${rong}.png`;
  await trang.screenshot({ path: ten, fullPage: true });
  const cuonNgang = await trang.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(r?.status(), p, "→", ten, cuonNgang ? "⚠ CUỘN NGANG" : "");
}
await trinhDuyet.close();
