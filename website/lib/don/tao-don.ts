// Tạo đơn từ form công khai: đặt lịch (DatLich) và gọi gấp (GoiGap).
// Thứ tự: kiểm tra hình thức → đồng ý dữ liệu → dịch vụ, xe, vị trí, khung giờ → lưu đơn → (chạy nền) gửi điều phối, nhắn khách.
import crypto from "node:crypto";
import type { Payload } from "payload";
import site from "../../site.config.mjs";
import { GIOI_HAN_TEP, kiemTraVung, layKhungGio, LoiNguoiDung, tinhBaoGiaSoBo, timDongXe, trangThaiNhanGap } from "../cong-khai";
import { batDauKhung } from "../lich-dat.mjs";
import { maTiepTheo } from "../ma-so";
import { kiemTraDauVao } from "./dau-vao.mjs";
import { kenhNguon } from "./nguon.mjs";
import { dieuPhoi } from "../tich-hop/dieu-phoi";
import { thongBao } from "../tich-hop/thong-bao";
import { CHO_DO } from "./dau-vao.mjs";

export type TepTaiLen = { ten: string; loai: string; kichThuoc: number; duLieu: Buffer; thoiLuongGiay?: number | null };

export const taoToken = () => crypto.randomBytes(24).toString("base64url");
export const linkTheoDoi = (token: string) => `${site.url}/don/${token}/`;

function kiemTraTep(tep: TepTaiLen[]) {
  const anh = tep.filter((t) => t.loai.startsWith("image/"));
  const video = tep.filter((t) => t.loai.startsWith("video/"));
  const khac = tep.filter((t) => !t.loai.startsWith("image/") && !t.loai.startsWith("video/"));
  const g = GIOI_HAN_TEP;
  if (khac.length) throw new LoiNguoiDung("Chỉ nhận ảnh hoặc video.", 400, "TEP_SAI_LOAI");
  if (anh.length > g.soAnh) throw new LoiNguoiDung(`Tối đa ${g.soAnh} ảnh.`, 400, "QUA_NHIEU_TEP");
  if (video.length > g.soVideo) throw new LoiNguoiDung(`Tối đa ${g.soVideo} video.`, 400, "QUA_NHIEU_TEP");
  if (anh.some((t) => t.kichThuoc > g.anhToiDaMB * 1024 * 1024)) throw new LoiNguoiDung(`Mỗi ảnh tối đa ${g.anhToiDaMB} MB.`, 413, "TEP_QUA_LON");
  if (video.some((t) => t.kichThuoc > g.videoToiDaMB * 1024 * 1024)) throw new LoiNguoiDung(`Video tối đa ${g.videoToiDaMB} MB.`, 413, "TEP_QUA_LON");
  if (video.some((t) => (t.thoiLuongGiay ?? 0) > g.videoToiDaGiay + 1)) throw new LoiNguoiDung(`Video tối đa ${g.videoToiDaGiay} giây.`, 400, "VIDEO_QUA_DAI");
}

/**
 * @returns thông tin trả cho khách ngay sau khi gửi (mã đơn, link theo dõi riêng, giá sơ bộ).
 */
export async function taoDon(payload: Payload, loai: "datLich" | "khanCap", tho: Record<string, unknown>, tep: TepTaiLen[] = []) {
  const kt = kiemTraDauVao(loai, tho);
  if (!kt.ok) throw new LoiNguoiDung("Thông tin chưa đúng, xem lại các ô được đánh dấu.", 400, "DU_LIEU_SAI", { truong: kt.loi });
  const d = kt.duLieu as unknown as DuLieuDon;
  kiemTraTep(tep);

  // Gọi gấp: chỉ nhận trong giờ nhận đơn gấp
  if (loai === "khanCap") {
    const gap = await trangThaiNhanGap(payload);
    if (!gap.dangNhan) throw new LoiNguoiDung(`Ngoài giờ nhận đơn gấp (${gap.tu}–${gap.den}). Vui lòng gọi hotline.`, 409, "NGOAI_GIO_NHAN_GAP");
  }

  // Dịch vụ: đặt lịch chọn trực tiếp; gọi gấp suy ra từ sự cố (cấu hình chung → Gọi gấp)
  let dichVuSlugs: string[] = d.dichVu || [];
  let suCo: { ma: string; ten: string } | null = null;
  if (loai === "khanCap") {
    const c = await payload.findGlobal({ slug: "cai-dat", depth: 1 });
    const s = (c.suCoKhanCap || []).find((x) => x.ma === d.suCo);
    if (!s) throw new LoiNguoiDung("Sự cố không có trong danh sách.", 400, "SU_CO_KHONG_CO", { truong: { suCo: "Chọn xe đang bị gì." } });
    suCo = { ma: s.ma, ten: s.ten };
    dichVuSlugs = typeof s.dichVu === "object" && s.dichVu?.slug ? [s.dichVu.slug] : [];
  }

  // Xe
  let dongXe = null;
  if (d.xe.dong) {
    dongXe = await timDongXe(payload, d.xe.dong);
    if (!dongXe) throw new LoiNguoiDung("Không tìm thấy dòng xe đã chọn.", 400, "XE_KHONG_CO", { truong: { "xe.dong": "Chọn lại dòng xe." } });
  }

  // Giá sơ bộ (lưu lại đúng giá khách thấy lúc đặt)
  const gia = dichVuSlugs.length
    ? await tinhBaoGiaSoBo(payload, { dichVu: dichVuSlugs, dongXe: dongXe?.id ?? null, chiDichVuNhanDat: loai === "datLich" })
    : null;

  // Vị trí
  const vung = await kiemTraVung(payload, { diaChi: d.viTri.diaChi, lat: d.viTri.lat, lng: d.viTri.lng });
  if (!vung.trongVung) throw new LoiNguoiDung(vung.thongBao, 422, "NGOAI_VUNG", { vung });

  // Khung giờ
  let khung: { ngay: string; ma: string; batDau: string; ketThuc: string; nhan: string } | null = null;
  if (loai === "datLich") {
    const lich = await layKhungGio(payload, { tuNgay: d.khungGio.ngay, soNgay: 1 });
    const ngay = lich.ngay.find((n) => n.ngay === d.khungGio.ngay);
    const k = ngay?.khung.find((x) => x.ma === d.khungGio.ma);
    if (!ngay || ngay.nghi) throw new LoiNguoiDung("Ngày này không nhận đơn, chọn ngày khác.", 409, "NGAY_NGHI", { truong: { khungGio: "Chọn ngày khác." } });
    if (!k) throw new LoiNguoiDung("Khung giờ không có, chọn lại.", 409, "KHUNG_KHONG_CO", { truong: { khungGio: "Chọn lại khung giờ." } });
    if (k.day) throw new LoiNguoiDung("Khung giờ này vừa kín chỗ, chọn khung khác.", 409, "KHUNG_DAY", { truong: { khungGio: "Khung đã đầy." } });
    if (k.daQua) throw new LoiNguoiDung("Khung giờ này đã qua hoặc quá sát giờ, chọn khung sau.", 409, "KHUNG_DA_QUA", { truong: { khungGio: "Chọn khung sau." } });
    khung = { ngay: ngay.ngay, ma: k.ma, batDau: k.batDau, ketThuc: k.ketThuc, nhan: `${k.nhan}, ${ngay.ngayThang}` };
  }

  const token = taoToken();
  const ma = await maTiepTheo(payload, "TT");
  const bayGio = new Date().toISOString();
  const don = await payload.create({
    collection: "don-hang",
    overrideAccess: true,
    context: { taoTuWeb: true },
    data: {
      ma,
      loai,
      trangThai: "daNhan",
      dichVu: gia ? (await payload.find({ collection: "danh-muc-dich-vu", where: { slug: { in: dichVuSlugs } }, depth: 0, limit: 10 })).docs.map((x) => x.id) : [],
      suCo: suCo ? `${suCo.ten}` : undefined,
      trieuChung: d.trieuChung || undefined,
      xe: {
        hang: dongXe ? (typeof dongXe.hang === "object" ? dongXe.hang.id : dongXe.hang) : undefined,
        dong: dongXe?.id,
        tenXe: dongXe?.tenDayDu || d.xe.tenXe || undefined,
        doi: d.xe.doi ?? undefined, bienSo: d.xe.bienSo ?? undefined, soKm: d.xe.soKm ?? undefined,
        phanKhuc: (dongXe?.phanKhuc as "A") || undefined,
      },
      viTri: {
        lat: vung.viTri.lat, lng: vung.viTri.lng, diaChi: d.viTri.diaChi || vung.viTri.diaChi,
        quan: vung.quan && "id" in vung.quan ? (vung.quan.id as number) : undefined, phuong: vung.phuong?.ten,
        trongVung: true, etaTu: vung.eta?.tu, etaDen: vung.eta?.den,
        choDo: (d.viTri.choDo as "nha") || undefined, ghiChuChoTho: d.viTri.ghiChuChoTho || undefined,
      },
      khungGio: khung ? { ngay: khung.ngay, ma: khung.ma, nhan: khung.nhan, batDauLuc: batDauKhung(khung.ngay, khung.batDau) } : undefined,
      khach: { hoTen: d.khach.hoTen || undefined, sdt: d.khach.sdt },
      hoaDon: d.hoaDon || undefined,
      maGioiThieu: d.maGioiThieu || undefined,
      maKhuyenMai: d.maKhuyenMai || undefined,
      dongY: { dongYXuLyDuLieu: true, dongYLuc: bayGio, nhacBaoDuongZalo: Boolean(d.nhacBaoDuong) },
      nguon: { ...d.nguon, kenh: kenhNguon({ ...d.nguon, maKhuyenMai: d.maKhuyenMai, maGioiThieu: d.maGioiThieu }) },
      giaSoBo: gia ? { trangThai: gia.trangThai as "coGia", tu: gia.tu, den: gia.den, phanKhuc: gia.phanKhuc, dong: gia.dong } : undefined,
      tokenTheoDoi: token,
    },
  });

  // Tệp đính kèm: lưu sau khi có đơn để gắn vào đơn
  const tepIds: number[] = [];
  for (const t of tep) {
    const doc = await payload.create({
      collection: "tep-don-hang",
      overrideAccess: true,
      data: { donHang: don.id, loai: t.loai.startsWith("video/") ? "video" : "anh", thoiLuongGiay: t.thoiLuongGiay ?? undefined },
      file: { data: t.duLieu, mimetype: t.loai, name: `${ma}-${t.ten}`.replace(/[^\w.\-]+/g, "_"), size: t.kichThuoc },
    });
    tepIds.push(doc.id);
  }
  if (tepIds.length) {
    await payload.update({ collection: "don-hang", id: don.id, overrideAccess: true, context: { boQuaHook: true }, data: { tep: tepIds } });
  }

  // Gửi điều phối và nhắn khách: chạy nền, kết quả ghi vào đơn. Lỗi không làm mất đơn.
  void guiSauKhiTao(payload, don.id);

  return {
    ma,
    loai,
    trangThai: "daNhan",
    linkTheoDoi: linkTheoDoi(token),
    token,
    khungGio: khung ? { ngay: khung.ngay, ma: khung.ma, nhan: khung.nhan } : null,
    viTri: { quan: vung.quan?.ten || null, phuong: vung.phuong?.ten || null, etaTu: vung.eta?.tu ?? null, etaDen: vung.eta?.den ?? null },
    giaSoBo: gia ? { trangThai: gia.trangThai as "coGia", tu: gia.tu, den: gia.den, hienThi: gia.hienThi, ghiChu: gia.ghiChu } : null,
    nhanLuc: bayGio,
  };
}

/** Dữ liệu đã qua kiemTraDauVao (lib/don/dau-vao.mjs). */
type DuLieuDon = {
  dichVu?: string[]; suCo?: string; trieuChung?: string;
  xe: { hang: string; dong: string; tenXe: string; doi: number | null; bienSo: string | null; soKm: number | null };
  viTri: { lat: number | null; lng: number | null; diaChi: string; choDo?: string; ghiChuChoTho: string };
  khungGio: { ngay: string; ma: string };
  khach: { sdt: string; hoTen: string };
  hoaDon?: { can: boolean; mst: string; tenCongTy: string; diaChi: string; email: string };
  maGioiThieu: string; maKhuyenMai: string; nhacBaoDuong?: boolean;
  nguon: { utmSource: string; utmMedium: string; utmCampaign: string; maQR: string; trangVao: string; referrer: string };
};

export async function guiSauKhiTao(payload: Payload, id: number) {
  const don = await payload.findByID({ collection: "don-hang", id, depth: 1, overrideAccess: true });
  const tenDv = (don.dichVu || []).map((x) => (typeof x === "object" ? x.ten : "")).filter(Boolean).join(", ") || don.suCo || "";
  const quan = typeof don.viTri?.quan === "object" ? don.viTri?.quan?.ten : undefined;
  const ghi: Record<string, unknown> = {};
  try {
    const kq = await dieuPhoi.guiDonMoi({
      ma: don.ma || "", loai: don.loai, uuTien: don.uuTien ?? 0, trangThai: don.trangThai,
      dichVu: (don.dichVu || []).map((x) => (typeof x === "object" ? x.slug : String(x))), suCo: don.suCo || undefined,
      trieuChung: don.trieuChung || undefined,
      xe: { ten: don.xe?.tenXe || undefined, bienSo: don.xe?.bienSo || undefined, doi: don.xe?.doi ?? undefined, soKm: don.xe?.soKm ?? undefined },
      viTri: {
        lat: don.viTri?.lat ?? undefined, lng: don.viTri?.lng ?? undefined, diaChi: don.viTri?.diaChi || undefined, quan,
        phuong: don.viTri?.phuong || undefined, choDo: CHO_DO.find((c) => c.value === don.viTri?.choDo)?.label,
        ghiChuChoTho: don.viTri?.ghiChuChoTho || undefined,
      },
      khungGio: don.khungGio?.ngay ? { ngay: don.khungGio.ngay, batDau: don.khungGio.ma || "", ketThuc: "" } : undefined,
      khach: { hoTen: don.khach?.hoTen || undefined, sdt: don.khach?.sdt || "" },
      giaSoBo: don.giaSoBo?.tu != null ? { tu: don.giaSoBo.tu, den: don.giaSoBo.den ?? don.giaSoBo.tu } : null,
      linkTheoDoi: linkTheoDoi(don.tokenTheoDoi || ""),
    });
    Object.assign(ghi, { "tichHop.dieuPhoiId": kq.id, "tichHop.guiDieuPhoiLuc": new Date().toISOString(), "tichHop.loiDieuPhoi": null });
  } catch (e) {
    ghi["tichHop.loiDieuPhoi"] = (e as Error).message;
    payload.logger.error({ err: e, msg: `Không gửi được đơn ${don.ma} sang điều phối` });
  }
  if (don.loai === "khanCap") {
    await thongBao.baoTrucDieuPhoi(`DON KHAN CAP ${don.ma}: ${don.suCo || tenDv} tai ${don.viTri?.diaChi || ""}. SDT ${don.khach?.sdt}`)
      .catch((e) => payload.logger.error({ err: e, msg: "Không nhắn được số trực điều phối" }));
  }
  try {
    const kenh = await thongBao.guiXacNhanDon({
      sdt: don.khach?.sdt || "", hoTen: don.khach?.hoTen || undefined, ma: don.ma || "", dichVu: tenDv,
      gioHen: don.khungGio?.nhan || "Khẩn cấp, thợ gần nhất tới ngay", xe: [don.xe?.tenXe, don.xe?.bienSo].filter(Boolean).join(" · "),
      diaChi: don.viTri?.diaChi || "", link: linkTheoDoi(don.tokenTheoDoi || ""), khanCap: don.loai === "khanCap",
    });
    Object.assign(ghi, { "tichHop.xacNhanKenh": kenh, "tichHop.xacNhanLuc": new Date().toISOString(), "tichHop.loiThongBao": null });
  } catch (e) {
    ghi["tichHop.loiThongBao"] = (e as Error).message;
    payload.logger.error({ err: e, msg: `Không nhắn được xác nhận đơn ${don.ma}` });
  }
  const tichHop: Record<string, unknown> = { ...(don.tichHop || {}) };
  for (const [k, v] of Object.entries(ghi)) tichHop[k.replace("tichHop.", "")] = v;
  await payload.update({ collection: "don-hang", id, overrideAccess: true, context: { boQuaHook: true }, data: { tichHop } }).catch(() => {});
}
