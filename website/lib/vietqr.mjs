// Mã VietQR (chuẩn EMVCo / NAPAS 247): ngân hàng nào quét cũng điền sẵn số tài khoản, số tiền, nội dung.

const truong = (id, giaTri) => `${id}${String(giaTri.length).padStart(2, "0")}${giaTri}`;

/** CRC16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF), 4 ký tự hex in hoa. */
export function crc16(s) {
  let crc = 0xffff;
  for (const b of Buffer.from(s, "utf8")) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * @param {{ maBin: string, soTaiKhoan: string, soTien: number, noiDung: string }} p
 *   maBin: mã BIN 6 số của ngân hàng (vd Vietcombank 970436); noiDung: chỉ chữ không dấu, số (vd TT000123)
 */
export function taoChuoiVietQR({ maBin, soTaiKhoan, soTien, noiDung }) {
  if (!/^\d{6}$/.test(String(maBin))) throw new Error("Mã BIN ngân hàng phải gồm 6 số.");
  const stk = String(soTaiKhoan).replace(/\s/g, "");
  if (!/^[0-9A-Za-z]{4,19}$/.test(stk)) throw new Error("Số tài khoản không hợp lệ.");
  if (!Number.isInteger(soTien) || soTien <= 0) throw new Error("Số tiền phải là số nguyên dương.");
  const nd = String(noiDung).replace(/[^0-9A-Za-z ]/g, "").slice(0, 25);
  const nguoiNhan = truong("00", String(maBin)) + truong("01", stk);
  const tk = truong("00", "A000000727") + truong("01", nguoiNhan) + truong("02", "QRIBFTTA");
  const than = truong("00", "01") + truong("01", "12") + truong("38", tk) + truong("53", "704") +
    truong("54", String(soTien)) + truong("58", "VN") + truong("62", truong("08", nd)) + "6304";
  return than + crc16(than);
}

/** "TT-000123" → "TT000123" (nội dung chuyển khoản để hệ thống tự nhận tiền). */
export const noiDungChuyenKhoan = (ma) => String(ma).replace(/[^0-9A-Za-z]/g, "").toUpperCase();

/** Tìm mã đơn trong nội dung chuyển khoản ngân hàng gửi về (khách hay gõ thêm chữ, dấu cách). */
export function timMaTrongNoiDung(noiDung) {
  const m = String(noiDung || "").toUpperCase().replace(/[\s.\-_]/g, "").match(/(TT|HV)(\d{6})/);
  return m ? `${m[1]}-${m[2]}` : null;
}
