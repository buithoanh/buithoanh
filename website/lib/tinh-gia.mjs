// Tính giá công khai: hiển thị một hạng mục theo phân khúc xe, và báo giá sơ bộ cho một hoặc nhiều dịch vụ.
// Mọi số tiền là số nguyên đồng (VND). Không dùng số thực.

export const PHAN_KHUC = ["A", "B", "C", "D"];

/**
 * Giá một hạng mục cho một phân khúc.
 * - Tiền công: giá cố định (0 = miễn phí), không phụ thuộc phân khúc.
 * - Phụ tùng: khoảng từ–đến theo phân khúc. Chưa biết phân khúc thì lấy từ thấp nhất (A) đến cao nhất (D).
 * @returns {{ tu: number, den: number }}
 */
export function giaHangMuc(hm, phanKhuc) {
  if (hm.loai === "cong") {
    const g = soNguyen(hm.gia);
    return { tu: g, den: g };
  }
  const bang = hm.giaPhanKhuc || {};
  if (phanKhuc && PHAN_KHUC.includes(phanKhuc)) {
    const p = bang[phanKhuc] || {};
    return { tu: soNguyen(p.tu), den: soNguyen(p.den) };
  }
  const tu = Math.min(...PHAN_KHUC.map((k) => soNguyen(bang[k]?.tu)));
  const den = Math.max(...PHAN_KHUC.map((k) => soNguyen(bang[k]?.den)));
  return { tu, den };
}

function soNguyen(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/**
 * Báo giá sơ bộ.
 * Mỗi hạng mục có cách tính trong báo giá sơ bộ (`baoGiaSoBo`):
 *   "luonCo": luôn cộng vào cả cận dưới và cận trên
 *   "coThe":  có thể phát sinh: chỉ cộng vào cận trên (cận dưới coi như không làm)
 *   "khong" (hoặc trống): không tính
 * Dịch vụ tắt báo giá sơ bộ (việc phức tạp) thì cả báo giá chuyển sang "cố vấn gọi lại".
 *
 * @param {object} p
 * @param {{ slug: string, ten: string, baoGiaSoBo: boolean, hangMuc: object[] }[]} p.dichVu
 * @param {string|null} p.phanKhuc   A–D, hoặc null nếu chưa biết xe
 * @param {number} p.phiDiLai        phí đi lại trong vùng, cộng một lần cho cả đơn
 */
export function baoGiaSoBo({ dichVu, phanKhuc = null, phiDiLai = 0 }) {
  if (!dichVu.length) return { trangThai: "chuaChon", dong: [], tu: 0, den: 0 };
  const phucTap = dichVu.filter((d) => !d.baoGiaSoBo);
  const dong = [];
  for (const d of dichVu) {
    if (!d.baoGiaSoBo) continue;
    for (const hm of d.hangMuc) {
      if (!hm.baoGiaSoBo || hm.baoGiaSoBo === "khong") continue;
      const g = giaHangMuc(hm, phanKhuc);
      const coThe = hm.baoGiaSoBo === "coThe";
      dong.push({
        dichVu: d.slug, ten: hm.ten, loai: hm.loai, coThe,
        tu: coThe ? 0 : g.tu, den: g.den, ...(hm.donVi ? { donVi: hm.donVi } : {}),
      });
    }
  }
  const phi = soNguyen(phiDiLai);
  dong.push({ dichVu: null, ten: "Phí đi lại", loai: "phi", coThe: false, tu: phi, den: phi });
  const tu = dong.reduce((a, x) => a + x.tu, 0);
  const den = dong.reduce((a, x) => a + x.den, 0);
  if (phucTap.length) {
    return { trangThai: "coVanGoiLai", dichVuPhucTap: phucTap.map((d) => d.slug), dong, tu, den };
  }
  return { trangThai: "coGia", dong, tu, den };
}

/** 1250000 → "1.250.000đ"; 0 → "Miễn phí" khi mienPhi=true. */
export function dinhDangTien(n, { mienPhi = false } = {}) {
  const v = soNguyen(n);
  if (v === 0 && mienPhi) return "Miễn phí";
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
}

export function dinhDangKhoang(tu, den) {
  return tu === den ? dinhDangTien(tu) : `${dinhDangTien(tu).slice(0, -1)} – ${dinhDangTien(den)}`;
}
