// Tra cứu lịch sử xe (TraCuuXe): biển số → mã 6 số qua Zalo (dự phòng SMS) tới số đã dùng khi đặt sửa xe đó →
// phiên xem 30 phút (tự gia hạn khi còn dùng). Không biết số điện thoại chủ xe thì không xem được.
import crypto from "node:crypto";
import type { Payload } from "payload";
import site from "../site.config.mjs";
import { chuanHoaBienSo } from "./bien-so.mjs";
import { conLai, mocBaoDuong } from "./bao-hanh.mjs";
import { LoiNguoiDung } from "./cong-khai";
import { cheSdt } from "./so-dien-thoai.mjs";
import { dinhDangTien } from "./tinh-gia.mjs";
import { thongBao } from "./tich-hop/thong-bao";
import { hoiVienCuaXe, tomTatHoiVien } from "./hoi-vien";

export const TRA_CUU = { hanMaPhut: 5, guiLaiSauGiay: 45, soLanThuToiDa: 5, phienPhut: 30 };
const bam = (s: string) => crypto.createHash("sha256").update(`${process.env.PAYLOAD_SECRET || ""}:${s}`).digest("hex");

async function donCuaXe(payload: Payload, bienSo: string) {
  return (await payload.find({
    collection: "don-hang", overrideAccess: true, limit: 200, depth: 2, sort: "-createdAt",
    where: { and: [{ "xe.bienSo": { equals: bienSo } }, { trangThai: { not_equals: "huy" } }] },
  })).docs;
}

export async function guiMaTraCuu(payload: Payload, p: { bienSo: string; kenh?: string }) {
  const bienSo = chuanHoaBienSo(p.bienSo);
  if (!bienSo) throw new LoiNguoiDung("Biển số chưa đúng, ví dụ 30A-123.45.", 400, "BIEN_SO_SAI");
  const don = await donCuaXe(payload, bienSo);
  const sdt = don.find((d) => d.khach?.sdt)?.khach?.sdt;
  if (!sdt) throw new LoiNguoiDung("Chưa có lịch sử sửa nào cho biển số này ở ThợTới.", 404, "CHUA_CO_LICH_SU");
  const gan = (await payload.find({ collection: "ma-xac-nhan", where: { bienSo: { equals: bienSo } }, sort: "-guiLuc", limit: 1, overrideAccess: true })).docs[0];
  if (gan?.guiLuc && Date.now() - new Date(gan.guiLuc).getTime() < TRA_CUU.guiLaiSauGiay * 1000) {
    const con = Math.ceil((TRA_CUU.guiLaiSauGiay * 1000 - (Date.now() - new Date(gan.guiLuc).getTime())) / 1000);
    throw new LoiNguoiDung(`Vui lòng chờ ${con} giây rồi gửi lại mã.`, 429, "GUI_LAI_QUA_NHANH", { guiLaiSauGiay: con });
  }
  const ma = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const kenhMuon = p.kenh === "sms" ? "sms" : "zalo";
  const kenh = await thongBao.gui({
    loai: "maXacNhan", sdt, kenh: kenhMuon,
    duLieu: { ma_xac_nhan: ma, bien_so: bienSo, phut: String(TRA_CUU.hanMaPhut) },
    sms: `Ma tra cuu xe ${bienSo} tai ThoToi: ${ma}. Hieu luc ${TRA_CUU.hanMaPhut} phut. Khong chia se ma nay.`,
  });
  const guiLuc = new Date();
  await payload.create({
    collection: "ma-xac-nhan", overrideAccess: true,
    data: { bienSo, sdt, maBam: bam(`${bienSo}:${ma}`), kenh, guiLuc: guiLuc.toISOString(), hetHanLuc: new Date(guiLuc.getTime() + TRA_CUU.hanMaPhut * 60000).toISOString(), soLanThu: 0 },
  });
  return {
    bienSo, sdtChe: cheSdt(sdt), kenh, hetHanPhut: TRA_CUU.hanMaPhut, guiLaiSauGiay: TRA_CUU.guiLaiSauGiay,
    // Chỉ khi tin nhắn đang giả lập (máy chạy thử): trả mã để chạy thử, kiểm thử. Gửi thật thì không bao giờ có.
    ...(thongBao.dangGiaLap() ? { maGiaLap: ma } : {}),
  };
}

export async function xacNhanMa(payload: Payload, p: { bienSo: string; ma: string }) {
  const bienSo = chuanHoaBienSo(p.bienSo);
  if (!bienSo || !/^\d{6}$/.test(String(p.ma || ""))) throw new LoiNguoiDung("Nhập đủ biển số và mã 6 số.", 400, "DU_LIEU_SAI");
  const ban = (await payload.find({ collection: "ma-xac-nhan", where: { and: [{ bienSo: { equals: bienSo } }, { daDung: { not_equals: true } }] }, sort: "-guiLuc", limit: 1, overrideAccess: true })).docs[0];
  if (!ban || !ban.hetHanLuc || new Date(ban.hetHanLuc).getTime() < Date.now()) throw new LoiNguoiDung("Mã đã hết hạn, bấm gửi lại mã.", 410, "MA_HET_HAN");
  if ((ban.soLanThu || 0) >= TRA_CUU.soLanThuToiDa) throw new LoiNguoiDung("Nhập sai quá nhiều lần, bấm gửi lại mã mới.", 429, "SAI_QUA_NHIEU");
  if (ban.maBam !== bam(`${bienSo}:${p.ma}`)) {
    await payload.update({ collection: "ma-xac-nhan", id: ban.id, overrideAccess: true, data: { soLanThu: (ban.soLanThu || 0) + 1 } });
    const con = TRA_CUU.soLanThuToiDa - (ban.soLanThu || 0) - 1;
    throw new LoiNguoiDung(`Mã chưa đúng, còn ${con} lần thử.`, 400, "MA_SAI", { conLanThu: con });
  }
  const phien = crypto.randomBytes(24).toString("base64url");
  await payload.update({
    collection: "ma-xac-nhan", id: ban.id, overrideAccess: true,
    data: { daDung: true, phienBam: bam(phien), phienHetHanLuc: new Date(Date.now() + TRA_CUU.phienPhut * 60000).toISOString() },
  });
  return { phien, hetHanPhut: TRA_CUU.phienPhut };
}

async function timPhien(payload: Payload, phien: string) {
  if (!phien) throw new LoiNguoiDung("Phiên xem đã đóng, nhập lại biển số.", 401, "HET_PHIEN");
  const ban = (await payload.find({ collection: "ma-xac-nhan", where: { phienBam: { equals: bam(phien) } }, limit: 1, overrideAccess: true })).docs[0];
  if (!ban || !ban.phienHetHanLuc || new Date(ban.phienHetHanLuc).getTime() < Date.now()) throw new LoiNguoiDung("Phiên xem đã đóng sau 30 phút không dùng. Nhập lại biển số.", 401, "HET_PHIEN");
  return ban;
}

export async function lichSuXe(payload: Payload, phien: string) {
  const ban = await timPhien(payload, phien);
  // Còn dùng thì gia hạn 30 phút
  await payload.update({ collection: "ma-xac-nhan", id: ban.id, overrideAccess: true, data: { phienHetHanLuc: new Date(Date.now() + TRA_CUU.phienPhut * 60000).toISOString() } });
  const don = (await donCuaXe(payload, ban.bienSo!)).filter((d) => d.trangThai === "hoanThanh");
  const phi = await payload.findGlobal({ slug: "bang-gia-chung", depth: 0 });
  const tatCa = await donCuaXe(payload, ban.bienSo!);
  const xe = tatCa[0]?.xe;
  const kmGanNhat = don.map((d) => d.soKmKhiXong ?? d.xe?.soKm).find((x) => typeof x === "number") ?? null;
  const lanBaoDuong = don.find((d) => (d.dichVu || []).some((x) => typeof x === "object" && x.slug === "bao-duong-dinh-ky"));
  const baoHanh = don.flatMap((d) => {
    const bh = typeof d.phieuBaoHanh === "object" && d.phieuBaoHanh ? d.phieuBaoHanh : null;
    return (bh?.hangMuc || []).map((h) => ({ ten: h.ten, maDon: d.ma, maPhieu: bh!.ma, tuNgay: h.tuNgay, denNgay: h.denNgay, ...conLai({ tuNgay: h.tuNgay!, denNgay: h.denNgay! }) }));
  }).sort((a, b) => b.conNgay - a.conNgay);
  const moc = mocBaoDuong({
    kmGanNhat, lanBaoDuongCuoi: lanBaoDuong ? { ngay: lanBaoDuong.ketThucLuc || lanBaoDuong.createdAt, km: lanBaoDuong.soKmKhiXong ?? lanBaoDuong.xe?.soKm } : null,
    chuKyKm: phi.chuKyBaoDuongKm ?? 5000, chuKyThang: phi.chuKyBaoDuongThang ?? 6,
  });
  const hv = await hoiVienCuaXe(payload, ban.bienSo);
  return {
    xe: { ten: xe?.tenXe || null, doi: xe?.doi ?? null, bienSo: ban.bienSo },
    kmGanNhat,
    soLanSua: don.length,
    soConBaoHanh: new Set(baoHanh.filter((b) => !b.hetHan).map((b) => b.maDon)).size,
    baoDuongTiepTheo: { ...moc, datLich: `${site.url}/dat-lich/?dv=bao-duong-dinh-ky` },
    baoHanh,
    lichSu: don.map((d) => {
      const tho = typeof d.tho === "object" && d.tho ? d.tho.ten : null;
      return {
        ngay: d.ketThucLuc || d.createdAt, ma: d.ma,
        viec: (d.dichVu || []).map((x) => (typeof x === "object" ? x.ten : "")).filter(Boolean).join(", "),
        tho, km: d.soKmKhiXong ?? d.xe?.soKm ?? null,
        soTien: d.thanhToan?.daNhan ?? null, soTienHienThi: d.thanhToan?.daNhan ? dinhDangTien(d.thanhToan.daNhan) : null,
        hoaDon: d.hoaDonDienTu?.so ? { so: d.hoaDonDienTu.so, linkPdf: d.hoaDonDienTu.linkPdf || null } : null,
      };
    }),
    hoiVien: hv ? await tomTatHoiVien(payload, hv) : null,
    phienHetHanPhut: TRA_CUU.phienPhut,
  };
}

export async function thoatTraCuu(payload: Payload, phien: string) {
  const ban = await timPhien(payload, phien).catch(() => null);
  if (ban) await payload.update({ collection: "ma-xac-nhan", id: ban.id, overrideAccess: true, data: { phienHetHanLuc: new Date().toISOString() } });
  return { ok: true };
}
