// Kiểm tra và chuẩn hoá dữ liệu khách gửi từ form đặt lịch (DatLich) và gọi gấp (GoiGap).
// Chỉ kiểm tra hình thức. Việc cần database (dịch vụ có nhận đặt không, khung còn chỗ không, có trong vùng không)
// làm ở lib/don/tao-don.ts.
import { chuanHoaBienSo } from "../bien-so.mjs";
import { chuanHoaSdt } from "../so-dien-thoai.mjs";

export const CHO_DO = [
  { value: "nha", label: "Nhà riêng" },
  { value: "ham", label: "Hầm chung cư" },
  { value: "bai", label: "Bãi công ty" },
  { value: "duong", label: "Đường phố" },
];

const chuoi = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
const so = (v) => (v === "" || v == null ? null : Number(v));
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const MST = /^\d{10}(-\d{3})?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {"datLich"|"khanCap"} loai
 * @param {Record<string, any>} d  dữ liệu thô
 * @returns {{ ok: true, duLieu: object } | { ok: false, loi: Record<string, string> }}
 */
export function kiemTraDauVao(loai, d = {}) {
  const loi = {};
  const xe = d.xe || {};
  const viTri = d.viTri || {};
  const khach = d.khach || {};
  const out = { loai };

  // Đồng ý xử lý dữ liệu: bắt buộc, kiểm trước tiên (chưa đồng ý thì không lưu gì).
  if (d.dongY !== true && d.dongY !== "true" && d.dongY !== "1" && d.dongY !== "on") {
    loi.dongY = "Bạn cần tích ô đồng ý xử lý dữ liệu để gửi đơn.";
  }

  const sdt = chuanHoaSdt(khach.sdt);
  if (!sdt) loi["khach.sdt"] = "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).";
  out.khach = { sdt, hoTen: chuoi(khach.hoTen, 80) };

  const lat = so(viTri.lat);
  const lng = so(viTri.lng);
  const coToaDo = lat != null || lng != null;
  if (coToaDo && !(Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) {
    loi["viTri.toaDo"] = "Toạ độ vị trí không hợp lệ.";
  }
  const diaChi = chuoi(viTri.diaChi, 300);
  if (!coToaDo && diaChi.length < 6) loi["viTri.diaChi"] = "Cho biết vị trí xe: bấm lấy vị trí hoặc gõ địa chỉ.";
  out.viTri = { lat: coToaDo ? lat : null, lng: coToaDo ? lng : null, diaChi, ghiChuChoTho: chuoi(viTri.ghiChuChoTho, 500) };

  if (loai === "datLich") {
    const dv = Array.isArray(d.dichVu) ? d.dichVu.map((x) => chuoi(x, 60)).filter(Boolean) : [];
    if (!dv.length) loi.dichVu = "Chọn ít nhất một việc cần làm.";
    if (dv.length > 6) loi.dichVu = "Chọn tối đa 6 việc.";
    out.dichVu = [...new Set(dv)];
    out.trieuChung = chuoi(d.trieuChung, 2000);

    const choDo = chuoi(viTri.choDo, 10);
    if (!CHO_DO.some((c) => c.value === choDo)) loi["viTri.choDo"] = "Chọn nơi xe đang đỗ.";
    out.viTri.choDo = choDo;

    const kg = d.khungGio || {};
    if (!NGAY.test(chuoi(kg.ngay, 10)) || !chuoi(kg.ma, 20)) loi.khungGio = "Chọn ngày và khung giờ.";
    out.khungGio = { ngay: chuoi(kg.ngay, 10), ma: chuoi(kg.ma, 20) };

    if (!out.khach.hoTen) loi["khach.hoTen"] = "Cho biết họ tên để thợ xưng hô.";

    const hd = d.hoaDon || {};
    if (hd.mst || hd.tenCongTy) {
      const mst = chuoi(hd.mst, 14).replace(/\s/g, "");
      if (!MST.test(mst)) loi["hoaDon.mst"] = "Mã số thuế gồm 10 số (hoặc 10 số, gạch ngang, 3 số).";
      const email = chuoi(hd.email, 120);
      if (email && !EMAIL.test(email)) loi["hoaDon.email"] = "Email nhận hoá đơn chưa đúng.";
      out.hoaDon = { can: true, mst, tenCongTy: chuoi(hd.tenCongTy, 200), diaChi: chuoi(hd.diaChi, 300), email };
    }
    out.nhacBaoDuong = d.nhacBaoDuong === true || d.nhacBaoDuong === "true" || d.nhacBaoDuong === "1";
  } else {
    const suCo = chuoi(d.suCo, 20);
    if (!suCo) loi.suCo = "Chọn xe đang bị gì.";
    out.suCo = suCo;
    out.trieuChung = chuoi(d.moTaSuCo ?? d.trieuChung, 1000);
  }

  // Xe: không bắt buộc với gọi gấp; đặt lịch cần hãng + dòng (hoặc tên xe gõ tay).
  const bienSoTho = chuoi(xe.bienSo, 20);
  const bienSo = bienSoTho ? chuanHoaBienSo(bienSoTho) : null;
  if (bienSoTho && !bienSo) loi["xe.bienSo"] = "Biển số chưa đúng, ví dụ 30A-123.45 (gõ liền 30a12345 cũng được).";
  const doi = so(xe.doi);
  if (doi != null && !(Number.isInteger(doi) && doi >= 1980 && doi <= new Date().getFullYear() + 1)) loi["xe.doi"] = "Đời xe chưa đúng.";
  const soKm = so(xe.soKm);
  if (soKm != null && !(Number.isInteger(soKm) && soKm >= 0 && soKm < 3000000)) loi["xe.soKm"] = "Số km chưa đúng.";
  out.xe = { hang: chuoi(xe.hang, 80), dong: chuoi(xe.dong, 120), tenXe: chuoi(xe.tenXe, 120), doi, bienSo, soKm };
  if (loai === "datLich" && !out.xe.dong && !out.xe.tenXe) loi["xe.dong"] = "Chọn hãng và dòng xe.";

  out.maGioiThieu = chuoi(d.maGioiThieu, 40).toUpperCase();
  out.maKhuyenMai = chuoi(d.maKhuyenMai, 40).toUpperCase();
  const n = d.nguon || {};
  out.nguon = {
    utmSource: chuoi(n.utm_source ?? n.utmSource, 100), utmMedium: chuoi(n.utm_medium ?? n.utmMedium, 100),
    utmCampaign: chuoi(n.utm_campaign ?? n.utmCampaign, 100), maQR: chuoi(n.qr ?? n.maQR, 60).toUpperCase(),
    trangVao: chuoi(n.trangVao, 300), referrer: chuoi(n.referrer, 300),
  };
  if (!out.maGioiThieu && n.ma) out.maGioiThieu = chuoi(n.ma, 40).toUpperCase();

  return Object.keys(loi).length ? { ok: false, loi } : { ok: true, duLieu: out };
}

/** Ô bẫy bot: người thật không thấy nên luôn để trống. */
export const laBot = (d) => typeof d?.website === "string" && d.website.trim() !== "";
