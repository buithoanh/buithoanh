// Luồng trạng thái đơn hàng, theo thứ tự trên màn Theo dõi (TheoDoi).

export const TRANG_THAI = [
  { value: "daNhan", label: "Đã nhận" },
  { value: "daXepTho", label: "Đã xếp thợ" },
  { value: "thoDangDen", label: "Thợ đang đến" },
  { value: "choDuyetBaoGia", label: "Chờ duyệt báo giá" },
  { value: "dangSua", label: "Đang sửa" },
  { value: "choThanhToan", label: "Chờ thanh toán" },
  { value: "hoanThanh", label: "Hoàn thành" },
];
export const HUY = { value: "huy", label: "Huỷ" };
export const MOI_TRANG_THAI = [...TRANG_THAI, HUY];
export const KET_THUC = new Set(["hoanThanh", "huy"]);

const viTri = (v) => TRANG_THAI.findIndex((t) => t.value === v);
export const nhanTrangThai = (v) => MOI_TRANG_THAI.find((t) => t.value === v)?.label || v;

/**
 * Được chuyển từ `tu` sang `den` không.
 * - Chỉ đi tới (được bỏ qua bước, vd khách không cần báo giá), không quay lại.
 * - Huỷ được từ mọi trạng thái chưa kết thúc.
 * - Đơn đã hoàn thành hoặc huỷ thì đứng yên. Quản trị sửa tay được (choPhepLui).
 */
export function chuyenDuoc(tu, den, { choPhepLui = false } = {}) {
  if (tu === den) return { ok: true };
  if (!MOI_TRANG_THAI.some((t) => t.value === den)) return { ok: false, loi: `Trạng thái "${den}" không có.` };
  if (choPhepLui) return { ok: true };
  if (KET_THUC.has(tu)) return { ok: false, loi: `Đơn đã ${nhanTrangThai(tu).toLowerCase()}, không đổi trạng thái được.` };
  if (den === "huy") return { ok: true };
  if (viTri(den) < viTri(tu)) {
    return { ok: false, loi: `Không quay lại "${nhanTrangThai(den)}" từ "${nhanTrangThai(tu)}".` };
  }
  return { ok: true };
}

/** Các bước cho màn Theo dõi: done / now / todo, kèm thời điểm từng bước đã qua. */
export function cacBuoc(trangThai, lichSu = []) {
  const luc = new Map();
  for (const l of lichSu) if (!luc.has(l.trangThai)) luc.set(l.trangThai, l.luc);
  const hienTai = viTri(trangThai);
  return TRANG_THAI.map((t, i) => ({
    trangThai: t.value,
    nhan: t.label,
    luc: luc.get(t.value) || null,
    tinhTrang: trangThai === "huy" ? (luc.has(t.value) ? "done" : "todo") : i < hienTai || trangThai === "hoanThanh" ? "done" : i === hienTai ? "now" : "todo",
  }));
}
