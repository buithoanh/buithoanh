// Chuẩn hoá biển số ô tô Việt Nam. Khách gõ liền ("30a12345"), có dấu, có cách đều nhận.
//   30A12345  → 30A-123.45      30A1234 → 30A-1234
//   30LD12345 → 30LD-123.45     51F-123.45 → 51F-123.45
// Trả về null nếu không phải biển số hợp lệ.

const BO_DAU = /[\s.\-_/]/g;

export function chuanHoaBienSo(dauVao) {
  const s = String(dauVao ?? "").toUpperCase().replace(/Đ/g, "D").replace(BO_DAU, "");
  // 2 số mã tỉnh + 1–2 chữ cái seri (chữ thứ hai có thể là số, vd 30A1) + 4–5 số đăng ký
  const m = s.match(/^(\d{2})([A-Z]{1,2}|[A-Z]\d)(\d{4,5})$/);
  if (!m) return null;
  const [, tinh, seri, so] = m;
  const maTinh = Number(tinh);
  if (maTinh < 11 || maTinh > 99) return null;
  const phanSo = so.length === 5 ? `${so.slice(0, 3)}.${so.slice(3)}` : so;
  return `${tinh}${seri}-${phanSo}`;
}

/** Khoá so sánh: bỏ dấu ngăn cách, dùng để tìm xe theo biển số. */
export const khoaBienSo = (bienSo) => String(bienSo ?? "").toUpperCase().replace(BO_DAU, "");
