// Phục vụ khách sau khi đặt (P1): xếp thợ, vị trí thợ, báo giá chính thức, khách duyệt/từ chối, sửa xong,
// thanh toán VietQR, hoá đơn điện tử, phiếu bảo hành. Thợ/điều phối gọi qua API có khoá; khách qua link riêng (token).
import QRCode from "qrcode";
import type { Payload, PayloadRequest } from "payload";
import type { BaoGia, DonHang, HoiVien, MaKhuyenMai, Tho } from "../../payload-types";
import { LoiNguoiDung, layPhiChung } from "../cong-khai";
import { chonHangMuc, tinhThanhToan } from "../bao-gia.mjs";
import { hangMucBaoHanh, conLai } from "../bao-hanh.mjs";
import { tinhGiam } from "../khuyen-mai.mjs";
import { maTiepTheo } from "../ma-so";
import { cheSdt } from "../so-dien-thoai.mjs";
import { dinhDangTien } from "../tinh-gia.mjs";
import { noiDungChuyenKhoan, taoChuoiVietQR, timMaTrongNoiDung } from "../vietqr.mjs";
import { hoaDon } from "../tich-hop/hoa-don";
import type { GiaoDichVao } from "../tich-hop/ngan-hang";
import { guiTinDon } from "./tin-nhan";
import { ghiTruong } from "../ghi-truong";
import { hoiVienCuaXe, nhanTienHoiVien, quyenLoiChoDon } from "../hoi-vien";
import { baoThuongGioiThieu, luotConLaiCuaSdt } from "../gioi-thieu";

const id = (v: unknown) => (typeof v === "object" && v ? (v as { id: number }).id : (v as number));
const nguoiLam = (req?: PayloadRequest) => {
  const u = req?.user as { ten?: string; email?: string } | null | undefined;
  return u ? u.ten || u.email || "?" : "Hệ thống";
};

// ------------------------------------------------------------------ tìm đơn

export async function donTheoMa(payload: Payload, ma: string) {
  const don = (await payload.find({
    collection: "don-hang", limit: 1, depth: 1, overrideAccess: true,
    where: /^\d+$/.test(ma) ? { id: { equals: Number(ma) } } : { ma: { equals: ma.toUpperCase() } },
  })).docs[0];
  if (!don) throw new LoiNguoiDung(`Không có đơn ${ma}.`, 404, "KHONG_CO_DON");
  return don;
}

/** Đơn theo link riêng của khách. Link hết hạn 24 giờ sau khi đơn xong. */
export async function donTheoLink(payload: Payload, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  const don = (await payload.find({ collection: "don-hang", where: { tokenTheoDoi: { equals: token } }, limit: 1, depth: 1, overrideAccess: true })).docs[0];
  if (!don) throw new LoiNguoiDung("Link không đúng hoặc đơn không còn.", 404, "LINK_SAI");
  if (don.hetHanLinkLuc && new Date(don.hetHanLinkLuc).getTime() < Date.now()) {
    throw new LoiNguoiDung("Link đã hết hạn (24 giờ sau khi đơn xong). Tra lại hoá đơn, bảo hành bằng biển số xe.", 410, "LINK_HET_HAN");
  }
  return don;
}

const capNhatDon = (payload: Payload, don: DonHang, data: Record<string, unknown>, req?: PayloadRequest, context: Record<string, unknown> = {}) =>
  payload.update({ collection: "don-hang", id: don.id, data: data as never, overrideAccess: true, req, context, depth: 1 });

// ------------------------------------------------------------------ thợ

/** Thông tin thợ cho khách (TheoDoi, TinZalo): không có số điện thoại riêng của thợ. */
export function thoChoKhach(t: Tho | number | null | undefined) {
  if (!t || typeof t !== "object") return null;
  const anh = typeof t.anh === "object" && t.anh ? t.anh.url : null;
  return {
    ten: t.ten,
    vietTat: t.ten.split(/\s+/).slice(-2).map((x) => x[0]).join("").toUpperCase(),
    anh,
    diemSao: t.diemSao != null ? Math.round(t.diemSao * 10) / 10 : null,
    soDanhGia: t.soDanhGia ?? 0,
    soNamNghe: t.soNamNghe ?? null,
    chungChi: (t.chungChi || []).map((c) => c.ten),
    bienSoXeVan: t.bienSoXeVan || null,
  };
}

export async function xepTho(payload: Payload, req: PayloadRequest, ma: string, p: { tho: string | number; duKienDenLuc?: string }) {
  const don = await donTheoMa(payload, ma);
  const tho = (await payload.find({
    collection: "tho", limit: 1, overrideAccess: true,
    where: typeof p.tho === "number" || /^\d+$/.test(String(p.tho)) ? { id: { equals: Number(p.tho) } } : { maBenDieuPhoi: { equals: String(p.tho) } },
  })).docs[0];
  if (!tho) throw new LoiNguoiDung("Không tìm thấy thợ (id hoặc mã bên điều phối).", 400, "THO_KHONG_CO");
  const data: Record<string, unknown> = { tho: tho.id };
  if (p.duKienDenLuc) data.thoDuKienDenLuc = new Date(p.duKienDenLuc).toISOString();
  if (don.trangThai === "daNhan") data.trangThai = "daXepTho";
  const moi = await capNhatDon(payload, don, data, req);
  if (don.trangThai !== "daNhan") void guiTinDon(payload, don.id, "daXepTho"); // đổi thợ: nhắn lại
  return moi;
}

export async function capNhatViTriTho(payload: Payload, req: PayloadRequest, ma: string, p: { lat: number; lng: number; duKienDenLuc?: string }) {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) throw new LoiNguoiDung("Toạ độ không hợp lệ.", 400, "TOA_DO_SAI");
  const don = await donTheoMa(payload, ma);
  const luc = new Date().toISOString();
  const data: Record<string, unknown> = { viTriTho: { lat: p.lat, lng: p.lng, luc } };
  if (p.duKienDenLuc) data.thoDuKienDenLuc = new Date(p.duKienDenLuc).toISOString();
  if (don.trangThai === "daXepTho") data.trangThai = "thoDangDen";
  if (don.tho) await payload.update({ collection: "tho", id: id(don.tho), data: { viTri: { lat: p.lat, lng: p.lng, luc } }, overrideAccess: true });
  return capNhatDon(payload, don, data, req, { khongNhanTin: true });
}

// ------------------------------------------------------------------ báo giá

type HangMucVao = { ma?: string; ten: string; lyDo?: string; loai: "cong" | "phuTung"; gia: number; batBuoc?: boolean; mucDo?: string; baoHanhThang?: number; anh?: number[]; hangMucGia?: number };

/**
 * Quyền lợi hội viên của từng hạng mục: theo hạng mục bảng giá thợ chọn (hangMucGia), không có thì so tên với các hạng mục
 * bảng giá đang gắn quyền lợi (không phân biệt hoa thường).
 */
async function ganQuyenLoi(payload: Payload, hangMuc: { ten: string; loai: string; hangMucGia?: number }[]) {
  const coQuyenLoi = (await payload.find({ collection: "hang-muc-gia", where: { quyenLoiHoiVien: { exists: true } }, limit: 50, depth: 0, overrideAccess: true })).docs;
  const chuan = (t: string) => t.trim().toLowerCase();
  return hangMuc.map((h) => {
    if (h.loai !== "cong") return null;
    const hm = h.hangMucGia ? coQuyenLoi.find((x) => x.id === h.hangMucGia) : coQuyenLoi.find((x) => chuan(x.ten) === chuan(h.ten) || (x.tenNgan && chuan(x.tenNgan) === chuan(h.ten)));
    return hm?.quyenLoiHoiVien || null;
  });
}

export async function taoBaoGia(payload: Payload, req: PayloadRequest, ma: string, p: { chanDoan?: string; hangMuc: HangMucVao[] }) {
  const don = await donTheoMa(payload, ma);
  if (["choThanhToan", "hoanThanh", "huy"].includes(don.trangThai)) throw new LoiNguoiDung("Đơn đã xong hoặc huỷ, không báo giá được.", 409, "DON_DA_XONG");
  if (!Array.isArray(p.hangMuc) || !p.hangMuc.length) throw new LoiNguoiDung("Báo giá cần ít nhất một hạng mục.", 400, "DU_LIEU_SAI");
  const hangMuc = p.hangMuc.map((h, i) => {
    if (!h.ten || !["cong", "phuTung"].includes(h.loai) || !Number.isInteger(h.gia) || h.gia < 0) {
      throw new LoiNguoiDung(`Hạng mục ${i + 1}: cần tên, loại (cong|phuTung), giá là số nguyên đồng.`, 400, "DU_LIEU_SAI");
    }
    const hangMucGia = h.hangMucGia == null ? undefined : Number(h.hangMucGia);
    if (hangMucGia !== undefined && !Number.isInteger(hangMucGia)) throw new LoiNguoiDung(`Hạng mục ${i + 1}: hangMucGia là id hạng mục bảng giá.`, 400, "DU_LIEU_SAI");
    return { ma: h.ma || `hm${i + 1}`, ten: h.ten, lyDo: h.lyDo, loai: h.loai, gia: h.gia, batBuoc: Boolean(h.batBuoc), mucDo: (h.mucDo as "nenLam") || "canLamNgay", baoHanhThang: h.baoHanhThang, anh: h.anh, hangMucGia };
  });
  const quyenLoi = await ganQuyenLoi(payload, hangMuc);
  hangMuc.forEach((h, i) => Object.assign(h, { quyenLoi: quyenLoi[i] }));
  if (new Set(hangMuc.map((h) => h.ma)).size !== hangMuc.length) throw new LoiNguoiDung("Mã hạng mục bị trùng.", 400, "DU_LIEU_SAI");
  const cu = (await payload.find({ collection: "bao-gia", where: { donHang: { equals: don.id } }, sort: "-phienBan", limit: 100, overrideAccess: true })).docs;
  // Báo giá chưa duyệt cũ thì thay bằng báo giá mới
  for (const b of cu.filter((x) => x.trangThai === "choDuyet")) {
    await payload.update({ collection: "bao-gia", id: b.id, data: { trangThai: "thayThe" }, overrideAccess: true });
  }
  const daDuyet = cu.some((b) => b.trangThai === "daDuyet");
  const bg = await payload.create({
    collection: "bao-gia", overrideAccess: true,
    data: {
      donHang: don.id, maDon: don.ma, phienBan: (cu[0]?.phienBan || 0) + 1, trangThai: "choDuyet",
      chanDoan: p.chanDoan, hangMuc: hangMuc as never, taoBoi: nguoiLam(req),
    },
  });
  if (don.trangThai !== "choDuyetBaoGia") {
    await capNhatDon(payload, don, { trangThai: "choDuyetBaoGia" }, req, { phatSinh: daDuyet || don.trangThai === "dangSua" });
  }
  void guiTinDon(payload, don.id, "baoGia", { soHangMuc: String(hangMuc.length), tongTien: dinhDangTien(bg.tongNeuLamHet || 0) });
  return bg;
}

function baoGiaChoKhach(b: BaoGia, token = "") {
  return {
    id: b.id,
    lan: b.phienBan,
    phatSinh: (b.phienBan || 1) > 1,
    trangThai: b.trangThai,
    chanDoan: b.chanDoan || null,
    hangMuc: (b.hangMuc || []).map((h) => ({
      ma: h.ma, ten: h.ten, lyDo: h.lyDo || null, loai: h.loai, loaiNhan: h.loai === "cong" ? "Tiền công" : "Phụ tùng",
      gia: h.gia, giaHienThi: dinhDangTien(h.gia), batBuoc: Boolean(h.batBuoc), tuyChon: !h.batBuoc,
      mucDo: h.mucDo, mucDoNhan: h.mucDo === "nenLam" ? "Nên làm" : h.mucDo === "coTheDeSau" ? "Có thể để sau" : "Cần làm ngay",
      anh: (h.anh || []).map((a) => (typeof a === "object" && a ? `/api/don-hang/theo-doi/${token}/anh/${a.id}` : null)).filter(Boolean),
    })),
    tongNeuLamHet: b.tongNeuLamHet,
    ketQua: b.ketQua?.luc ? { luc: b.ketQua.luc, boHangMuc: b.ketQua.boHangMuc || [], tienCong: b.ketQua.tienCong, phuTung: b.ketQua.phuTung, lyDoTuChoi: b.ketQua.lyDoTuChoi || null } : null,
    taoLuc: b.createdAt,
  };
}

/** Màn BaoGia: báo giá đang chờ duyệt (hoặc báo giá gần nhất), kèm phí đi lại để giao diện tự cộng khi khách bỏ bớt. */
export async function xemBaoGia(payload: Payload, token: string) {
  const don = await donTheoLink(payload, token);
  const ds = (await payload.find({ collection: "bao-gia", where: { and: [{ donHang: { equals: don.id } }, { trangThai: { not_equals: "thayThe" } }] }, sort: "-phienBan", limit: 20, depth: 1, overrideAccess: true })).docs;
  if (!ds.length) throw new LoiNguoiDung("Thợ chưa gửi báo giá.", 404, "CHUA_CO_BAO_GIA");
  const phi = await layPhiChung(payload);
  return {
    ma: don.ma,
    xe: { ten: don.xe?.tenXe || null, bienSo: don.xe?.bienSo || null },
    tho: thoChoKhach(don.tho as Tho),
    baoGia: baoGiaChoKhach(ds[0], token),
    daDuyetTruoc: ds.slice(1).filter((b) => b.trangThai === "daDuyet").map((b) => baoGiaChoKhach(b, token)),
    phiDiLai: ds.some((b) => b.trangThai === "daDuyet" && b.id !== ds[0].id) ? 0 : phi.phiDiLai,
    phiKiemTra: phi.phiKiemTra,
    khuyenMai: typeof don.khuyenMai === "object" && don.khuyenMai ? { ma: don.khuyenMai.ma, kieuGiam: don.khuyenMai.kieuGiam, giaTri: don.khuyenMai.giaTri, giamToiDa: don.khuyenMai.giamToiDa ?? null } : null,
  };
}

async function baoGiaDangCho(payload: Payload, donId: number) {
  const b = (await payload.find({ collection: "bao-gia", where: { and: [{ donHang: { equals: donId } }, { trangThai: { equals: "choDuyet" } }] }, sort: "-phienBan", limit: 1, overrideAccess: true })).docs[0];
  if (!b) throw new LoiNguoiDung("Không có báo giá nào đang chờ duyệt.", 409, "KHONG_CO_BAO_GIA_CHO");
  return b;
}

/** Khách đồng ý (đã bỏ bớt hạng mục tuỳ chọn). Lưu thời điểm, số điện thoại, bản chụp nội dung đã duyệt. */
export async function duyetBaoGia(payload: Payload, token: string, p: { boHangMuc?: string[]; dongY?: boolean }) {
  if (p.dongY !== true) throw new LoiNguoiDung("Bấm đồng ý để thợ bắt đầu làm.", 400, "CHUA_DONG_Y");
  const don = await donTheoLink(payload, token);
  const b = await baoGiaDangCho(payload, don.id);
  const kq = chonHangMuc((b.hangMuc || []) as never, p.boHangMuc || []);
  if (!kq.ok) throw new LoiNguoiDung(kq.loi, 400, "BO_HANG_MUC_SAI");
  const luc = new Date().toISOString();
  const banChup = {
    luc, maDon: don.ma, sdt: don.khach?.sdt, chanDoan: b.chanDoan || null,
    hangMucDaChon: kq.chon.map((h: { ma: string; ten: string; loai: string; gia: number; lyDo?: string | null }) => ({ ma: h.ma, ten: h.ten, loai: h.loai, gia: h.gia, lyDo: h.lyDo || null })),
    hangMucDaBo: (p.boHangMuc || []).map(String), tienCong: kq.tienCong, phuTung: kq.phuTung,
  };
  const moi = await payload.update({
    collection: "bao-gia", id: b.id, overrideAccess: true,
    data: { trangThai: "daDuyet", ketQua: { luc, sdt: don.khach?.sdt, boHangMuc: (p.boHangMuc || []).map(String), tienCong: kq.tienCong, phuTung: kq.phuTung, banChup } },
  });
  if (don.trangThai === "choDuyetBaoGia") await capNhatDon(payload, don, { trangThai: "dangSua" }, undefined, { ghiChuTrangThai: "Khách đồng ý báo giá" });
  return { baoGia: baoGiaChoKhach(moi, token), trangThai: "dangSua" };
}

/** Khách từ chối: đơn kết thúc, chỉ tính phí kiểm tra (nếu là báo giá đầu). Từ chối phát sinh thì làm tiếp phần đã duyệt. */
export async function tuChoiBaoGia(payload: Payload, token: string, p: { lyDo?: string }) {
  const don = await donTheoLink(payload, token);
  const b = await baoGiaDangCho(payload, don.id);
  const luc = new Date().toISOString();
  await payload.update({
    collection: "bao-gia", id: b.id, overrideAccess: true,
    data: { trangThai: "tuChoi", ketQua: { luc, sdt: don.khach?.sdt, lyDoTuChoi: String(p.lyDo || "").slice(0, 500) } },
  });
  const coDaDuyet = (await payload.count({ collection: "bao-gia", where: { and: [{ donHang: { equals: don.id } }, { trangThai: { equals: "daDuyet" } }] }, overrideAccess: true })).totalDocs > 0;
  if (coDaDuyet) {
    await capNhatDon(payload, don, { trangThai: "dangSua" }, undefined, { ghiChuTrangThai: "Khách từ chối phần phát sinh" });
    return { trangThai: "dangSua", thongBao: "Thợ làm tiếp các hạng mục bạn đã đồng ý trước đó." };
  }
  await capNhatDon(payload, don, { ketQua: "tuChoiBaoGia" }, undefined);
  const xong = await danhDauXong(payload, undefined, don.ma!, {});
  return { trangThai: xong.trangThai, thongBao: `Đơn kết thúc. Bạn chỉ trả phí kiểm tra ${dinhDangTien(xong.thanhToan?.soTien || 0)}.` };
}

// ------------------------------------------------------------------ sửa xong, thanh toán

/** Thợ bấm xong: tính số tiền (báo giá đã duyệt + đi lại − giảm, hoặc phí kiểm tra), chờ khách chuyển khoản. */
export async function danhDauXong(payload: Payload, req: PayloadRequest | undefined, ma: string, p: { soKm?: number }) {
  const don = await donTheoMa(payload, ma);
  if (["hoanThanh", "huy"].includes(don.trangThai)) throw new LoiNguoiDung("Đơn đã kết thúc.", 409, "DON_DA_XONG");
  if (don.trangThai === "choDuyetBaoGia" && don.ketQua !== "tuChoiBaoGia") throw new LoiNguoiDung("Báo giá chưa được khách duyệt.", 409, "CHUA_DUYET_BAO_GIA");
  const bgs = (await payload.find({ collection: "bao-gia", where: { and: [{ donHang: { equals: don.id } }, { trangThai: { equals: "daDuyet" } }] }, sort: "phienBan", limit: 50, overrideAccess: true })).docs;
  const phi = await layPhiChung(payload);
  const tuChoi = don.ketQua === "tuChoiBaoGia" && !bgs.length;
  if (!tuChoi && !bgs.length) throw new LoiNguoiDung("Chưa có báo giá nào được duyệt.", 409, "CHUA_DUYET_BAO_GIA");
  const daDuyet = bgs.map((b) => chonHangMuc((b.hangMuc || []) as never, b.ketQua?.boHangMuc || []) as { chon: { ten: string; loai: string; gia: number }[]; tienCong: number });
  const km = typeof don.khuyenMai === "object" && don.khuyenMai ? (don.khuyenMai as MaKhuyenMai) : null;
  // Quyền lợi: gói hội viên còn hạn của biển số (gắn lúc đặt, hoặc mua sau khi đặt), giới thiệu bạn bè
  const hv = (typeof don.hoiVien === "object" && don.hoiVien ? (don.hoiVien as HoiVien) : null) || (await hoiVienCuaXe(payload, don.xe?.bienSo));
  const tt = tinhThanhToan({
    baoGiaDaDuyet: daDuyet, phiDiLai: phi.phiDiLai, phiKiemTra: phi.phiKiemTra, tuChoi,
    tinhGiamMa: km ? (tienCong, tongTien) => tinhGiam(km, { tienCong, tongTien }) : undefined, tenMa: km?.ma || "",
    hoiVien: hv ? await quyenLoiChoDon(payload, hv, don.id) : null,
    gioiThieu: { banMoi: Boolean(don.gioiThieu && don.gioiThieuApDung), luotConLai: await luotConLaiCuaSdt(payload, don.khach?.sdt, don) },
  });
  const daNhan = don.thanhToan?.daNhan || 0;
  const moi = await capNhatDon(payload, don, {
    trangThai: "choThanhToan",
    xongLuc: new Date().toISOString(),
    ...(Number.isInteger(p.soKm) ? { soKmKhiXong: p.soKm } : {}),
    hoiVien: hv?.id ?? null,
    quyenLoi: {
      ...(don.quyenLoi || {}), mienDiLai: tt.suDung.mienDiLai, kichNo: tt.suDung.kichNo, vaLop: tt.suDung.vaLop,
      giamHoiVien: tt.suDung.giamHoiVien, giamMa: tt.suDung.giamMa,
    },
    thanhToan: { ...(don.thanhToan || {}), soTien: tt.tong, giam: tt.giam, chiTiet: tt.dong, daNhan, trangThai: daNhan >= tt.tong ? "daThanhToan" : "choTien" },
  }, req);
  if (daNhan >= tt.tong) return hoanTatThanhToan(payload, moi.id, { maGiaoDich: moi.thanhToan?.maGiaoDich || "", hinhThuc: moi.thanhToan?.hinhThuc || "chuyenKhoan" });
  void guiTinDon(payload, don.id, "thanhToan");
  return moi;
}

async function taiKhoanNhan(payload: Payload) {
  const c = await payload.findGlobal({ slug: "cai-dat", depth: 0 });
  return { bin: c.nganHangBin || "", tenNganHang: c.nganHangTen || "", soTaiKhoan: c.soTaiKhoan || "", chuTaiKhoan: c.chuTaiKhoan || "", hotline: c.hotline || "" };
}

/**
 * Chuyển khoản cho một mã (TT-… đơn, HV-… gói hội viên): nội dung TT000123, VietQR (chuỗi + ảnh PNG).
 * Chưa nhập tài khoản nhận tiền thì chuyenKhoan, vietQR là null (giao diện mời gọi hotline).
 */
export async function thongTinChuyenKhoan(payload: Payload, ma: string, conPhaiTra: number) {
  const tk = await taiKhoanNhan(payload);
  const noiDung = noiDungChuyenKhoan(ma);
  let vietQR: { chuoi: string; anh: string } | null = null;
  if (tk.bin && tk.soTaiKhoan && conPhaiTra > 0) {
    const chuoi = taoChuoiVietQR({ maBin: tk.bin, soTaiKhoan: tk.soTaiKhoan, soTien: conPhaiTra, noiDung });
    vietQR = { chuoi, anh: await QRCode.toDataURL(chuoi, { margin: 1, width: 480, errorCorrectionLevel: "M" }) };
  }
  return {
    chuyenKhoan: tk.soTaiKhoan
      ? { nganHang: tk.tenNganHang, soTaiKhoan: tk.soTaiKhoan, chuTaiKhoan: tk.chuTaiKhoan, soTien: conPhaiTra, soTienHienThi: dinhDangTien(conPhaiTra), noiDung }
      : null,
    vietQR,
    hotline: tk.hotline,
  };
}

/** Màn ThanhToan: hạng mục đã duyệt, tổng, VietQR, chuyển khoản tay; sau khi tiền về: biên nhận, hoá đơn, bảo hành. */
export async function xemThanhToan(payload: Payload, token: string) {
  const don = await donTheoLink(payload, token);
  if (!don.thanhToan?.soTien) throw new LoiNguoiDung("Thợ chưa báo sửa xong, chưa có số tiền thanh toán.", 409, "CHUA_TINH_TIEN");
  const conPhaiTra = Math.max(0, don.thanhToan.soTien - (don.thanhToan.daNhan || 0));
  const ck = await thongTinChuyenKhoan(payload, don.ma!, conPhaiTra);
  const daTra = don.thanhToan.trangThai === "daThanhToan";
  const bh = typeof don.phieuBaoHanh === "object" && don.phieuBaoHanh ? don.phieuBaoHanh : null;
  return {
    ma: don.ma,
    xe: { ten: don.xe?.tenXe || null, doi: don.xe?.doi ?? null, bienSo: don.xe?.bienSo || null },
    tho: thoChoKhach(don.tho as Tho),
    xongLuc: don.xongLuc || null,
    trangThai: don.thanhToan.trangThai,
    daThanhToan: daTra,
    hangMuc: ((don.thanhToan.chiTiet || []) as { ten: string; soTien: number; loai: string }[]).map((d) => ({ ...d, hienThi: d.soTien < 0 ? `−${dinhDangTien(-d.soTien)}` : dinhDangTien(d.soTien) })),
    tong: don.thanhToan.soTien,
    tongHienThi: dinhDangTien(don.thanhToan.soTien),
    daNhan: don.thanhToan.daNhan || 0,
    conPhaiTra,
    chuyenKhoan: ck.chuyenKhoan,
    vietQR: ck.vietQR,
    bienNhan: daTra ? { soTien: don.thanhToan.daNhan, luc: don.thanhToan.thanhToanLuc, hinhThuc: don.thanhToan.hinhThuc === "tienMat" ? "Tiền mặt" : "Chuyển khoản VietQR", maGiaoDich: don.thanhToan.maGiaoDich } : null,
    hoaDon: don.hoaDonDienTu?.so ? { so: don.hoaDonDienTu.so, kyHieu: don.hoaDonDienTu.kyHieu, maCQT: don.hoaDonDienTu.maCQT, linkXem: don.hoaDonDienTu.linkXem || null, linkPdf: don.hoaDonDienTu.linkPdf || null } : null,
    baoHanh: bh ? {
      ma: bh.ma, bienSo: bh.bienSo,
      hangMuc: (bh.hangMuc || []).map((h) => ({ ten: h.ten, loai: h.loai, tuNgay: h.tuNgay, denNgay: h.denNgay, ...conLai({ tuNgay: h.tuNgay!, denNgay: h.denNgay! }) })),
    } : null,
    sdtNhanHoaDon: cheSdt(don.khach?.sdt || ""),
    hotline: ck.hotline,
    hetHanLinkLuc: don.hetHanLinkLuc || null,
  };
}

/** Tiền về (webhook ngân hàng, giả lập, hoặc thu tay). Mỗi mã giao dịch chỉ xử lý một lần. */
export async function nhanTien(payload: Payload, g: GiaoDichVao & { hinhThuc?: "chuyenKhoan" | "tienMat"; maDon?: string }) {
  if (!g.maGiaoDich) throw new LoiNguoiDung("Thiếu mã giao dịch.", 400, "THIEU_MA_GIAO_DICH");
  const daCo = (await payload.find({ collection: "giao-dich", where: { maGiaoDich: { equals: g.maGiaoDich } }, limit: 1, overrideAccess: true })).docs[0];
  if (daCo) return { ketQua: "daXuLy" as const, maGiaoDich: g.maGiaoDich };
  const maDon = g.maDon || timMaTrongNoiDung(g.noiDung);
  const ghi = (ketQua: string, donHang?: number) => payload.create({
    collection: "giao-dich", overrideAccess: true,
    data: { maGiaoDich: g.maGiaoDich, soTien: g.soTien, noiDung: g.noiDung, luc: g.luc, nguon: g.nguon, hinhThuc: g.hinhThuc || "chuyenKhoan", donHang, ketQua: ketQua as "du" },
  });
  if (maDon?.startsWith("HV-")) {
    // Tiền gói hội viên
    const kq = await nhanTienHoiVien(payload, maDon, g);
    await payload.create({
      collection: "giao-dich", overrideAccess: true,
      data: { maGiaoDich: g.maGiaoDich, soTien: g.soTien, noiDung: g.noiDung, luc: g.luc, nguon: g.nguon, hinhThuc: g.hinhThuc || "chuyenKhoan", hoiVien: kq.hv?.id, ketQua: kq.ketQua },
    });
    return { ketQua: kq.ketQua, maGiaoDich: g.maGiaoDich, maDon, ...(kq.hv ? { trangThai: kq.hv.trangThai, hetHan: kq.hv.hetHanLuc ?? null } : {}) };
  }
  if (!maDon || !maDon.startsWith("TT-")) {
    // Không nhận ra mã: ghi lại để kế toán đối soát tay
    await ghi("khongThayDon");
    return { ketQua: "khongThayDon" as const, maGiaoDich: g.maGiaoDich, maDon };
  }
  const don = (await payload.find({ collection: "don-hang", where: { ma: { equals: maDon } }, limit: 1, overrideAccess: true })).docs[0];
  if (!don) {
    await ghi("khongThayDon");
    return { ketQua: "khongThayDon" as const, maGiaoDich: g.maGiaoDich, maDon };
  }
  if (don.thanhToan?.trangThai === "daThanhToan") {
    await ghi("trung", don.id);
    return { ketQua: "trung" as const, maGiaoDich: g.maGiaoDich, maDon };
  }
  const daNhan = (don.thanhToan?.daNhan || 0) + g.soTien;
  const du = Boolean(don.thanhToan?.soTien) && daNhan >= (don.thanhToan?.soTien || 0);
  await ghi(du ? "du" : "thieu", don.id);
  await ghiTruong(payload, "don-hang", don.id, {
    thanhToan: { daNhan, maGiaoDich: g.maGiaoDich, hinhThuc: g.hinhThuc || "chuyenKhoan", trangThai: du ? "daThanhToan" : don.thanhToan?.soTien ? "thieu" : "chuaTinh" },
  });
  if (du) await hoanTatThanhToan(payload, don.id, { maGiaoDich: g.maGiaoDich, hinhThuc: g.hinhThuc || "chuyenKhoan", luc: g.luc });
  return { ketQua: du ? ("du" as const) : ("thieu" as const), maGiaoDich: g.maGiaoDich, maDon, daNhan, canTra: don.thanhToan?.soTien ?? null };
}

/** Đủ tiền: đơn hoàn thành, xuất hoá đơn điện tử, tạo phiếu bảo hành, nhắn khách. */
export async function hoanTatThanhToan(payload: Payload, donId: number, p: { maGiaoDich: string; hinhThuc: string; luc?: string }) {
  let don = await payload.findByID({ collection: "don-hang", id: donId, depth: 1, overrideAccess: true });
  const luc = p.luc || new Date().toISOString();
  don = await payload.update({
    collection: "don-hang", id: donId, overrideAccess: true, depth: 1,
    data: {
      trangThai: "hoanThanh",
      thanhToan: { ...(don.thanhToan || {}), trangThai: "daThanhToan", thanhToanLuc: luc, maGiaoDich: p.maGiaoDich, hinhThuc: p.hinhThuc },
    },
    context: { ghiChuTrangThai: "Đã nhận đủ tiền" },
  });
  const dong = (don.thanhToan?.chiTiet || []) as { ten: string; soTien: number; loai: string }[];
  // Hoá đơn điện tử
  try {
    const hd = await hoaDon.xuat({
      maDon: don.ma!, dong, tong: don.thanhToan?.soTien || 0, hinhThuc: p.hinhThuc,
      nguoiMua: {
        ten: don.khach?.hoTen || undefined, sdt: don.khach?.sdt,
        congTy: don.hoaDon?.can ? { mst: don.hoaDon.mst || "", ten: don.hoaDon.tenCongTy || "", diaChi: don.hoaDon.diaChi || "", email: don.hoaDon.email || "" } : null,
      },
    });
    await ghiTruong(payload, "don-hang", donId, { hoaDonDienTu: { ...hd, xuatLuc: new Date().toISOString(), loi: null } });
  } catch (e) {
    payload.logger.error({ err: e, msg: `Không xuất được hoá đơn đơn ${don.ma}` });
    await ghiTruong(payload, "don-hang", donId, { hoaDonDienTu: { loi: (e as Error).message } });
  }
  // Phiếu bảo hành (đơn có sửa; từ chối báo giá thì không)
  let maBaoHanh = "";
  if (don.ketQua !== "tuChoiBaoGia") {
    const phi = await payload.findGlobal({ slug: "bang-gia-chung", depth: 0 });
    const bgs = (await payload.find({ collection: "bao-gia", where: { and: [{ donHang: { equals: donId } }, { trangThai: { equals: "daDuyet" } }] }, limit: 50, overrideAccess: true })).docs;
    const lam = bgs.flatMap((b) => (chonHangMuc((b.hangMuc || []) as never, b.ketQua?.boHangMuc || []) as { chon: { ten: string; loai: string; baoHanhThang?: number | null }[] }).chon);
    const hm = hangMucBaoHanh(lam.map((h) => ({ ...h, baoHanhThang: h.baoHanhThang ?? undefined })), { tuNgay: luc, thangPhuTung: phi.baoHanhPhuTungThang ?? 6, thangCong: phi.baoHanhCongThang ?? 3 });
    if (hm.length) {
      const bh = await payload.create({
        collection: "phieu-bao-hanh", overrideAccess: true,
        data: { ma: await maTiepTheo(payload, "BH"), donHang: donId, bienSo: don.xe?.bienSo || undefined, hangMuc: hm as never },
      });
      maBaoHanh = bh.ma || "";
      await ghiTruong(payload, "don-hang", donId, { phieuBaoHanh: bh.id });
    }
  }
  void guiTinDon(payload, donId, "hoanThanh", { maBaoHanh });
  // Đơn đầu của bạn được giới thiệu đã xong: người giới thiệu được thêm 1 lượt
  if (don.gioiThieu && don.gioiThieuApDung) {
    void baoThuongGioiThieu(payload, typeof don.gioiThieu === "object" ? don.gioiThieu.id : don.gioiThieu, (don.khach?.hoTen || "bạn bè").split(/\s+/).pop()!);
  }
  return payload.findByID({ collection: "don-hang", id: donId, depth: 1, overrideAccess: true });
}

/** Khách bấm "Gửi hoá đơn qua Zalo" / "Gửi email". */
export async function guiLaiHoaDon(payload: Payload, token: string, p: { kenh?: string; email?: string }) {
  const don = await donTheoLink(payload, token);
  if (!don.hoaDonDienTu?.so) throw new LoiNguoiDung("Hoá đơn chưa xuất xong, thử lại sau ít phút.", 409, "CHUA_CO_HOA_DON");
  if (p.kenh === "email") {
    const email = String(p.email || don.hoaDon?.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new LoiNguoiDung("Email chưa đúng.", 400, "EMAIL_SAI");
    await payload.sendEmail({
      to: email,
      subject: `Hoá đơn điện tử đơn ${don.ma} – ThợTới`,
      text: `Hoá đơn số ${don.hoaDonDienTu.so}, ký hiệu ${don.hoaDonDienTu.kyHieu}. ${don.hoaDonDienTu.linkPdf || don.hoaDonDienTu.linkXem || ""}`,
    });
    return { daGui: "email", toi: email.replace(/^(.).*(@.*)$/, "$1***$2") };
  }
  const kenh = await guiTinDon(payload, don.id, "hoaDon");
  if (!kenh) throw new LoiNguoiDung("Chưa gửi được, vui lòng thử lại hoặc gọi hotline.", 502, "GUI_TIN_LOI");
  return { daGui: kenh, toi: cheSdt(don.khach?.sdt || "") };
}
