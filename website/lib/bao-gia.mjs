// Báo giá chính thức: khách bỏ bớt hạng mục tuỳ chọn rồi đồng ý; tính tổng tiền công, phụ tùng, phí đi lại, giảm giá.
import { conLuot } from "./quyen-loi.mjs";

export const MUC_DO = [
  { value: "canLamNgay", label: "Cần làm ngay" },
  { value: "nenLam", label: "Nên làm" },
  { value: "coTheDeSau", label: "Có thể để sau" },
];

/**
 * @param {{ ma: string, loai: "cong"|"phuTung", gia: number, batBuoc?: boolean }[]} hangMuc
 * @param {string[]} boHangMuc  mã các hạng mục khách bỏ
 * @returns {{ ok: true, chon, tienCong, phuTung } | { ok: false, loi: string }}
 */
export function chonHangMuc(hangMuc, boHangMuc = []) {
  const bo = new Set(boHangMuc.map(String));
  for (const ma of bo) {
    const h = hangMuc.find((x) => x.ma === ma);
    if (!h) return { ok: false, loi: `Không có hạng mục "${ma}" trong báo giá.` };
    if (h.batBuoc) return { ok: false, loi: `"${h.ten}" là hạng mục bắt buộc, không bỏ được.` };
  }
  const chon = hangMuc.filter((h) => !bo.has(h.ma));
  const tong = (loai) => chon.filter((h) => h.loai === loai).reduce((a, h) => a + Math.round(h.gia || 0), 0);
  return { ok: true, chon, tienCong: tong("cong"), phuTung: tong("phuTung") };
}

/**
 * Số tiền phải thanh toán cho đơn: tổng các báo giá khách đã duyệt (phát sinh là báo giá bổ sung) + phí đi lại một lần
 * − quyền lợi − giảm giá. Khách từ chối báo giá đầu tiên: chỉ thu phí kiểm tra.
 *
 * Quyền lợi (P2), theo thứ tự:
 * 1. Hội viên: hạng mục tiền công gắn quyền lợi kichNo/vaLop được miễn khi gói còn lượt.
 * 2. Phí đi lại được miễn bởi: gói hội viên còn lượt → bạn mới được giới thiệu (đơn đầu) → lượt thưởng giới thiệu còn lại.
 *    Chỉ dùng một nguồn; nguồn trước đã miễn thì không trừ lượt của nguồn sau.
 * 3. Giảm % tiền công của gói và mã khuyến mãi **không cộng dồn**: lấy mức có lợi hơn cho khách.
 *
 * @param {{
 *   baoGiaDaDuyet?: { chon: { ten: string, loai: string, gia: number, quyenLoi?: "kichNo"|"vaLop"|null }[] }[],
 *   phiDiLai?: number, phiKiemTra?: number, tuChoi?: boolean,
 *   giam?: number,
 *   tinhGiamMa?: (tienCong: number, tongTien: number) => number,
 *   tenMa?: string,
 *   hoiVien?: { ten: string, mienDiLaiSoLan?: number|null, mienKichNoSoLan?: number|null, mienVaLopSoLan?: number|null, giamCongPhanTram?: number, daDung?: { diLai?: number, kichNo?: number, vaLop?: number } } | null,
 *   gioiThieu?: { banMoi?: boolean, luotConLai?: number } | null,
 * }} p
 */
export function tinhThanhToan({ baoGiaDaDuyet = [], phiDiLai = 0, phiKiemTra = 0, tuChoi = false, giam = 0, tinhGiamMa, tenMa = "", hoiVien = null, gioiThieu = null }) {
  const suDung = { mienDiLai: null, kichNo: 0, vaLop: 0, giamHoiVien: 0, giamMa: 0 };
  if (tuChoi && !baoGiaDaDuyet.length) {
    return { dong: [{ ten: "Phí kiểm tra (không sửa)", soTien: phiKiemTra }], tienCong: 0, phuTung: 0, phiDiLai: 0, giam: 0, tong: phiKiemTra, suDung };
  }
  const dong = baoGiaDaDuyet.flatMap((b) => b.chon.map((h) => ({ ten: h.ten, soTien: Math.round(h.gia || 0), loai: h.loai, ...(h.quyenLoi ? { quyenLoi: h.quyenLoi } : {}) })));
  const tienCong = dong.filter((d) => d.loai === "cong").reduce((a, d) => a + d.soTien, 0);
  const phuTung = dong.filter((d) => d.loai === "phuTung").reduce((a, d) => a + d.soTien, 0);
  const truocGiam = tienCong + phuTung + phiDiLai;

  // 1. Hạng mục miễn phí cho hội viên
  const tru = [];
  let congDuocMien = 0;
  if (hoiVien) {
    const daDung = hoiVien.daDung || {};
    for (const d of dong) {
      if (d.loai !== "cong" || !d.soTien || (d.quyenLoi !== "kichNo" && d.quyenLoi !== "vaLop")) continue;
      const soLan = d.quyenLoi === "kichNo" ? hoiVien.mienKichNoSoLan : hoiVien.mienVaLopSoLan;
      if (conLuot(soLan, (daDung[d.quyenLoi] || 0) + suDung[d.quyenLoi]) <= 0) continue;
      suDung[d.quyenLoi]++;
      congDuocMien += d.soTien;
      tru.push({ ten: `${d.ten}: miễn phí (hội viên ${hoiVien.ten})`, soTien: -d.soTien, loai: "quyenLoi" });
    }
  }
  // 2. Phí đi lại
  if (phiDiLai > 0) {
    if (hoiVien && conLuot(hoiVien.mienDiLaiSoLan, hoiVien.daDung?.diLai || 0) > 0) suDung.mienDiLai = "hoiVien";
    else if (gioiThieu?.banMoi) suDung.mienDiLai = "banMoi";
    else if ((gioiThieu?.luotConLai || 0) > 0) suDung.mienDiLai = "luotGioiThieu";
    if (suDung.mienDiLai) {
      const vi = { hoiVien: `hội viên ${hoiVien?.ten || ""}`.trim(), banMoi: "đơn đầu, bạn bè giới thiệu", luotGioiThieu: "lượt thưởng giới thiệu bạn bè" }[suDung.mienDiLai];
      tru.push({ ten: `Miễn phí đi lại (${vi})`, soTien: -phiDiLai, loai: "quyenLoi" });
    }
  }
  const sauQuyenLoi = truocGiam + tru.reduce((a, d) => a + d.soTien, 0);
  const congConLai = tienCong - congDuocMien;

  // 3. Giảm tiền công hội viên / mã khuyến mãi: lấy mức lớn hơn
  let giamHV = hoiVien?.giamCongPhanTram ? Math.floor((congConLai * hoiVien.giamCongPhanTram) / 100) : 0;
  let giamMa = Math.max(0, Math.round(tinhGiamMa ? tinhGiamMa(congConLai, sauQuyenLoi) : giam));
  if (giamHV && giamMa) {
    if (giamHV >= giamMa) giamMa = 0;
    else giamHV = 0;
  }
  giamHV = Math.min(giamHV, sauQuyenLoi);
  giamMa = Math.min(giamMa, sauQuyenLoi - giamHV);
  suDung.giamHoiVien = giamHV;
  suDung.giamMa = giamMa;

  if (phiDiLai) dong.push({ ten: "Phí đi lại", soTien: phiDiLai, loai: "phi" });
  dong.push(...tru);
  if (giamHV) dong.push({ ten: `Giảm ${hoiVien.giamCongPhanTram}% tiền công (hội viên ${hoiVien.ten})`, soTien: -giamHV, loai: "quyenLoi" });
  if (giamMa) dong.push({ ten: tenMa ? `Giảm giá (mã ${tenMa})` : "Giảm giá", soTien: -giamMa, loai: "giam" });
  const tongGiam = truocGiam - sauQuyenLoi + giamHV + giamMa;
  return { dong, tienCong, phuTung, phiDiLai, giam: tongGiam, tong: truocGiam - tongGiam, suDung };
}
