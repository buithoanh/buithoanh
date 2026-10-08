// Giới thiệu bạn bè (thiết kế HoiVien, phần dưới): mỗi số điện thoại khách một mã (TUAN2481), link ?ma= tự điền mã vào form.
// - Bạn mới đặt đơn đầu qua mã: miễn phí đi lại đơn đó.
// - Đơn của bạn mới hoàn thành và đã thanh toán (hoặc bạn mới mua gói hội viên): người giới thiệu được 1 lượt miễn phí đi lại,
//   tự trừ vào đơn kế tiếp của họ.
// Số đơn, lượt thưởng, lượt đã dùng đều tính từ đơn hàng và hội viên, không lưu bộ đếm (không lệch khi đơn bị huỷ, sửa tay).
import crypto from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import site from "../site.config.mjs";
import type { DonHang, MaGioiThieu } from "../payload-types";
import { LoiNguoiDung } from "./cong-khai";
import { ghiNhan } from "./gioi-han.mjs";
import { MA_GIOI_THIEU, taoMaGioiThieu } from "./quyen-loi.mjs";
import { cheSdt, chuanHoaSdt } from "./so-dien-thoai.mjs";
import { dinhDangTien } from "./tinh-gia.mjs";
import { thongBao } from "./tich-hop/thong-bao";
import { guiTin } from "./don/tin-nhan";

type Drizzle = { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> };

export const chuanMaGioiThieu = (ma: unknown) => String(ma || "").toUpperCase().replace(/\s+/g, "").slice(0, 20);
export const linkGioiThieu = (ma: string) => `${site.url}/?ma=${encodeURIComponent(ma)}`;
const linkXem = (token: string) => `${site.url}/gioi-thieu/${token}/`;

export async function timMaGioiThieu(payload: Payload, ma: string) {
  const m = chuanMaGioiThieu(ma);
  if (!MA_GIOI_THIEU.test(m)) return null;
  return (await payload.find({ collection: "ma-gioi-thieu", where: { ma: { equals: m } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] || null;
}

/** Số đơn chưa huỷ của một số điện thoại (trừ đơn đang xét). */
async function soDonCuaSdt(payload: Payload, sdt: string, truDon?: number) {
  const and: object[] = [{ "khach.sdt": { equals: sdt } }, { trangThai: { not_equals: "huy" } }];
  if (truDon) and.push({ id: { not_equals: truDon } });
  return (await payload.count({ collection: "don-hang", where: { and } as never, overrideAccess: true })).totalDocs;
}

/**
 * Mã có áp cho khách này không: mã còn dùng, không phải mã của chính mình, đây là đơn đầu (chưa có đơn nào chưa huỷ).
 * @returns hopLe=false kèm lyDo khi mã có thật nhưng không áp được.
 */
export async function kiemTraMaGioiThieu(payload: Payload, ma: string, sdt?: string | null) {
  const doc = await timMaGioiThieu(payload, ma);
  if (!doc || doc.tamDung) return { hopLe: false as const, ma: "KHONG_CO", lyDo: "Mã giới thiệu không đúng. Kiểm tra lại chữ và số." };
  const s = sdt ? chuanHoaSdt(sdt) : null;
  if (s && s === doc.sdt) return { hopLe: false as const, ma: "MA_CUA_BAN", lyDo: "Đây là mã giới thiệu của chính bạn, gửi cho bạn bè để nhận thưởng nhé." };
  if (s && (await soDonCuaSdt(payload, s)) > 0) {
    return { hopLe: false as const, ma: "KHONG_PHAI_DON_DAU", lyDo: "Ưu đãi giới thiệu chỉ áp cho đơn đầu tiên. Bạn có thể lấy mã của riêng mình để giới thiệu bạn bè." };
  }
  const phi = (await payload.findGlobal({ slug: "bang-gia-chung", depth: 0 })).phiDiLai ?? 0;
  return {
    hopLe: true as const, id: doc.id, ma: doc.ma, loai: "gioiThieu" as const,
    moTa: `Miễn phí đi lại đơn đầu tiên (tiết kiệm ${dinhDangTien(phi)}), mã giới thiệu của bạn bè`,
  };
}

/** Lấy mã của số điện thoại, chưa có thì tạo (mã không trùng, token xem riêng). */
export async function maCuaSdt(payload: Payload, sdt: string, hoTen = "") {
  const daCo = (await payload.find({ collection: "ma-gioi-thieu", where: { sdt: { equals: sdt } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0];
  if (daCo) return daCo;
  for (let lan = 0; lan < 20; lan++) {
    const ma = taoMaGioiThieu(hoTen, crypto.randomInt(0, 10000));
    if (await timMaGioiThieu(payload, ma)) continue;
    try {
      return await payload.create({ collection: "ma-gioi-thieu", overrideAccess: true, data: { ma, sdt, hoTen: hoTen || undefined, token: crypto.randomBytes(24).toString("base64url") } });
    } catch (e) {
      // Hai yêu cầu cùng lúc cho một số: lấy bản đã tạo
      const vuaTao = (await payload.find({ collection: "ma-gioi-thieu", where: { sdt: { equals: sdt } }, limit: 1, overrideAccess: true })).docs[0];
      if (vuaTao) return vuaTao;
      if (lan === 19) throw e;
    }
  }
  throw new Error("Không tạo được mã giới thiệu.");
}

/**
 * "Nhận mã qua Zalo": số đã từng đặt thợ hoặc mua gói thì gửi mã + link xem lượt thưởng qua Zalo.
 * Trả lời giống nhau dù số có là khách hay không (không để dò ai là khách).
 */
export async function guiMaGioiThieu(payload: Payload, sdtVao: unknown) {
  const sdt = chuanHoaSdt(sdtVao);
  if (!sdt) throw new LoiNguoiDung("Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).", 400, "DU_LIEU_SAI", { truong: { sdt: "Số điện thoại chưa đúng." } });
  const donCuoi = (await payload.find({ collection: "don-hang", where: { and: [{ "khach.sdt": { equals: sdt } }, { trangThai: { not_equals: "huy" } }] }, sort: "-createdAt", limit: 1, overrideAccess: true, depth: 0 })).docs[0];
  const hv = donCuoi ? null : (await payload.find({ collection: "hoi-vien", where: { sdt: { equals: sdt } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0];
  const traLoi = { daGui: true, sdtChe: cheSdt(sdt), thongBao: "Nếu số này đã đặt thợ ThợTới, mã giới thiệu sẽ tới Zalo trong vài giây." };
  if (!donCuoi && !hv) return { ...traLoi, ...(thongBao.dangGiaLap() ? { giaLap: null } : {}) };
  const doc = await maCuaSdt(payload, sdt, donCuoi?.khach?.hoTen || hv?.hoTen || "");
  const tk = await thongKe(payload, doc);
  await guiTin(payload, {
    loai: "maGioiThieu", sdt, lienQuan: doc.ma,
    duLieu: { ten_khach: doc.hoTen || "Quý khách", ma_gioi_thieu: doc.ma, link_chia_se: linkGioiThieu(doc.ma), link: linkXem(doc.token!), luot_con_lai: String(tk.luotConLai) },
    sms: `Ma gioi thieu ThoToi cua ban: ${doc.ma}. Gui ban be: ${linkGioiThieu(doc.ma)} . Xem luot thuong: ${linkXem(doc.token!)}`,
  });
  // Máy chạy thử: trả link xem để chạy thử luồng (gửi thật thì không bao giờ có)
  return { ...traLoi, ...(thongBao.dangGiaLap() ? { giaLap: { ma: doc.ma, token: doc.token, linkXem: linkXem(doc.token!) } } : {}) };
}

/** Lượt thưởng, lượt đã dùng của một mã. */
export async function thongKe(payload: Payload, doc: MaGioiThieu) {
  const [donBanBe, hvBanBe, daDung] = await Promise.all([
    payload.count({ collection: "don-hang", overrideAccess: true, where: { and: [{ gioiThieu: { equals: doc.id } }, { gioiThieuApDung: { equals: true } }, { trangThai: { equals: "hoanThanh" } }] } }),
    payload.count({ collection: "hoi-vien", overrideAccess: true, where: { and: [{ gioiThieu: { equals: doc.id } }, { trangThai: { in: ["hieuLuc", "hetHan"] } }] } }),
    payload.count({ collection: "don-hang", overrideAccess: true, where: { and: [{ "khach.sdt": { equals: doc.sdt } }, { "quyenLoi.mienDiLai": { equals: "luotGioiThieu" } }, { trangThai: { not_equals: "huy" } }] } }),
  ]);
  const luotDuocThuong = donBanBe.totalDocs + hvBanBe.totalDocs + (doc.luotThuongThem || 0);
  return {
    soLuotMo: doc.soLuotMo || 0,
    soDonHoanThanh: donBanBe.totalDocs,
    soGoiHoiVien: hvBanBe.totalDocs,
    luotDuocThuong,
    luotDaDung: daDung.totalDocs,
    luotConLai: Math.max(0, luotDuocThuong - daDung.totalDocs),
  };
}

/** Lượt thưởng còn lại của khách (người giới thiệu) khi tính tiền đơn của họ. Đơn đang tính không tính là đã dùng. */
export async function luotConLaiCuaSdt(payload: Payload, sdt: string | null | undefined, donDangTinh?: DonHang) {
  if (!sdt) return 0;
  const doc = (await payload.find({ collection: "ma-gioi-thieu", where: { sdt: { equals: sdt } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0];
  if (!doc || doc.tamDung) return 0;
  const tk = await thongKe(payload, doc);
  const daTinhChoDonNay = donDangTinh?.quyenLoi?.mienDiLai === "luotGioiThieu" && donDangTinh.trangThai !== "huy" ? 1 : 0;
  return tk.luotConLai + daTinhChoDonNay;
}

/** Màn "Mã giới thiệu của bạn" mở từ link trong tin Zalo. */
export async function xemGioiThieu(payload: Payload, token: string) {
  if (!/^[\w-]{20,64}$/.test(token)) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  const doc = (await payload.find({ collection: "ma-gioi-thieu", where: { token: { equals: token } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0];
  if (!doc) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  const phi = (await payload.findGlobal({ slug: "bang-gia-chung", depth: 0 })).phiDiLai ?? 0;
  return {
    hoTen: doc.hoTen || null,
    sdtChe: cheSdt(doc.sdt),
    ma: doc.ma,
    link: linkGioiThieu(doc.ma),
    tamDung: Boolean(doc.tamDung),
    thongKe: await thongKe(payload, doc),
    thuong: {
      banBe: { moTa: "Miễn phí đi lại đơn đầu tiên", tietKiem: phi, tietKiemHienThi: dinhDangTien(phi) },
      ban: { moTa: "1 lượt miễn phí đi lại mỗi bạn", tietKiem: phi, tietKiemHienThi: `${dinhDangTien(phi)}/lượt` },
    },
  };
}

/** Bạn bè mở link ?ma=: đếm 1 lượt mỗi trình duyệt (IP) mỗi mã trong 6 giờ. Không báo lỗi gì ra ngoài. */
export async function ghiLuotMo(payload: Payload, ma: string, ip: string) {
  const m = chuanMaGioiThieu(ma);
  if (!MA_GIOI_THIEU.test(m)) return { daGhi: false };
  if (ghiNhan(`gt-mo:${ip}:${m}`, { toiDa: 1, trongMs: 6 * 3600 * 1000 }).vuot) return { daGhi: false };
  const db = (payload.db as unknown as { drizzle: Drizzle }).drizzle;
  const r = await db.execute(sql`UPDATE ma_gioi_thieu SET so_luot_mo = COALESCE(so_luot_mo, 0) + 1 WHERE ma = ${m} AND tam_dung IS NOT TRUE RETURNING id`);
  return { daGhi: r.rows.length > 0 };
}

/** Đơn của bạn mới vừa thanh toán xong (hoặc bạn mới mua gói): báo người giới thiệu được thêm lượt. */
export async function baoThuongGioiThieu(payload: Payload, gioiThieuId: number | null | undefined, banMoi: string) {
  if (!gioiThieuId) return;
  const doc = await payload.findByID({ collection: "ma-gioi-thieu", id: gioiThieuId, overrideAccess: true, depth: 0 }).catch(() => null);
  if (!doc) return;
  const tk = await thongKe(payload, doc);
  await guiTin(payload, {
    loai: "gioiThieuThuong", sdt: doc.sdt, lienQuan: doc.ma,
    duLieu: { ten_khach: doc.hoTen || "Quý khách", ban_be: banMoi, luot_con_lai: String(tk.luotConLai), link: linkXem(doc.token!) },
    sms: `ThoToi: ban be (${banMoi}) da dung ma ${doc.ma}. Ban duoc them 1 luot mien phi di lai, con ${tk.luotConLai} luot.`,
  });
}
