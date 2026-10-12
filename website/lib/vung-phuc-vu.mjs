// Vùng phục vụ: so tên quận/phường (bỏ dấu, bỏ tiền tố "Quận", "Phường"…) và kiểm tra điểm nằm trong ranh giới.

export function chuanTen(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(quan|huyen|thi xa|thanh pho|phuong|xa|thi tran)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Ray casting. vong = [[lng, lat], ...] (thứ tự GeoJSON). */
export function diemTrongVong(lng, lat, vong) {
  let trong = false;
  for (let i = 0, j = vong.length - 1; i < vong.length; j = i++) {
    const [xi, yi] = vong[i];
    const [xj, yj] = vong[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) trong = !trong;
  }
  return trong;
}

/** Hỗ trợ GeoJSON Polygon và MultiPolygon (bỏ qua lỗ). */
export function diemTrongRanhGioi(lng, lat, geo) {
  if (!geo || !geo.type) return false;
  const polys = geo.type === "Polygon" ? [geo.coordinates] : geo.type === "MultiPolygon" ? geo.coordinates : [];
  return polys.some((p) => Array.isArray(p?.[0]) && diemTrongVong(lng, lat, p[0]));
}

/**
 * Kết luận một vị trí có trong vùng không.
 * @param {object} p
 * @param {{ ten: string, slug: string, dangPhucVu: boolean, etaTu: number, etaDen: number, ranhGioi?: object }[]} p.quan
 * @param {{ ten: string, quan: string, dangPhucVu: boolean, ghiChu?: string }[]} p.phuong   quan = slug quận
 * @param {{ quan?: string, phuong?: string }} p.diaGioi   tên quận/phường bản đồ trả về (có thể thiếu)
 * @param {{ lat: number, lng: number }} [p.toaDo]
 */
export function ketLuanVung({ quan, phuong, diaGioi = {}, toaDo }) {
  let q = diaGioi.quan ? quan.find((x) => chuanTen(x.ten) === chuanTen(diaGioi.quan)) : undefined;
  if (!q && toaDo) q = quan.find((x) => x.ranhGioi && diemTrongRanhGioi(toaDo.lng, toaDo.lat, x.ranhGioi));
  if (!q) {
    return { trongVung: false, lyDo: "ngoaiQuan", quan: null, phuong: null, eta: null };
  }
  const ph = diaGioi.phuong
    ? phuong.find((x) => x.quan === q.slug && chuanTen(x.ten) === chuanTen(diaGioi.phuong))
    : undefined;
  const eta = { tu: q.etaTu, den: q.etaDen };
  const kq = { quan: { ten: q.ten, slug: q.slug }, phuong: ph ? { ten: ph.ten } : diaGioi.phuong ? { ten: diaGioi.phuong } : null };
  if (!q.dangPhucVu) return { trongVung: false, lyDo: "quanChuaPhucVu", ...kq, eta: null };
  if (ph && !ph.dangPhucVu) return { trongVung: false, lyDo: "phuongTamTat", ghiChu: ph.ghiChu || "", ...kq, eta: null };
  return { trongVung: true, lyDo: null, ...kq, eta };
}
