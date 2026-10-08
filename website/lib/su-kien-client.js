"use client";
// Ghi sự kiện số liệu (xem trang, bấm gọi, bấm Zalo, gửi form) và giữ nguồn khách (utm, ?ma=) suốt phiên.
// Chạy trên trình duyệt. Gửi gộp tới POST /api/su-kien/ghi (tối đa 20 sự kiện/lần) bằng sendBeacon.
// Không ghi dữ liệu cá nhân: server tự bỏ query và che link riêng /don/<token>/.

const KHOA_NGUON = "thotoi-nguon";
const KHOA_PHIEN = "thotoi-phien";
const KHOA_MA = "thotoi-ma";

const doc = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const ghi = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* chế độ riêng tư: bỏ qua */ } };

export function layPhien() {
  let p = doc(KHOA_PHIEN);
  if (!p) {
    p = "p-" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    ghi(KHOA_PHIEN, p);
  }
  return p;
}

/** Nguồn khách của phiên: { utm_source, utm_medium, utm_campaign, ma, qr, trangVao, referrer }. */
export function layNguon() {
  try { return JSON.parse(doc(KHOA_NGUON) || "{}"); } catch { return {}; }
}

/** Mã giới thiệu / khuyến mãi khách mở từ link ?ma= (điền sẵn vào form đặt lịch). */
export const layMaTuLink = () => doc(KHOA_MA) || "";

/** Gọi một lần khi vào trang: lưu utm, ?ma=, trang vào đầu tiên. Trả về mã mới thấy trong link (nếu có). */
export function ghiNhanNguon() {
  const q = new URLSearchParams(location.search);
  const cu = layNguon();
  const moi = { ...cu };
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "qr"]) if (q.get(k)) moi[k] = q.get(k).slice(0, 60);
  const ma = (q.get("ma") || "").trim().toUpperCase().slice(0, 40);
  if (ma) { moi.ma = ma; ghi(KHOA_MA, ma); }
  if (!moi.trangVao) moi.trangVao = location.pathname;
  if (!moi.referrer && document.referrer && !document.referrer.startsWith(location.origin)) moi.referrer = document.referrer.split(/[?#]/)[0];
  ghi(KHOA_NGUON, JSON.stringify(moi));
  return ma && ma !== cu.ma ? ma : "";
}

let hang = [];
let hen = null;

function xa() {
  hen = null;
  if (!hang.length) return;
  const body = JSON.stringify({ suKien: hang.splice(0, 20) });
  const ok = navigator.sendBeacon?.("/api/su-kien/ghi", new Blob([body], { type: "application/json" }));
  if (!ok) fetch("/api/su-kien/ghi", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  if (hang.length) xa();
}

/** loai: "xemTrang" | "bamGoi" | "bamZalo" | "guiForm" */
export function ghiSuKien(loai) {
  if (typeof window === "undefined") return;
  hang.push({ loai, duongDan: location.pathname, nguon: layNguon(), phien: layPhien() });
  if (loai !== "xemTrang") return xa(); // bấm gọi / Zalo thường rời trang ngay: gửi luôn
  if (!hen) hen = setTimeout(xa, 1500);
}

if (typeof window !== "undefined") {
  addEventListener("pagehide", xa);
}
