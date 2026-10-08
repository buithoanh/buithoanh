// Hội viên (thiết kế HoiVien): gói năm gắn 1 biển số, hiệu lực 12 tháng kể từ khi thanh toán VietQR (nội dung HV000123).
// Quyền lợi chép từ gói lúc đăng ký, tự áp vào đơn của biển số đó khi thợ bấm xong (lib/don/phuc-vu.ts → tinhThanhToan).
import crypto from "node:crypto";
import type { Payload } from "payload";
import site from "../site.config.mjs";
import type { GoiHoiVien, HoiVien } from "../payload-types";
import { LoiNguoiDung, layPhiChung } from "./cong-khai";
import { bangSoSanh, conLuot, giaMoiThang, hieuLucMoi } from "./quyen-loi.mjs";
import { kiemTraDangKyHoiVien } from "./p2-dau-vao.mjs";
import { maTiepTheo } from "./ma-so";
import { cheSdt } from "./so-dien-thoai.mjs";
import { dinhDangTien } from "./tinh-gia.mjs";
import { guiTin } from "./don/tin-nhan";
import { baoThuongGioiThieu, kiemTraMaGioiThieu, timMaGioiThieu } from "./gioi-thieu";

type Luot = { kieu?: string | null; soLan?: number | null } | null | undefined;
/** Nhóm "Mức" trong admin → số lần/năm: null = không giới hạn, 0 = không có. */
const soLanCua = (l: Luot) => (l?.kieu === "khongGioiHan" ? null : l?.kieu === "soLan" ? Math.max(0, l.soLan || 0) : 0);

export function quyenLoiCuaGoi(g: GoiHoiVien) {
  return {
    mienDiLaiSoLan: soLanCua(g.mienDiLai), mienKichNoSoLan: soLanCua(g.mienKichNo), mienVaLopSoLan: soLanCua(g.mienVaLop),
    giamCongPhanTram: g.giamCongPhanTram || 0, uuTienGoiGap: Boolean(g.uuTienGoiGap),
  };
}

/** Quyền lợi đã chép vào đăng ký (số lần null = không giới hạn). */
const quyenLoiDaMua = (hv: HoiVien) => ({
  ten: tenNgan(hv.tenGoi || ""),
  mienDiLaiSoLan: hv.quyenLoi?.mienDiLaiSoLan ?? null, mienKichNoSoLan: hv.quyenLoi?.mienKichNoSoLan ?? null, mienVaLopSoLan: hv.quyenLoi?.mienVaLopSoLan ?? null,
  giamCongPhanTram: hv.quyenLoi?.giamCongPhanTram || 0, uuTienGoiGap: Boolean(hv.quyenLoi?.uuTienGoiGap),
});

const tenNgan = (ten: string) => ten.replace(/^Gói\s+/i, "");
export const linkThanhToanHoiVien = (token: string) => `${site.url}/hoi-vien/thanh-toan/${token}/`;

async function hangMucQuyenLoi(payload: Payload, loai: "kichNo" | "vaLop") {
  const h = (await payload.find({ collection: "hang-muc-gia", where: { quyenLoiHoiVien: { equals: loai } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
  return h ? { ten: h.tenNgan || h.ten, gia: h.gia ?? 0 } : null;
}

/** Dữ liệu màn HoiVien: 2 gói, bảng so sánh, thưởng giới thiệu. Trang server gọi thẳng hàm này. */
export async function layTrangHoiVien(payload: Payload) {
  const [goi, phi, kichNo, vaLop, c] = await Promise.all([
    payload.find({ collection: "goi-hoi-vien", where: { dangBan: { equals: true } }, sort: "thuTu", limit: 10, depth: 0 }).then((r) => r.docs),
    layPhiChung(payload), hangMucQuyenLoi(payload, "kichNo"), hangMucQuyenLoi(payload, "vaLop"), payload.findGlobal({ slug: "cai-dat", depth: 0 }),
  ]);
  const ql = goi.map((g) => ({ ten: tenNgan(g.ten), ...quyenLoiCuaGoi(g) }));
  return {
    goi: goi.map((g, i) => ({
      slug: g.slug, ten: g.ten, nhan: g.nhan || null, loiIch: g.loiIch || null,
      giaNam: g.giaNam, giaNamHienThi: dinhDangTien(g.giaNam), giaThang: giaMoiThang(g.giaNam), giaThangHienThi: dinhDangTien(giaMoiThang(g.giaNam)),
      quyenLoi: ql[i],
    })),
    tenCot: ql.map((q) => q.ten),
    bangSoSanh: bangSoSanh(ql, { phiDiLai: phi.phiDiLai, kichNo, vaLop }),
    thoiHanThang: 12,
    gioiThieu: {
      banBe: { moTa: "Miễn phí đi lại đơn đầu tiên", tietKiem: phi.phiDiLai, tietKiemHienThi: dinhDangTien(phi.phiDiLai) },
      ban: { moTa: "1 lượt miễn phí đi lại mỗi bạn", tietKiem: phi.phiDiLai, tietKiemHienThi: `${dinhDangTien(phi.phiDiLai)}/lượt` },
    },
    hotline: c.hotline || "",
  };
}

/** Gói đang có hiệu lực của một biển số tại thời điểm `luc` (gia hạn sớm: bản mới bắt đầu khi bản cũ hết). */
export async function hoiVienCuaXe(payload: Payload, bienSo: string | null | undefined, luc = new Date()) {
  if (!bienSo) return null;
  const t = luc.toISOString();
  return (await payload.find({
    collection: "hoi-vien", overrideAccess: true, depth: 0, limit: 1, sort: "batDauLuc",
    where: { and: [{ bienSo: { equals: bienSo } }, { trangThai: { equals: "hieuLuc" } }, { batDauLuc: { less_than_equal: t } }, { hetHanLuc: { greater_than: t } }] },
  })).docs[0] || null;
}

/** Lượt quyền lợi đã dùng trong thời hạn gói (các đơn chưa huỷ có gắn gói, trừ đơn đang tính). */
export async function daDungQuyenLoi(payload: Payload, hoiVienId: number, truDon?: number) {
  const and: object[] = [{ hoiVien: { equals: hoiVienId } }, { trangThai: { not_equals: "huy" } }];
  if (truDon) and.push({ id: { not_equals: truDon } });
  const { docs } = await payload.find({ collection: "don-hang", overrideAccess: true, depth: 0, pagination: false, limit: 1000, where: { and } as never, select: { quyenLoi: true } });
  return {
    diLai: docs.filter((d) => d.quyenLoi?.mienDiLai === "hoiVien").length,
    kichNo: docs.reduce((a, d) => a + (d.quyenLoi?.kichNo || 0), 0),
    vaLop: docs.reduce((a, d) => a + (d.quyenLoi?.vaLop || 0), 0),
  };
}

/** Quyền lợi + lượt đã dùng, đúng dạng tinhThanhToan cần. */
export async function quyenLoiChoDon(payload: Payload, hv: HoiVien, donId?: number) {
  return { ...quyenLoiDaMua(hv), daDung: await daDungQuyenLoi(payload, hv.id, donId) };
}

/** Tóm tắt cho khách (tra cứu xe, theo dõi): gói, hạn, lượt còn lại. */
export async function tomTatHoiVien(payload: Payload, hv: HoiVien) {
  const q = quyenLoiDaMua(hv);
  const d = await daDungQuyenLoi(payload, hv.id);
  const con = (soLan: number | null, daDung: number) => (soLan === null ? null : conLuot(soLan, daDung));
  return {
    ma: hv.ma, goi: hv.tenGoi, bienSo: hv.bienSo, batDau: hv.batDauLuc, hetHan: hv.hetHanLuc,
    conLai: { diLai: con(q.mienDiLaiSoLan, d.diLai), kichNo: con(q.mienKichNoSoLan, d.kichNo), vaLop: con(q.mienVaLopSoLan, d.vaLop) },
    giamCongPhanTram: q.giamCongPhanTram, uuTienGoiGap: q.uuTienGoiGap,
    ghiChu: "null = không giới hạn",
  };
}

/** Form "Đăng ký mua gói": tạo HV-, gửi link thanh toán VietQR qua Zalo. Chưa trừ tiền. */
export async function dangKyHoiVien(payload: Payload, duLieuTho: Record<string, unknown>) {
  const kt = kiemTraDangKyHoiVien(duLieuTho);
  if (!kt.ok) throw new LoiNguoiDung("Thông tin đăng ký chưa đúng, xem từng ô.", 400, "DU_LIEU_SAI", { truong: kt.loi });
  const d = kt.duLieu as { goi: string; hoTen: string; sdt: string; bienSo: string; maGioiThieu: string };
  const goi = (await payload.find({ collection: "goi-hoi-vien", where: { and: [{ slug: { equals: d.goi } }, { dangBan: { equals: true } }] }, limit: 1, depth: 0 })).docs[0];
  if (!goi) throw new LoiNguoiDung("Gói này không còn bán, chọn gói khác.", 400, "GOI_KHONG_CO", { truong: { goi: "Chọn gói khác." } });
  // Mã giới thiệu: chỉ ghi nhận người giới thiệu khi người mua là khách mới (cùng luật với đơn đầu)
  let gioiThieu: number | undefined;
  let ketQuaMa: { apDung: boolean; lyDo?: string } | null = null;
  if (d.maGioiThieu) {
    const kq = await kiemTraMaGioiThieu(payload, d.maGioiThieu, d.sdt);
    if (kq.hopLe) gioiThieu = kq.id;
    else if (!(await timMaGioiThieu(payload, d.maGioiThieu))) throw new LoiNguoiDung(kq.lyDo, 409, "MA_GIOI_THIEU_KHONG_DUNG", { truong: { maGioiThieu: kq.lyDo } });
    ketQuaMa = kq.hopLe ? { apDung: true } : { apDung: false, lyDo: kq.lyDo };
  }
  const dangCo = await hoiVienCuaXe(payload, d.bienSo);
  const token = crypto.randomBytes(24).toString("base64url");
  const q = quyenLoiCuaGoi(goi);
  const hv = await payload.create({
    collection: "hoi-vien", overrideAccess: true,
    data: {
      ma: await maTiepTheo(payload, "HV"), bienSo: d.bienSo, goi: goi.id, tenGoi: goi.ten, hoTen: d.hoTen, sdt: d.sdt,
      maGioiThieu: d.maGioiThieu || undefined, gioiThieu, trangThai: "choThanhToan", token, dongYLuc: new Date().toISOString(),
      quyenLoi: { soTien: goi.giaNam, ...q },
      thanhToan: { daNhan: 0 },
    },
  });
  const link = linkThanhToanHoiVien(token);
  const kenh = await guiTin(payload, {
    loai: "hoiVienThanhToan", sdt: d.sdt, lienQuan: hv.ma!,
    duLieu: { ten_khach: d.hoTen, ma_hoi_vien: hv.ma!, ten_goi: goi.ten, bien_so: d.bienSo, so_tien: dinhDangTien(goi.giaNam), link },
    sms: `ThoToi: dang ky ${goi.ten} (${hv.ma}) cho xe ${d.bienSo}. Thanh toan ${dinhDangTien(goi.giaNam).replace("đ", "d")} qua VietQR: ${link}`,
  });
  return {
    ma: hv.ma, trangThai: hv.trangThai,
    goi: { slug: goi.slug, ten: goi.ten, soTien: goi.giaNam, soTienHienThi: dinhDangTien(goi.giaNam) },
    bienSo: d.bienSo,
    linkThanhToan: link, token,
    daGuiQua: kenh, sdtChe: cheSdt(d.sdt),
    // Xe đang có gói còn hạn: gói mới nối tiếp khi gói cũ hết
    noiTiepTu: dangCo?.hetHanLuc || null,
    maGioiThieu: ketQuaMa,
  };
}

async function hoiVienTheoToken(payload: Payload, token: string) {
  if (!/^[\w-]{20,64}$/.test(token)) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  const hv = (await payload.find({ collection: "hoi-vien", where: { token: { equals: token } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0];
  if (!hv) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  return hv;
}

/** Màn thanh toán gói (link trong tin Zalo): số tiền, VietQR, trạng thái; đã trả thì hiện hạn dùng. */
export async function xemThanhToanHoiVien(payload: Payload, token: string) {
  const hv = await hoiVienTheoToken(payload, token);
  const { thongTinChuyenKhoan } = await import("./don/phuc-vu");
  const soTien = hv.quyenLoi?.soTien || 0;
  const daNhan = hv.thanhToan?.daNhan || 0;
  const conPhaiTra = hv.trangThai === "choThanhToan" ? Math.max(0, soTien - daNhan) : 0;
  const ck = await thongTinChuyenKhoan(payload, hv.ma!, conPhaiTra);
  return {
    ma: hv.ma, goi: hv.tenGoi, bienSo: hv.bienSo, hoTen: hv.hoTen || null, sdtChe: cheSdt(hv.sdt),
    trangThai: hv.trangThai,
    soTien, soTienHienThi: dinhDangTien(soTien), daNhan, conPhaiTra,
    chuyenKhoan: ck.chuyenKhoan, vietQR: ck.vietQR, hotline: ck.hotline,
    hieuLuc: hv.batDauLuc ? { tu: hv.batDauLuc, den: hv.hetHanLuc } : null,
    quyenLoi: hv.trangThai === "hieuLuc" ? await tomTatHoiVien(payload, hv) : null,
  };
}

/**
 * Tiền về cho HV-… (webhook, giả lập, thu tay). Gọi từ nhanTien sau khi đã chặn trùng mã giao dịch.
 * Đủ tiền: kích hoạt 12 tháng (nối tiếp nếu xe đang có gói), nhắn khách, thưởng người giới thiệu.
 */
export async function nhanTienHoiVien(payload: Payload, maHV: string, g: { maGiaoDich: string; soTien: number; luc?: string }) {
  const hv = (await payload.find({ collection: "hoi-vien", where: { ma: { equals: maHV } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0];
  if (!hv) return { ketQua: "khongThayDon" as const, hv: null };
  if (hv.trangThai !== "choThanhToan") return { ketQua: "trung" as const, hv };
  const daNhan = (hv.thanhToan?.daNhan || 0) + g.soTien;
  const soTien = hv.quyenLoi?.soTien || 0;
  if (daNhan < soTien) {
    await payload.update({ collection: "hoi-vien", id: hv.id, overrideAccess: true, data: { thanhToan: { ...(hv.thanhToan || {}), daNhan, maGiaoDich: g.maGiaoDich } } });
    return { ketQua: "hoiVienThieu" as const, hv, daNhan, canTra: soTien };
  }
  const luc = g.luc ? new Date(g.luc) : new Date();
  const dangCo = await hoiVienCuaXe(payload, hv.bienSo, luc);
  // Đã có bản gia hạn khác nối sau gói đang dùng: nối tiếp sau bản muộn nhất
  const muonNhat = (await payload.find({
    collection: "hoi-vien", overrideAccess: true, depth: 0, limit: 1, sort: "-hetHanLuc",
    where: { and: [{ bienSo: { equals: hv.bienSo } }, { trangThai: { equals: "hieuLuc" } }, { hetHanLuc: { greater_than: luc.toISOString() } }, { id: { not_equals: hv.id } }] },
  })).docs[0];
  const { batDau, hetHan } = hieuLucMoi({ thanhToanLuc: luc.toISOString(), hetHanCu: muonNhat?.hetHanLuc || dangCo?.hetHanLuc || null });
  const moi = await payload.update({
    collection: "hoi-vien", id: hv.id, overrideAccess: true,
    data: { trangThai: "hieuLuc", batDauLuc: batDau, hetHanLuc: hetHan, thanhToan: { daNhan, maGiaoDich: g.maGiaoDich, thanhToanLuc: luc.toISOString() } },
  });
  const ngay = (s: string) => new Date(s).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  void guiTin(payload, {
    loai: "hoiVienKichHoat", sdt: hv.sdt, lienQuan: hv.ma!,
    duLieu: { ten_khach: hv.hoTen || "Quý khách", ma_hoi_vien: hv.ma!, ten_goi: hv.tenGoi || "", bien_so: hv.bienSo, tu_ngay: ngay(batDau), den_ngay: ngay(hetHan) },
    sms: `ThoToi: ${hv.tenGoi} cho xe ${hv.bienSo} co hieu luc tu ${ngay(batDau)} den ${ngay(hetHan)}. Goi tho: ${site.url}`,
  });
  if (hv.gioiThieu) void baoThuongGioiThieu(payload, typeof hv.gioiThieu === "object" ? hv.gioiThieu.id : hv.gioiThieu, `${(hv.hoTen || "").split(/\s+/).pop()} mua gói hội viên`);
  return { ketQua: "hoiVien" as const, hv: moi };
}

/** Việc định kỳ: gói quá hạn → "Hết hạn"; còn 14 ngày mà chưa gia hạn → nhắn nhắc một lần. */
export async function capNhatHanHoiVien(payload: Payload, bayGio = new Date()) {
  const t = bayGio.toISOString();
  const het = await payload.update({
    collection: "hoi-vien", overrideAccess: true, where: { and: [{ trangThai: { equals: "hieuLuc" } }, { hetHanLuc: { less_than_equal: t } }] }, data: { trangThai: "hetHan" },
  });
  const moc = new Date(bayGio.getTime() + 14 * 86400000).toISOString();
  const sapHet = (await payload.find({
    collection: "hoi-vien", overrideAccess: true, depth: 0, limit: 200,
    where: { and: [{ trangThai: { equals: "hieuLuc" } }, { hetHanLuc: { less_than_equal: moc } }, { nhacGiaHanLuc: { exists: false } }] },
  })).docs;
  let daNhac = 0;
  for (const hv of sapHet) {
    const daGiaHan = (await payload.count({ collection: "hoi-vien", overrideAccess: true, where: { and: [{ bienSo: { equals: hv.bienSo } }, { trangThai: { equals: "hieuLuc" } }, { hetHanLuc: { greater_than: hv.hetHanLuc! } }] } })).totalDocs;
    if (!daGiaHan) {
      await guiTin(payload, {
        loai: "hoiVienSapHet", sdt: hv.sdt, lienQuan: hv.ma!,
        duLieu: { ten_khach: hv.hoTen || "Quý khách", ten_goi: hv.tenGoi || "", bien_so: hv.bienSo, den_ngay: new Date(hv.hetHanLuc!).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }), link: `${site.url}/hoi-vien/` },
        sms: `ThoToi: ${hv.tenGoi} xe ${hv.bienSo} sap het han. Gia han tai ${site.url}/hoi-vien/`,
      });
      daNhac++;
    }
    await payload.update({ collection: "hoi-vien", id: hv.id, overrideAccess: true, data: { nhacGiaHanLuc: t } });
  }
  return { hetHan: het.docs.length, nhacGiaHan: daNhac };
}
