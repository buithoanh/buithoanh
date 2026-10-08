// Mã khuyến mãi và mã đối tác (KOC, cây xăng, ban quản lý chung cư): trạng thái, kiểm tra khi khách nhập, tính giảm, hoa hồng.
// Tiền là số nguyên đồng.

export const LOAI_MA = {
  km: { nhan: "Khuyến mãi", tienTo: "KM-", nguon: "Khuyến mãi" },
  koc: { nhan: "KOC", tienTo: "KOC-", nguon: "KOC" },
  xang: { nhan: "Cây xăng", tienTo: "XANG-", nguon: "QR cây xăng" },
  bql: { nhan: "BQL chung cư", tienTo: "BQL-", nguon: "Ban quản lý chung cư" },
};

// Ngày bắt đầu/hết hạn tính trọn ngày theo giờ Việt Nam
const ngayVN = (v) => new Date(new Date(v).getTime() + 7 * 3600000).toISOString().slice(0, 10);
const dauNgay = (v) => (v ? Date.parse(`${ngayVN(v)}T00:00:00+07:00`) : null);
const cuoiNgay = (v) => (v ? Date.parse(`${ngayVN(v)}T23:59:59.999+07:00`) : null);

/**
 * Trạng thái hiện tại của một mã: dangChay | tamDung | chuaBatDau | hetHan | hetLuot.
 * @param {{ tamDung?: boolean | null, batDau?: string | null, hetHan?: string | null, soLuotToiDa?: number | null }} ma
 * @param {{ daDung: number, bayGio?: Date }} p
 */
export function trangThaiMa(ma, { daDung = 0, bayGio = new Date() } = {}) {
  const t = bayGio.getTime();
  if (ma.tamDung) return "tamDung";
  if (cuoiNgay(ma.hetHan) != null && t > cuoiNgay(ma.hetHan)) return "hetHan";
  if (ma.soLuotToiDa != null && ma.soLuotToiDa > 0 && daDung >= ma.soLuotToiDa) return "hetLuot";
  if (dauNgay(ma.batDau) != null && t < dauNgay(ma.batDau)) return "chuaBatDau";
  return "dangChay";
}

export const NHAN_TRANG_THAI = {
  dangChay: "Đang chạy", tamDung: "Tạm dừng", chuaBatDau: "Chưa bắt đầu", hetHan: "Hết hạn", hetLuot: "Hết lượt",
};

const LY_DO = {
  tamDung: "Mã này đang tạm dừng.",
  chuaBatDau: "Mã này chưa tới ngày dùng.",
  hetHan: "Mã này đã hết hạn.",
  hetLuot: "Mã này đã hết lượt dùng.",
};

/**
 * Kiểm tra mã khi khách nhập. sdtDaDung: số điện thoại này đã dùng mã chưa.
 * @returns {{ hopLe: true, moTa: string } | { hopLe: false, lyDo: string, ma: string }}
 */
/** @param {any} ma */
export function kiemTraMa(ma, { daDung = 0, sdtDaDung = false, bayGio = new Date() } = {}) {
  if (!ma) return { hopLe: false, ma: "KHONG_CO", lyDo: "Mã không đúng. Kiểm tra lại chữ và số." };
  const tt = trangThaiMa(ma, { daDung, bayGio });
  if (tt !== "dangChay") return { hopLe: false, ma: tt.toUpperCase(), lyDo: LY_DO[tt] };
  if (ma.moiSdtMotLan !== false && sdtDaDung) return { hopLe: false, ma: "DA_DUNG", lyDo: "Số điện thoại này đã dùng mã này rồi." };
  return { hopLe: true, moTa: moTaGiam(ma) };
}

export function moTaGiam(ma) {
  const tien = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  if (ma.kieuGiam === "phanTram") return `Giảm ${ma.giaTri}% tiền công${ma.giamToiDa ? ` (tối đa ${tien(ma.giamToiDa)})` : ""}`;
  return `Giảm ${tien(ma.giaTri)}`;
}

/**
 * Số tiền giảm cho một đơn.
 * - Theo %: chỉ trên tiền công (không tính phụ tùng), có mức tối đa.
 * - Số tiền: trừ thẳng, không vượt tổng đơn.
 */
export function tinhGiam(ma, { tienCong, tongTien }) {
  if (!ma) return 0;
  const tc = Math.max(0, Math.round(tienCong || 0));
  const tong = Math.max(0, Math.round(tongTien || 0));
  if (ma.kieuGiam === "phanTram") {
    const g = Math.floor((tc * Number(ma.giaTri || 0)) / 100);
    return Math.min(g, ma.giamToiDa ? ma.giamToiDa : g, tong);
  }
  return Math.min(Math.max(0, Math.round(ma.giaTri || 0)), tong);
}

/** Hoa hồng một mã trong tháng: trên số tiền khách đã thanh toán. Tỷ lệ có thể lẻ (vd 7,5%). */
export function tinhHoaHong(doanhThu, tyLePhanTram) {
  return Math.round((Math.max(0, doanhThu) * Number(tyLePhanTram || 0)) / 100);
}
