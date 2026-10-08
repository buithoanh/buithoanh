// Xếp nguồn khách vào kênh để làm số liệu: Google, Facebook, Zalo, TikTok, QR cây xăng, KOC, BQL chung cư, Giới thiệu, Trực tiếp.

export function kenhNguon({ utmSource, utmMedium, referrer, maKhuyenMai, maQR, maGioiThieu } = {}) {
  const ma = String(maQR || maKhuyenMai || "").toUpperCase();
  if (ma.startsWith("XANG-")) return "QR cây xăng";
  if (ma.startsWith("KOC-")) return "KOC";
  if (ma.startsWith("BQL-")) return "BQL chung cư";
  if (maQR) return "QR đối tác";
  if (maGioiThieu) return "Giới thiệu";
  const s = `${utmSource || ""} ${utmMedium || ""}`.toLowerCase();
  const r = String(referrer || "").toLowerCase();
  if (/google/.test(s) || /google\./.test(r)) return "Google";
  if (/facebook|fb|instagram/.test(s) || /facebook\.|fb\.|instagram\./.test(r)) return "Facebook";
  if (/zalo/.test(s) || /zalo/.test(r)) return "Zalo";
  if (/tiktok/.test(s) || /tiktok\./.test(r)) return "TikTok";
  if (s.trim()) return "Khác";
  return "Trực tiếp";
}
