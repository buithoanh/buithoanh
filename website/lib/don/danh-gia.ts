// Đánh giá sau dịch vụ (DanhGia): link dùng một lần, gửi 24 giờ sau khi xong.
// 4–5 sao: mời viết trên Google. 1–3 sao: chọn vấn đề, mô tả → phiếu khiếu nại KN-xxxxxx chuyển CSKH, không đăng công khai.
import crypto from "node:crypto";
import type { Payload } from "payload";
import type { Tho } from "../../payload-types";
import { LoiNguoiDung } from "../cong-khai";
import { maTiepTheo } from "../ma-so";
import { chuanHoaSdt } from "../so-dien-thoai.mjs";
import { thongBao } from "../tich-hop/thong-bao";
import { guiTinDon } from "./tin-nhan";
import { ghiTruong } from "../ghi-truong";
import { thoChoKhach } from "./phuc-vu";

export const VAN_DE = ["tre", "thaido", "gia", "chatluong", "vesinh", "khac"] as const;
const GIO_GUI_SAU_XONG = 24;

async function donTheoTokenDanhGia(payload: Payload, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  const don = (await payload.find({ collection: "don-hang", where: { "danhGia.token": { equals: token } }, limit: 1, depth: 1, overrideAccess: true })).docs[0];
  if (!don) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  return don;
}

/** Việc định kỳ: gửi link đánh giá cho đơn đã xong hơn 24 giờ mà chưa gửi. */
export async function guiLinkDanhGiaDenHan(payload: Payload, bayGio = new Date()) {
  const truoc = new Date(bayGio.getTime() - GIO_GUI_SAU_XONG * 3600 * 1000).toISOString();
  const { docs } = await payload.find({
    collection: "don-hang", overrideAccess: true, limit: 200, depth: 0,
    where: { and: [{ trangThai: { equals: "hoanThanh" } }, { ketThucLuc: { less_than_equal: truoc } }, { "danhGia.guiLuc": { exists: false } }, { ketQua: { not_equals: "tuChoiBaoGia" } }] },
  });
  for (const d of docs) {
    const token = crypto.randomBytes(24).toString("base64url");
    await ghiTruong(payload, "don-hang", d.id, { danhGia: { token, guiLuc: new Date().toISOString() } });
    await guiTinDon(payload, d.id, "danhGia", { token });
  }
  return docs.length;
}

export async function xemDanhGia(payload: Payload, token: string) {
  const don = await donTheoTokenDanhGia(payload, token);
  const c = await payload.findGlobal({ slug: "cai-dat", depth: 0 });
  return {
    ma: don.ma,
    daDanhGia: Boolean(don.danhGia?.luc),
    xe: { ten: don.xe?.tenXe || null, doi: don.xe?.doi ?? null, bienSo: don.xe?.bienSo || null },
    tho: thoChoKhach(don.tho as Tho),
    dichVu: (don.dichVu || []).map((d) => (typeof d === "object" ? d.ten : "")).filter(Boolean),
    ngay: don.ketThucLuc || don.xongLuc || null,
    noiLam: [don.viTri?.diaChi, typeof don.viTri?.quan === "object" ? don.viTri?.quan?.ten : null].filter(Boolean).join(", "),
    vanDe: [
      { ma: "tre", nhan: "Thợ đến trễ" }, { ma: "thaido", nhan: "Thái độ thợ" }, { ma: "gia", nhan: "Giá cao hơn báo" },
      { ma: "chatluong", nhan: "Sửa chưa hết lỗi" }, { ma: "vesinh", nhan: "Để bẩn xe, chỗ đỗ" }, { ma: "khac", nhan: "Vấn đề khác" },
    ],
    linkGoogle: c.googleDanhGiaUrl || null,
    hotline: c.hotline || "",
  };
}

export async function guiDanhGia(payload: Payload, token: string, p: { soSao: number; vanDe?: string[]; moTa?: string; sdtGoiLai?: string }) {
  const don = await donTheoTokenDanhGia(payload, token);
  if (don.danhGia?.luc) throw new LoiNguoiDung("Link đánh giá chỉ dùng một lần, bạn đã đánh giá đơn này rồi.", 409, "DA_DANH_GIA");
  const soSao = Number(p.soSao);
  if (!Number.isInteger(soSao) || soSao < 1 || soSao > 5) throw new LoiNguoiDung("Chọn từ 1 đến 5 sao.", 400, "SO_SAO_SAI");
  const luc = new Date().toISOString();
  await ghiTruong(payload, "don-hang", don.id, { danhGia: { luc, soSao } });
  await congDiemTho(payload, don.tho, soSao);
  const c = await payload.findGlobal({ slug: "cai-dat", depth: 0 });
  const moTa = String(p.moTa || "").trim().slice(0, 2000);
  if (soSao >= 4) {
    // Lời khen có chữ: lưu lại, marketing duyệt rồi mới hiện trên web
    if (moTa && don.viTri?.quan) {
      await payload.create({
        collection: "danh-gia", overrideAccess: true,
        data: {
          noiDung: moTa, tenHienThi: (don.khach?.hoTen || "Khách").split(/\s+/).pop() + ".", soSao, ngay: luc,
          quan: typeof don.viTri.quan === "object" ? don.viTri.quan.id : don.viTri.quan, phuong: don.viTri.phuong || undefined,
          dichVu: (don.dichVu || []).map((x) => (typeof x === "object" ? x.id : x))[0], nguon: "web", donHang: don.id, hienThi: false,
        },
      });
    }
    return { soSao, ketQua: "camOn", linkGoogle: c.googleDanhGiaUrl || null };
  }
  const vanDe = (p.vanDe || []).filter((v) => (VAN_DE as readonly string[]).includes(v));
  const sdt = chuanHoaSdt(p.sdtGoiLai) || don.khach?.sdt || "";
  const gio = c.cskhGoiLaiGio ?? 2;
  const kn = await payload.create({
    collection: "khieu-nai", overrideAccess: true,
    data: {
      ma: await maTiepTheo(payload, "KN"), donHang: don.id, soSao, vanDe: vanDe as never, moTa, sdtGoiLai: sdt,
      trangThai: "moi", hanGoiLai: new Date(Date.now() + gio * 3600 * 1000).toISOString(),
    },
  });
  await thongBao.nhanNoiBo(c.sdtCskh, `KHIEU NAI ${kn.ma} don ${don.ma}: ${soSao} sao. Goi lai ${sdt} trong ${gio} gio.`)
    .catch((e) => payload.logger.error({ err: e, msg: "Không nhắn được CSKH" }));
  return { soSao, ketQua: "khieuNai", maPhieu: kn.ma, maDon: don.ma, vanDe, guiLuc: luc, cskh: c.tenCskh || null, goiLaiTrongGio: gio, hanGoiLai: kn.hanGoiLai };
}

/** Điểm sao của thợ = trung bình các đơn khách đã chấm. */
/**
 * Cộng một đánh giá vào điểm của thợ. Không tính lại từ đầu theo đơn trên web: điểm và số đánh giá ban đầu
 * mang sang từ điều phối (thợ đã làm hàng trăm đơn trước khi có web), tính lại sẽ xoá mất.
 */
export async function congDiemTho(payload: Payload, tho: unknown, soSao: number) {
  const thoId = typeof tho === "object" && tho ? (tho as { id: number }).id : (tho as number | undefined);
  if (!thoId) return;
  const t = await payload.findByID({ collection: "tho", id: thoId, depth: 0, overrideAccess: true }).catch(() => null);
  if (!t) return;
  const n = t.soDanhGia || 0;
  const tb = n && t.diemSao != null ? (t.diemSao * n + soSao) / (n + 1) : soSao;
  await payload.update({ collection: "tho", id: thoId, overrideAccess: true, data: { diemSao: Math.round(tb * 100) / 100, soDanhGia: n + 1 } });
}
