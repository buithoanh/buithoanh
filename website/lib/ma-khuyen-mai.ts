// Mã khuyến mãi, mã đối tác: tra trong database, kiểm tra khi khách nhập, thống kê, hoa hồng theo tháng.
import type { Payload } from "payload";
import site from "../site.config.mjs";
import type { MaKhuyenMai } from "../payload-types";
import { kiemTraMa, LOAI_MA, moTaGiam, NHAN_TRANG_THAI, tinhHoaHong, trangThaiMa } from "./khuyen-mai.mjs";
import { congNgay, gioVN } from "./lich-dat.mjs";
import { dinhDangTien } from "./tinh-gia.mjs";
import type { Bang } from "./xuat-file";

export const chuanMa = (ma: unknown) => String(ma || "").toUpperCase().replace(/\s+/g, "").slice(0, 40);
export const linkDatLichCoMa = (ma: string) => `${site.url}/dat-lich/?ma=${encodeURIComponent(ma)}`;

export async function timMa(payload: Payload, ma: string) {
  const m = chuanMa(ma);
  if (!m) return null;
  return (await payload.find({ collection: "ma-khuyen-mai", where: { ma: { equals: m } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] || null;
}

/** Số lượt đã dùng = số đơn (chưa huỷ) gắn mã này. */
export async function soLuotDaDung(payload: Payload, id: number, sdt?: string) {
  const and: Record<string, unknown>[] = [{ khuyenMai: { equals: id } }, { trangThai: { not_equals: "huy" } }];
  if (sdt) and.push({ "khach.sdt": { equals: sdt } });
  return (await payload.count({ collection: "don-hang", where: { and } as never, overrideAccess: true })).totalDocs;
}

/** Khách nhập mã (form đặt lịch): báo rõ hợp lệ hay lý do không dùng được. */
export async function kiemTraMaChoKhach(payload: Payload, ma: string, sdt?: string | null) {
  const doc = await timMa(payload, ma);
  if (!doc) return { hopLe: false as const, ma: "KHONG_CO", lyDo: "Mã không đúng. Kiểm tra lại chữ và số." };
  const daDung = await soLuotDaDung(payload, doc.id);
  const sdtDaDung = sdt ? (await soLuotDaDung(payload, doc.id, sdt)) > 0 : false;
  const kq = kiemTraMa(doc, { daDung, sdtDaDung });
  return kq.hopLe
    ? { hopLe: true as const, id: doc.id, ma: doc.ma, moTa: String(kq.moTa), loai: doc.loai, doiTac: doc.doiTac || null }
    : { hopLe: false as const, ma: String(kq.ma), lyDo: String(kq.lyDo) };
}

/** Thông tin hiển thị cho màn QtMaKhuyenMai. */
export async function moTaMa(payload: Payload, doc: MaKhuyenMai) {
  const daDung = await soLuotDaDung(payload, doc.id);
  const tt = trangThaiMa(doc, { daDung });
  return {
    trangThai: tt, trangThaiNhan: NHAN_TRANG_THAI[tt], daDung,
    phanTramDaDung: doc.soLuotToiDa ? Math.round((daDung / doc.soLuotToiDa) * 100) : null,
    moTaGiam: moTaGiam(doc), loaiNhan: LOAI_MA[doc.loai as keyof typeof LOAI_MA]?.nhan || doc.loai,
    nguonNhan: LOAI_MA[doc.loai as keyof typeof LOAI_MA]?.nguon || "",
    linkDatLich: linkDatLichCoMa(doc.ma), anhQR: `/api/ma-khuyen-mai/${doc.id}/qr.png`,
  };
}

const dauThang = (thang: string) => new Date(`${thang}-01T00:00:00+07:00`).toISOString();
const thangSau = (thang: string) => {
  const [y, m] = thang.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

/** Báo cáo hoa hồng tháng YYYY-MM: chỉ tính đơn đã thanh toán trong tháng (giờ Việt Nam). */
export async function baoCaoHoaHong(payload: Payload, thang?: string) {
  const t = thang && /^\d{4}-\d{2}$/.test(thang) ? thang : gioVN().ngay.slice(0, 7);
  const { docs } = await payload.find({
    collection: "don-hang", overrideAccess: true, limit: 20000, depth: 0, pagination: false,
    where: { and: [
      { khuyenMai: { exists: true } }, { "thanhToan.trangThai": { equals: "daThanhToan" } },
      { "thanhToan.thanhToanLuc": { greater_than_equal: dauThang(t) } }, { "thanhToan.thanhToanLuc": { less_than: dauThang(thangSau(t)) } },
    ] },
    select: { ma: true, khuyenMai: true, thanhToan: true },
  });
  const ma = (await payload.find({ collection: "ma-khuyen-mai", limit: 2000, depth: 0, pagination: false, overrideAccess: true })).docs;
  const dong = ma.map((m) => {
    const don = docs.filter((d) => d.khuyenMai === m.id);
    const doanhThu = don.reduce((a, d) => a + (d.thanhToan?.daNhan || 0), 0);
    return {
      ma: m.ma, loai: LOAI_MA[m.loai as keyof typeof LOAI_MA]?.nhan || m.loai, doiTac: m.doiTac || "", soDon: don.length, doanhThu,
      tyLe: m.hoaHongPhanTram || 0, hoaHong: tinhHoaHong(doanhThu, m.hoaHongPhanTram || 0), maDon: don.map((d) => d.ma).join(" "),
    };
  }).filter((d) => d.soDon > 0).sort((a, b) => b.doanhThu - a.doanhThu);
  const tong = { soDon: dong.reduce((a, d) => a + d.soDon, 0), doanhThu: dong.reduce((a, d) => a + d.doanhThu, 0), hoaHong: dong.reduce((a, d) => a + d.hoaHong, 0) };
  return {
    thang: t, dong: dong.map((d) => ({ ...d, doanhThuHienThi: dinhDangTien(d.doanhThu), hoaHongHienThi: d.tyLe ? dinhDangTien(d.hoaHong) : "0đ" })),
    tong: { ...tong, doanhThuHienThi: dinhDangTien(tong.doanhThu), hoaHongHienThi: dinhDangTien(tong.hoaHong) },
    soDoiTac: dong.filter((d) => d.hoaHong > 0).length,
  };
}

export function bangHoaHong(bc: Awaited<ReturnType<typeof baoCaoHoaHong>>): Bang {
  return {
    ten: `Hoa hồng ${bc.thang}`,
    cot: [
      { khoa: "ma", tieuDe: "Mã", rong: 22 }, { khoa: "loai", tieuDe: "Loại" }, { khoa: "doiTac", tieuDe: "Đối tác", rong: 32 },
      { khoa: "soDon", tieuDe: "Số đơn đã thanh toán", rong: 12 }, { khoa: "doanhThu", tieuDe: "Doanh thu (đ)", tien: true },
      { khoa: "tyLe", tieuDe: "Tỷ lệ hoa hồng (%)", rong: 12 }, { khoa: "hoaHong", tieuDe: "Hoa hồng (đ)", tien: true },
      { khoa: "maDon", tieuDe: "Danh sách mã đơn", rong: 60 },
    ],
    dong: [...bc.dong, { ma: "TỔNG", soDon: bc.tong.soDon, doanhThu: bc.tong.doanhThu, hoaHong: bc.tong.hoaHong }],
  };
}

export async function thongKeMa(payload: Payload) {
  const ma = (await payload.find({ collection: "ma-khuyen-mai", limit: 2000, depth: 0, pagination: false, overrideAccess: true })).docs;
  const trangThai = await Promise.all(ma.map(async (m) => trangThaiMa(m, { daDung: await soLuotDaDung(payload, m.id) })));
  const thang = gioVN().ngay.slice(0, 7);
  const [luotThang, tongLuot, donThang] = await Promise.all([
    payload.count({ collection: "don-hang", overrideAccess: true, where: { and: [{ khuyenMai: { exists: true } }, { createdAt: { greater_than_equal: dauThang(thang) } }] } }),
    payload.count({ collection: "don-hang", overrideAccess: true, where: { khuyenMai: { exists: true } } }),
    payload.count({ collection: "don-hang", overrideAccess: true, where: { createdAt: { greater_than_equal: dauThang(thang) } } }),
  ]);
  const hh = await baoCaoHoaHong(payload, thang);
  return {
    maDangChay: trangThai.filter((t) => t === "dangChay").length, tongMa: ma.length,
    luotDungThangNay: luotThang.totalDocs, phanTramDonThangNay: donThang.totalDocs ? Math.round((luotThang.totalDocs / donThang.totalDocs) * 100) : 0,
    tongLuotDung: tongLuot.totalDocs, hoaHongThangNay: hh.tong.hoaHong, hoaHongThangNayHienThi: hh.tong.hoaHongHienThi, soDoiTacThangNay: hh.soDoiTac,
    thang, ngayCuoiThang: congNgay(`${thangSau(thang)}-01`, -1),
  };
}
