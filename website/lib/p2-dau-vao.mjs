// Kiểm tra form P2: đăng ký hội viên (HoiVien), yêu cầu báo giá doanh nghiệp (DoanhNghiep), hồ sơ thợ cộng tác (TuyenTho).
// Chỉ kiểm tra hình thức; việc cần database (gói còn bán, quận có thật) làm ở lib/hoi-vien.ts, lib/p2.ts.
import { chuanHoaBienSo } from "./bien-so.mjs";
import { chuanHoaSdt } from "./so-dien-thoai.mjs";

export const LOAI_XE_DOANH_NGHIEP = [
  { value: "4-5-cho", label: "Xe 4–5 chỗ" },
  { value: "7-cho", label: "Xe 7 chỗ, MPV" },
  { value: "dien", label: "Xe điện VinFast" },
  { value: "ban-tai-van", label: "Bán tải, van" },
  { value: "nhieu-loai", label: "Nhiều loại" },
];
export const LOAI_DOI_XE = [
  { value: "taxi", label: "Taxi" },
  { value: "thue", label: "Cho thuê" },
  { value: "cty", label: "Xe công ty" },
];
export const NAM_KINH_NGHIEM = [
  { value: "2-3", label: "2–3 năm" },
  { value: "4-5", label: "4–5 năm" },
  { value: "6-10", label: "6–10 năm" },
  { value: "tren-10", label: "Trên 10 năm" },
];
export const DUNG_CU = [
  { value: "obd", label: "Máy đọc lỗi OBD" },
  { value: "kich", label: "Kích nâng cá sấu" },
  { value: "acquy", label: "Bộ kích nổ ắc quy" },
  { value: "sung", label: "Súng xiết bu lông" },
  { value: "bom", label: "Máy bơm lốp" },
  { value: "va", label: "Bộ vá lốp không săm" },
  { value: "cole", label: "Cờ lê lực" },
  { value: "xe", label: "Xe máy đi lại" },
];
/** Khu vực: slug quận đang phục vụ, hoặc "khac" (quận khác, chờ mở rộng / sales gọi tư vấn). */
export const KHU_VUC_KHAC = "khac";

const chuoi = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
const dongY = (v) => v === true || v === "true" || v === "1" || v === "on";
const mang = (v) => (Array.isArray(v) ? v : typeof v === "string" && v ? v.split(",") : []).map((x) => chuoi(x, 40)).filter(Boolean);
const coTrong = (ds, v) => ds.some((x) => x.value === v);
const SLUG = /^[a-z0-9-]{2,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MST = /^\d{10}(-\d{3})?$/;
export const chuanHoaMst = (v) => chuoi(v, 20).replace(/[\s.]/g, "");

const ketQua = (loi, duLieu) => (Object.keys(loi).length ? { ok: false, loi } : { ok: true, duLieu });

/** Đăng ký mua gói hội viên. */
export function kiemTraDangKyHoiVien(d = {}) {
  const loi = {};
  if (!dongY(d.dongY)) loi.dongY = "Bạn cần tích ô đồng ý xử lý dữ liệu để đăng ký gói.";
  const goi = chuoi(d.goi, 40);
  if (!SLUG.test(goi)) loi.goi = "Chọn gói.";
  const hoTen = chuoi(d.hoTen, 80);
  if (!hoTen) loi.hoTen = "Cho biết họ tên.";
  const sdt = chuanHoaSdt(d.sdt);
  if (!sdt) loi.sdt = "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).";
  const bienSo = chuanHoaBienSo(chuoi(d.bienSo, 20));
  if (!bienSo) loi.bienSo = "Biển số chưa đúng, ví dụ 30A-123.45. Mỗi gói gắn với 1 biển số.";
  return ketQua(loi, { goi, hoTen, sdt, bienSo, maGioiThieu: chuoi(d.maGioiThieu, 20).toUpperCase().replace(/\s/g, "") });
}

/** Yêu cầu báo giá hợp đồng doanh nghiệp. MST không bắt buộc (hộ kinh doanh), có thì phải đúng dạng. */
export function kiemTraYeuCauDoanhNghiep(d = {}) {
  const loi = {};
  if (!dongY(d.dongY)) loi.dongY = "Bạn cần tích ô đồng ý để gửi yêu cầu.";
  const tenCongTy = chuoi(d.tenCongTy, 200);
  if (tenCongTy.length < 3) loi.tenCongTy = "Cho biết tên công ty.";
  const mst = chuanHoaMst(d.mst);
  if (mst && !MST.test(mst)) loi.mst = "Mã số thuế gồm 10 số (hoặc 10 số, gạch ngang, 3 số).";
  const soXe = Number(d.soXe);
  if (!Number.isInteger(soXe) || soXe < 1 || soXe > 100000) loi.soXe = "Số xe chưa đúng.";
  const loaiXe = chuoi(d.loaiXe, 20);
  if (!coTrong(LOAI_XE_DOANH_NGHIEP, loaiXe)) loi.loaiXe = "Chọn loại xe chính.";
  const loaiDoiXe = chuoi(d.loaiDoiXe, 20);
  if (!coTrong(LOAI_DOI_XE, loaiDoiXe)) loi.loaiDoiXe = "Chọn loại đội xe.";
  const khuVuc = [...new Set(mang(d.khuVuc))];
  if (!khuVuc.length || khuVuc.length > 10 || khuVuc.some((k) => !SLUG.test(k))) loi.khuVuc = "Chọn khu vực bãi xe.";
  const nguoiLienHe = chuoi(d.nguoiLienHe, 80);
  if (!nguoiLienHe) loi.nguoiLienHe = "Cho biết người liên hệ.";
  const sdt = chuanHoaSdt(d.sdt);
  if (!sdt) loi.sdt = "Số điện thoại chưa đúng.";
  const email = chuoi(d.email, 120);
  if (email && !EMAIL.test(email)) loi.email = "Email chưa đúng.";
  return ketQua(loi, {
    tenCongTy, mst, diaChi: chuoi(d.diaChi, 300), soXe, loaiXe, loaiDoiXe, khuVuc, nguoiLienHe, sdt, email, ghiChu: chuoi(d.ghiChu, 2000),
  });
}

/** Hồ sơ thợ cộng tác (ảnh chứng chỉ kiểm tra riêng khi tải lên). */
export function kiemTraHoSoTho(d = {}) {
  const loi = {};
  if (!dongY(d.dongY)) loi.dongY = "Bạn cần tích ô đồng ý để gửi hồ sơ.";
  const hoTen = chuoi(d.hoTen, 80);
  if (!hoTen) loi.hoTen = "Cho biết họ tên.";
  const sdt = chuanHoaSdt(d.sdt);
  if (!sdt) loi.sdt = "Số điện thoại chưa đúng.";
  const namKinhNghiem = chuoi(d.namKinhNghiem, 10);
  if (!coTrong(NAM_KINH_NGHIEM, namKinhNghiem)) loi.namKinhNghiem = "Chọn số năm kinh nghiệm (từ 2 năm).";
  const khuVuc = [...new Set(mang(d.khuVuc))];
  if (!khuVuc.length || khuVuc.length > 10 || khuVuc.some((k) => !SLUG.test(k))) loi.khuVuc = "Chọn khu vực muốn nhận đơn.";
  const dungCu = [...new Set(mang(d.dungCu))];
  if (dungCu.some((x) => !coTrong(DUNG_CU, x))) loi.dungCu = "Dụng cụ không có trong danh sách.";
  return ketQua(loi, { hoTen, sdt, namKinhNghiem, khuVuc, dungCu, ghiChu: chuoi(d.ghiChu, 1000) });
}

export const ANH_HO_SO = { soAnh: 3, toiDaMB: 8, loai: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] };
