// Sự kiện số liệu: xem trang, bấm gọi, bấm Zalo, gửi form. KHÔNG ghi dữ liệu cá nhân:
// đường dẫn bỏ query, token trong link riêng thay bằng :token, chỉ giữ nguồn (utm, mã QR) và mã phiên ngẫu nhiên của trình duyệt.

export const LOAI_SU_KIEN = ["xemTrang", "bamGoi", "bamZalo", "guiForm"];

export function lamSachDuongDan(p) {
  let s = String(p || "/").split(/[?#]/)[0].slice(0, 200);
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/^\/don\/[^/]+/, "/don/:token").replace(/\/(\d{9,})(?=\/|$)/g, "/:so");
  return s.endsWith("/") ? s : s + "/";
}

const chuoi = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** @returns {null | { loai, duongDan, kenh?, utmSource, utmMedium, utmCampaign, maQR, phien }} */
export function lamSachSuKien(e) {
  if (!e || !LOAI_SU_KIEN.includes(e.loai)) return null;
  const n = e.nguon || {};
  const phien = chuoi(e.phien, 40);
  return {
    loai: e.loai,
    duongDan: lamSachDuongDan(e.duongDan),
    utmSource: chuoi(n.utm_source ?? n.utmSource, 60),
    utmMedium: chuoi(n.utm_medium ?? n.utmMedium, 60),
    utmCampaign: chuoi(n.utm_campaign ?? n.utmCampaign, 60),
    maQR: chuoi(n.qr ?? n.maQR ?? n.ma, 40).toUpperCase(),
    referrer: chuoi(n.referrer, 200).replace(/[?#].*$/, ""),
    phien: /^[\w-]{8,40}$/.test(phien) ? phien : "",
  };
}

/** Tỷ lệ chuyển đổi (%) = (đơn + gọi + Zalo) / lượt vào, 2 chữ số thập phân. */
export const tyLeChuyenDoi = ({ soDon, cuocGoi, zalo, luotVao }) =>
  luotVao ? Math.round(((soDon + cuocGoi + zalo) / luotVao) * 10000) / 100 : 0;

/** So với kỳ trước: % thay đổi (làm tròn), hoặc điểm phần trăm cho tỷ lệ. */
export function soSanh(nay, truoc, laTyLe = false) {
  if (laTyLe) return { thayDoi: Math.round((nay - truoc) * 10) / 10, donVi: "điểm" };
  if (!truoc) return { thayDoi: nay ? 100 : 0, donVi: "%" };
  return { thayDoi: Math.round(((nay - truoc) / truoc) * 100), donVi: "%" };
}
