// Định dạng ngày giờ, tiền cho các màn phục vụ khách. Luôn theo giờ Việt Nam để server và trình duyệt ra cùng chữ
// (không lệch khi hydrate).
const TZ = "Asia/Ho_Chi_Minh";

const fmt = (opts) => new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, ...opts });
const fGio = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const fNgay = fmt({ day: "2-digit", month: "2-digit", year: "numeric" });
const fNgayNgan = fmt({ day: "2-digit", month: "2-digit" });

const hopLe = (v) => v && !Number.isNaN(new Date(v).getTime());

/** "10:42" */
export const gio = (v) => (hopLe(v) ? fGio.format(new Date(v)) : "");
/** "08/10/2026" */
export const ngay = (v) => (hopLe(v) ? fNgay.format(new Date(v)) : "");
/** "08/10" */
export const ngayNgan = (v) => (hopLe(v) ? fNgayNgan.format(new Date(v)) : "");
/** "10:58 08/10/2026" */
export const gioNgay = (v) => (hopLe(v) ? `${gio(v)} ${ngay(v)}` : "");

/** 1250000 → "1.250.000đ"; số âm → "−50.000đ". */
export function tien(n) {
  const v = Math.round(Number(n) || 0);
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  return v < 0 ? `−${s}` : s;
}

/** 48200 → "48.200" */
export const so = (n) => (n == null ? "" : Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));

/** Chữ viết tắt tên thợ: "Trần Minh Đức" → "MĐ". */
export const vietTat = (ten = "") => ten.trim().split(/\s+/).slice(-2).map((x) => x[0] || "").join("").toUpperCase();

/** Dòng phụ dưới tiêu đề đơn: "Ắc quy · Toyota Vios · 30A-123.45". */
export const dongPhu = (...phan) => phan.flat().filter(Boolean).join(" · ");

/** "tel:19001068" từ "1900 1068" (bản cho client component: lib/giao-dien kéo theo code server). */
export const telHref = (hotline) => (hotline ? `tel:${String(hotline).replace(/[^\d+]/g, "")}` : undefined);
