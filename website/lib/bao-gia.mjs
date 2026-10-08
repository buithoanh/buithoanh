// Báo giá chính thức: khách bỏ bớt hạng mục tuỳ chọn rồi đồng ý; tính tổng tiền công, phụ tùng, phí đi lại, giảm giá.

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
 * Số tiền phải thanh toán cho đơn: tổng các báo giá khách đã duyệt (phát sinh là báo giá bổ sung) + phí đi lại một lần − giảm.
 * Khách từ chối báo giá đầu tiên: chỉ thu phí kiểm tra.
 * @param {{ baoGiaDaDuyet?: { chon: { ten: string, loai: string, gia: number }[] }[], phiDiLai?: number, phiKiemTra?: number, tuChoi?: boolean, giam?: number }} p
 */
export function tinhThanhToan({ baoGiaDaDuyet = [], phiDiLai = 0, phiKiemTra = 0, tuChoi = false, giam = 0 }) {
  if (tuChoi && !baoGiaDaDuyet.length) {
    return { dong: [{ ten: "Phí kiểm tra (không sửa)", soTien: phiKiemTra }], tienCong: 0, phuTung: 0, phiDiLai: 0, giam: 0, tong: phiKiemTra };
  }
  const dong = baoGiaDaDuyet.flatMap((b) => b.chon.map((h) => ({ ten: h.ten, soTien: Math.round(h.gia || 0), loai: h.loai })));
  const tienCong = dong.filter((d) => d.loai === "cong").reduce((a, d) => a + d.soTien, 0);
  const phuTung = dong.filter((d) => d.loai === "phuTung").reduce((a, d) => a + d.soTien, 0);
  const truocGiam = tienCong + phuTung + phiDiLai;
  const g = Math.min(Math.max(0, Math.round(giam)), truocGiam);
  if (phiDiLai) dong.push({ ten: "Phí đi lại", soTien: phiDiLai, loai: "phi" });
  if (g) dong.push({ ten: "Giảm giá", soTien: -g, loai: "giam" });
  return { dong, tienCong, phuTung, phiDiLai, giam: g, tong: truocGiam - g };
}
