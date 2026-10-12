// Phiếu bảo hành điện tử: hạn theo từng hạng mục (phụ tùng N tháng, tiền công M tháng), phần trăm còn lại, mốc bảo dưỡng.

const congThang = (iso, thang) => {
  const d = new Date(iso);
  const ngay = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + thang);
  const cuoiThang = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(ngay, cuoiThang));
  return d.toISOString();
};

/** Hạng mục bảo hành từ các hạng mục đã làm. Phí, giảm giá không có bảo hành. */
export function hangMucBaoHanh(hangMuc, { tuNgay, thangPhuTung, thangCong }) {
  return hangMuc
    .filter((h) => h.loai === "cong" || h.loai === "phuTung")
    .map((h) => {
      const thang = h.baoHanhThang ?? (h.loai === "phuTung" ? thangPhuTung : thangCong);
      return { ten: `${h.ten} (${h.loai === "phuTung" ? "phụ tùng" : "công"})`, loai: h.loai, tuNgay, denNgay: congThang(tuNgay, thang) };
    })
    .filter((h) => h.denNgay > h.tuNgay);
}

/** Còn bao nhiêu ngày, bao nhiêu phần trăm thời hạn. */
export function conLai({ tuNgay, denNgay }, bayGio = new Date()) {
  const tu = new Date(tuNgay).getTime();
  const den = new Date(denNgay).getTime();
  const t = bayGio.getTime();
  if (t >= den) return { conNgay: 0, phanTram: 0, hetHan: true };
  const conNgay = Math.ceil((den - t) / 86400000);
  return { conNgay, phanTram: Math.round(((den - t) / (den - tu)) * 100), hetHan: false };
}

/**
 * Mốc bảo dưỡng tiếp theo: mốc km chẵn kế tiếp (theo chu kỳ) hoặc sau N tháng từ lần bảo dưỡng gần nhất, cái nào tới trước.
 * @param {{ kmGanNhat: number|null, lanBaoDuongCuoi?: { ngay: string, km?: number|null } | null, chuKyKm: number, chuKyThang: number, bayGio?: Date }} p
 */
export function mocBaoDuong({ kmGanNhat, lanBaoDuongCuoi, chuKyKm, chuKyThang }) {
  const km = kmGanNhat ?? lanBaoDuongCuoi?.km ?? null;
  const mocKm = km != null ? (Math.floor(km / chuKyKm) + 1) * chuKyKm : null;
  return {
    mocKm,
    conKm: mocKm != null && km != null ? mocKm - km : null,
    ngayDuKien: lanBaoDuongCuoi?.ngay ? congThang(lanBaoDuongCuoi.ngay, chuKyThang) : null,
  };
}
