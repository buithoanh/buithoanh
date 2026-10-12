// Hội viên và giới thiệu bạn bè (thiết kế HoiVien): thời hạn gói, bảng so sánh quyền lợi, mã giới thiệu.
// Phần áp quyền lợi vào tiền một đơn nằm trong tinhThanhToan (lib/bao-gia.mjs).

/** Số lượt còn lại. soLan: null/undefined = không giới hạn, 0 = không có quyền lợi này. */
export function conLuot(soLan, daDung = 0) {
  if (soLan == null) return Infinity;
  return Math.max(0, Number(soLan) - Number(daDung || 0));
}

/** Cộng tháng, giữ ngày giờ; ngày không có ở tháng đích thì lấy ngày cuối tháng (31/01 + 1 tháng = 28 hoặc 29/02). */
export function congThang(iso, soThang) {
  const d = new Date(iso);
  const ngay = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + soThang);
  const cuoiThang = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(ngay, cuoiThang));
  return d.toISOString();
}

/**
 * Hiệu lực gói sau khi thanh toán: 12 tháng kể từ lúc thanh toán. Biển số đang có gói còn hạn thì cộng nối tiếp
 * từ ngày hết hạn cũ (gia hạn sớm không mất ngày).
 * @param {{ thanhToanLuc: string, hetHanCu?: string | null, soThang?: number }} p
 */
export function hieuLucMoi({ thanhToanLuc, hetHanCu = null, soThang = 12 }) {
  const batDau = hetHanCu && new Date(hetHanCu).getTime() > new Date(thanhToanLuc).getTime() ? new Date(hetHanCu).toISOString() : new Date(thanhToanLuc).toISOString();
  return { batDau, hetHan: congThang(batDau, soThang) };
}

const tien = (n) => `${Math.round(n).toLocaleString("vi-VN").replace(/,/g, ".")}đ`;

function chuMien(soLan, khongGioiHan) {
  if (soLan == null) return { chu: khongGioiHan, co: true };
  if (Number(soLan) <= 0) return { chu: "Giá thường", co: false };
  return { chu: `Miễn ${soLan} lần/năm`, co: true };
}

/**
 * Bảng so sánh quyền lợi các gói (thiết kế HoiVien), dựng từ số liệu gói và bảng giá hiện hành.
 * @param {{ ten: string, mienDiLaiSoLan?: number|null, mienKichNoSoLan?: number|null, mienVaLopSoLan?: number|null, giamCongPhanTram?: number, uuTienGoiGap?: boolean }[]} goi
 * @param {{ phiDiLai: number, kichNo?: { ten: string, gia: number } | null, vaLop?: { ten: string, gia: number } | null }} gia
 */
export function bangSoSanh(goi, gia) {
  const hang = [];
  const them = (ten, layO) => hang.push({ ten, goi: goi.map((g) => layO(g)) });
  them(`Phí đi lại (${tien(gia.phiDiLai)}/lần)`, (g) => chuMien(g.mienDiLaiSoLan, "Miễn không giới hạn"));
  if (gia.kichNo) them(`${gia.kichNo.ten} (${tien(gia.kichNo.gia)})`, (g) => chuMien(g.mienKichNoSoLan, "Miễn phí"));
  if (gia.vaLop) them(`${gia.vaLop.ten} (${tien(gia.vaLop.gia)})`, (g) => chuMien(g.mienVaLopSoLan, "Miễn phí"));
  them("Giảm tiền công", (g) => (g.giamCongPhanTram > 0 ? { chu: `Giảm ${g.giamCongPhanTram}%`, co: true } : { chu: "Không", co: false }));
  them("Ưu tiên xếp thợ khi gọi gấp", (g) => (g.uuTienGoiGap ? { chu: "Có", co: true } : { chu: "Không", co: false }));
  return hang;
}

/** Giá trung bình mỗi tháng, làm tròn nghìn ("khoảng 41.000đ/tháng"). */
export const giaMoiThang = (giaNam) => Math.round(giaNam / 12 / 1000) * 1000;

const khongDau = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

/** Mã giới thiệu: tên gọi (chữ cuối của họ tên, không dấu, tối đa 6 chữ) + 4 số. "Trần Minh Tuấn", 2481 → TUAN2481. */
export function taoMaGioiThieu(hoTen, so) {
  const ten = khongDau(hoTen).trim().split(/\s+/).pop() || "";
  const chu = ten.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "BAN";
  return `${chu}${String(Math.abs(Math.trunc(so)) % 10000).padStart(4, "0")}`;
}

export const MA_GIOI_THIEU = /^[A-Z]{1,6}\d{4}$/;
