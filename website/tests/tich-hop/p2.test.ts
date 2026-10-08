// Kiểm thử P2 trên database thật (dữ liệu thử có hậu tố riêng). Tích hợp ngoài chạy giả lập.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { getPayload, type Payload, type PayloadRequest } from "payload";
import config from "../../payload.config";
import { layKhungGio, LoiNguoiDung } from "../../lib/cong-khai";
import { taoDon } from "../../lib/don/tao-don";
import { danhDauXong, duyetBaoGia, nhanTien, taoBaoGia } from "../../lib/don/phuc-vu";
import { capNhatHanHoiVien, dangKyHoiVien, hoiVienCuaXe, layTrangHoiVien, xemThanhToanHoiVien } from "../../lib/hoi-vien";
import { ghiLuotMo, guiMaGioiThieu, kiemTraMaGioiThieu, thongKe, xemGioiThieu } from "../../lib/gioi-thieu";
import { guiHoSoTho, guiYeuCauDoanhNghiep, traCuuMst } from "../../lib/p2";
import type { User } from "../../payload-types";

let payload: Payload;
const nguoi: Record<string, User> = {};
const TT = `kt2-${Date.now()}`;
const khongReq = undefined as unknown as PayloadRequest;
const reqCua = (u: User) => ({ user: { ...u, collection: "users" }, payload, context: {} }) as unknown as PayloadRequest;
let dem = 0;
const sdtMoi = () => `0977${String(Date.now() % 100000).padStart(5, "0")}${dem++ % 10}`.slice(0, 10);
let demBien = 0;
const bienMoi = () => `30L-${String((Date.now() + demBien) % 1000).padStart(3, "0")}.${String(10 + (demBien++ % 90))}`;
let gioGapCu: { tu: string; den: string } | undefined;
let nganHangCu: Record<string, unknown> | undefined;
const loiMa = (ma: string) => (e: Error) => (e as LoiNguoiDung).ma === ma;

before(async () => {
  payload = await getPayload({ config });
  for (const v of ["quanTri", "quanLyDichVu", "bienTap", "marketing", "dieuPhoi"] as const) {
    nguoi[v] = await payload.create({ collection: "users", overrideAccess: true, data: { email: `${TT}-${v}@thotoi.test`, password: "KiemThu-123456", ten: `KT ${v}`, vaiTro: v } });
  }
  const lich = await payload.findGlobal({ slug: "lich-nhan-don" });
  gioGapCu = { tu: lich.gioNhanGap?.tu || "06:00", den: lich.gioNhanGap?.den || "22:00" };
  const c = await payload.findGlobal({ slug: "cai-dat" });
  if (!c.soTaiKhoan) {
    nganHangCu = { nganHangBin: c.nganHangBin ?? null, soTaiKhoan: c.soTaiKhoan ?? null, chuTaiKhoan: c.chuTaiKhoan ?? null };
    await payload.updateGlobal({ slug: "cai-dat", data: { nganHangBin: "970436", soTaiKhoan: "1023456789", chuTaiKhoan: "KIEM THU" } });
  }
});

after(async () => {
  if (gioGapCu) await payload.updateGlobal({ slug: "lich-nhan-don", data: { gioNhanGap: gioGapCu } });
  if (nganHangCu) await payload.updateGlobal({ slug: "cai-dat", data: nganHangCu });
  await payload.delete({ collection: "tep-ho-so", where: { filename: { like: "TH-" } }, overrideAccess: true }).catch(() => {});
  await payload.delete({ collection: "users", where: { email: { like: TT } }, overrideAccess: true });
  process.exit(0);
});

async function donMoi(khach: { hoTen: string; sdt: string }, bienSo: string, them: Record<string, unknown> = {}) {
  const lich = await layKhungGio(payload, { soNgay: 14 });
  const n = lich.ngay.find((x) => x.khung.some((k) => k.datDuoc))!;
  const k = n.khung.find((x) => x.datDuoc)!;
  return taoDon(payload, "datLich", {
    dichVu: ["ac-quy"], xe: { dong: "toyota-vios", bienSo, soKm: 50000 },
    viTri: { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy", choDo: "ham" },
    khungGio: { ngay: n.ngay, ma: k.ma }, khach, dongY: true, ...them,
  });
}

/** Báo giá → khách duyệt → xong; trả về đơn sau khi tính tiền (chưa trả tiền). */
async function lamDenXong(d: { ma: string; token: string }, hangMuc: Parameters<typeof taoBaoGia>[3]["hangMuc"]) {
  await taoBaoGia(payload, khongReq, d.ma, { hangMuc });
  await duyetBaoGia(payload, d.token, { dongY: true });
  return danhDauXong(payload, khongReq, d.ma, {});
}
const traDu = (ma: string, soTien: number) => nhanTien(payload, { maGiaoDich: `${TT}-${ma}-${Math.random()}`, soTien, noiDung: `CK ${ma.replace("-", "")}`, luc: new Date().toISOString(), nguon: "kt" });

const KICH_NO = { ma: "kich", ten: "Kích nổ tại chỗ", loai: "cong" as const, gia: 150000, batBuoc: true };
const COC = { ma: "coc", ten: "Vệ sinh cọc", loai: "cong" as const, gia: 100000 };

describe("hội viên", () => {
  test("đăng ký → chuyển thiếu → đủ: hiệu lực 12 tháng; gia hạn sớm nối tiếp; quá hạn thì hết hiệu lực", async () => {
    const bien = bienMoi();
    const sdt = sdtMoi();
    await assert.rejects(dangKyHoiVien(payload, { goi: "an-tam", hoTen: "A", sdt, bienSo: bien, dongY: false }), loiMa("DU_LIEU_SAI"));
    await assert.rejects(dangKyHoiVien(payload, { goi: "khong-co", hoTen: "A", sdt, bienSo: bien, dongY: true }), loiMa("GOI_KHONG_CO"));
    const dk = await dangKyHoiVien(payload, { goi: "an-tam", hoTen: "Kiểm Thử", sdt, bienSo: bien.replace(/\W/g, "").toLowerCase(), dongY: true });
    assert.match(String(dk.ma), /^HV-\d{6}$/);
    assert.equal(dk.bienSo, bien);
    assert.equal(dk.goi.soTien, 1290000);
    const tt = await xemThanhToanHoiVien(payload, dk.token);
    assert.equal(tt.chuyenKhoan?.noiDung, dk.ma!.replace("-", ""));
    assert.ok(tt.vietQR?.chuoi.includes("54071290000"));
    assert.equal(await hoiVienCuaXe(payload, bien), null, "chưa trả tiền thì chưa có quyền lợi");

    const thieu = await traDu(dk.ma!, 1000000);
    assert.equal(thieu.ketQua, "hoiVienThieu");
    const du = await traDu(dk.ma!, 290000);
    assert.equal(du.ketQua, "hoiVien");
    const hv = await hoiVienCuaXe(payload, bien);
    assert.ok(hv);
    const thang = (new Date(hv!.hetHanLuc!).getTime() - new Date(hv!.batDauLuc!).getTime()) / 86400000;
    assert.ok(thang >= 365 && thang <= 366, "12 tháng");
    assert.equal((await traDu(dk.ma!, 1290000)).ketQua, "trung", "chuyển lần nữa không gia hạn thêm");

    // Gia hạn sớm: bản mới bắt đầu khi bản cũ hết
    const dk2 = await dangKyHoiVien(payload, { goi: "co-ban", hoTen: "Kiểm Thử", sdt, bienSo: bien, dongY: true });
    assert.equal(dk2.noiTiepTu, hv!.hetHanLuc);
    await traDu(dk2.ma!, 490000);
    const hv2 = (await payload.find({ collection: "hoi-vien", where: { ma: { equals: dk2.ma } }, overrideAccess: true })).docs[0];
    assert.equal(hv2.batDauLuc, hv!.hetHanLuc);
    assert.equal((await hoiVienCuaXe(payload, bien))!.id, hv!.id, "đang dùng gói cũ");

    // Quá hạn: việc định kỳ chuyển "Hết hạn"
    await payload.update({ collection: "hoi-vien", id: hv!.id, overrideAccess: true, data: { hetHanLuc: new Date(Date.now() - 1000).toISOString() } });
    await capNhatHanHoiVien(payload);
    assert.equal((await payload.findByID({ collection: "hoi-vien", id: hv!.id, overrideAccess: true })).trangThai, "hetHan");
  });

  test("quyền lợi gói Cơ bản tự áp vào đơn: miễn đi lại 4 lần, kích nổ 2 lần, giảm 10% công", async () => {
    const bien = bienMoi();
    const khach = { hoTen: "Hội Viên Cơ Bản", sdt: sdtMoi() };
    const dk = await dangKyHoiVien(payload, { goi: "co-ban", ...khach, bienSo: bien, dongY: true });
    await traDu(dk.ma!, 490000);
    const ketQua = [];
    for (let i = 0; i < 5; i++) {
      const d = await donMoi(khach, bien);
      assert.equal(d.hoiVien?.ma, dk.ma);
      const xong = await lamDenXong(d, [KICH_NO, COC]);
      ketQua.push(xong.quyenLoi);
      await traDu(d.ma, xong.thanhToan!.soTien!);
    }
    assert.deepEqual(ketQua.map((q) => q?.mienDiLai ?? null), ["hoiVien", "hoiVien", "hoiVien", "hoiVien", null]);
    assert.deepEqual(ketQua.map((q) => q?.kichNo), [1, 1, 0, 0, 0]);
    // Đơn 1: công 250.000, kích nổ miễn 150.000, còn 100.000 giảm 10% = 10.000
    assert.equal(ketQua[0]?.giamHoiVien, 10000);
    // Đơn 3: kích nổ hết lượt, công 250.000 giảm 10% = 25.000
    assert.equal(ketQua[2]?.giamHoiVien, 25000);
  });

  test("gói An tâm: gọi gấp được ưu tiên trước đơn khẩn cấp thường; trang hội viên có bảng so sánh", async () => {
    await payload.updateGlobal({ slug: "lich-nhan-don", data: { gioNhanGap: { tu: "00:00", den: "23:59" } } });
    const bien = bienMoi();
    const sdt = sdtMoi();
    const dk = await dangKyHoiVien(payload, { goi: "an-tam", hoTen: "An Tâm", sdt, bienSo: bien, dongY: true });
    await traDu(dk.ma!, 1290000);
    const gap = await taoDon(payload, "khanCap", { suCo: "aq", viTri: { lat: 21.031, lng: 105.789 }, xe: { bienSo: bien }, khach: { sdt }, dongY: true });
    const thuong = await taoDon(payload, "khanCap", { suCo: "aq", viTri: { lat: 21.031, lng: 105.789 }, khach: { sdt: sdtMoi() }, dongY: true });
    const uu = async (ma: string) => (await payload.find({ collection: "don-hang", where: { ma: { equals: ma } }, overrideAccess: true })).docs[0].uuTien;
    assert.equal(await uu(gap.ma), 2);
    assert.equal(await uu(thuong.ma), 1);

    const trang = await layTrangHoiVien(payload);
    assert.deepEqual(trang.goi.map((g) => g.slug), ["co-ban", "an-tam"]);
    assert.equal(trang.goi[0].giaThangHienThi, "41.000đ");
    assert.equal(trang.bangSoSanh[0].goi[1].chu, "Miễn không giới hạn");
  });
});

describe("giới thiệu bạn bè", () => {
  test("mã theo SĐT, bạn mới miễn đi lại đơn đầu, người giới thiệu nhận lượt và tự trừ vào đơn sau", async () => {
    const chu = { hoTen: "Trần Minh Tuấn", sdt: sdtMoi() };
    const dauTien = await donMoi(chu, bienMoi());
    void dauTien;
    const gui = await guiMaGioiThieu(payload, chu.sdt);
    assert.ok(gui.giaLap, "máy chạy thử trả mã để chạy thử");
    const ma = gui.giaLap!.ma;
    assert.match(ma, /^TUAN\d{4}$/);
    assert.equal((await guiMaGioiThieu(payload, chu.sdt)).giaLap!.ma, ma, "gửi lại vẫn mã cũ");
    const la = await guiMaGioiThieu(payload, sdtMoi());
    assert.equal(la.daGui, true, "số lạ: trả lời giống hệt, không lộ ai là khách");
    assert.equal(la.giaLap, null);

    assert.equal((await ghiLuotMo(payload, ma, "10.1.1.1")).daGhi, true);
    assert.equal((await ghiLuotMo(payload, ma, "10.1.1.1")).daGhi, false, "cùng máy mở lại không đếm");

    // Chính mình dùng mã: không áp
    assert.equal((await kiemTraMaGioiThieu(payload, ma, chu.sdt)).ma, "MA_CUA_BAN");
    // Bạn mới: đơn đầu miễn đi lại
    const ban = { hoTen: "Lê Thu Trang", sdt: sdtMoi() };
    assert.equal((await kiemTraMaGioiThieu(payload, ma.toLowerCase(), ban.sdt)).hopLe, true);
    const d = await donMoi(ban, bienMoi(), { maGioiThieu: ma });
    assert.equal(d.gioiThieu?.apDung, true);
    const xong = await lamDenXong(d, [COC]);
    assert.equal(xong.quyenLoi?.mienDiLai, "banMoi");
    assert.equal(xong.thanhToan?.soTien, 100000);
    let tk = await thongKe(payload, (await payload.find({ collection: "ma-gioi-thieu", where: { ma: { equals: ma } }, overrideAccess: true })).docs[0]);
    assert.equal(tk.luotConLai, 0, "đơn bạn chưa trả tiền thì chưa thưởng");
    await traDu(d.ma, 100000);
    // Đơn thứ hai của bạn: không còn là đơn đầu
    const d2 = await donMoi(ban, bienMoi(), { maGioiThieu: ma });
    assert.equal(d2.gioiThieu?.apDung, false);
    assert.match(String(d2.gioiThieu?.lyDo), /đơn đầu tiên/);
    // Mã sai gõ tay: vẫn nhận đơn, báo lý do
    const d3 = await donMoi({ hoTen: "X", sdt: sdtMoi() }, bienMoi(), { maGioiThieu: "KHONGCO9999" });
    assert.equal(d3.gioiThieu?.apDung, false);

    const doc = (await payload.find({ collection: "ma-gioi-thieu", where: { ma: { equals: ma } }, overrideAccess: true })).docs[0];
    tk = await thongKe(payload, doc);
    assert.deepEqual([tk.soLuotMo, tk.soDonHoanThanh, tk.luotConLai], [1, 1, 1]);
    // Người giới thiệu đặt đơn tiếp: tự dùng lượt
    const dChu = await donMoi(chu, bienMoi());
    const xChu = await lamDenXong(dChu, [COC]);
    assert.equal(xChu.quyenLoi?.mienDiLai, "luotGioiThieu");
    tk = await thongKe(payload, doc);
    assert.deepEqual([tk.luotDaDung, tk.luotConLai], [1, 0]);
    // Bấm xong lại (thợ sửa số km) không tiêu thêm lượt
    const lai = await danhDauXong(payload, khongReq, dChu.ma, { soKm: 51000 });
    assert.equal(lai.quyenLoi?.mienDiLai, "luotGioiThieu");
    assert.equal((await thongKe(payload, doc)).luotDaDung, 1);

    const xem = await xemGioiThieu(payload, gui.giaLap!.token!);
    assert.equal(xem.ma, ma);
    assert.match(xem.sdtChe, /xxx/);
    await assert.rejects(xemGioiThieu(payload, "khong-co-token-nay-dau-ban-oi"), loiMa("LINK_SAI"));
  });
});

describe("doanh nghiệp, tuyển thợ", () => {
  test("tra MST, yêu cầu báo giá DN-, kiểm tra khu vực", async () => {
    const ct = await traCuuMst("0101 234 567");
    assert.equal(ct.mst, "0101234567");
    assert.ok(ct.ten);
    await assert.rejects(traCuuMst("0101234000"), loiMa("KHONG_TIM_THAY_MST"));
    await assert.rejects(traCuuMst("12345"), loiMa("MST_SAI"));
    const yc = { tenCongTy: "Công ty Kiểm Thử", mst: "0101234567", soXe: 12, loaiXe: "7-cho", loaiDoiXe: "cty", khuVuc: ["cau-giay"], nguoiLienHe: "Chị Lan", sdt: sdtMoi(), dongY: true };
    await assert.rejects(guiYeuCauDoanhNghiep(payload, { ...yc, khuVuc: ["hai-ba-trung-khong-co"] }), loiMa("DU_LIEU_SAI"));
    await assert.rejects(guiYeuCauDoanhNghiep(payload, { ...yc, dongY: false }), loiMa("DU_LIEU_SAI"));
    const kq = await guiYeuCauDoanhNghiep(payload, yc);
    assert.match(String(kq.ma), /^DN-\d{6}$/);
    const doc = (await payload.find({ collection: "yeu-cau-doanh-nghiep", where: { ma: { equals: kq.ma } }, overrideAccess: true })).docs[0];
    assert.ok(doc.dongYLuc);
    assert.ok(doc.diaChi, "tự điền địa chỉ theo MST");
  });

  test("hồ sơ thợ: tối đa 3 ảnh, chỉ nhận ảnh, mã TH-", async () => {
    // PNG 1x1
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const anh = (ten: string) => ({ ten, loai: "image/png", kichThuoc: png.length, duLieu: png });
    const hs = { hoTen: "Thợ Kiểm Thử", sdt: sdtMoi(), namKinhNghiem: "6-10", khuVuc: ["dong-da", "khac"], dungCu: ["obd"], dongY: true };
    await assert.rejects(guiHoSoTho(payload, hs, [anh("1.png"), anh("2.png"), anh("3.png"), anh("4.png")]), loiMa("QUA_NHIEU_TEP"));
    await assert.rejects(guiHoSoTho(payload, hs, [{ ten: "cv.pdf", loai: "application/pdf", kichThuoc: 10, duLieu: Buffer.from("%PDF") }]), loiMa("TEP_SAI_LOAI"));
    const kq = await guiHoSoTho(payload, hs, [anh("chung-chi.png"), anh("bang-lai.png")]);
    assert.match(String(kq.ma), /^TH-\d{6}$/);
    assert.equal(kq.soAnh, 2);
    const doc = (await payload.find({ collection: "ho-so-tho", where: { ma: { equals: kq.ma } }, overrideAccess: true, depth: 0 })).docs[0];
    assert.equal(doc.anhChungChi?.length, 2);
  });
});

describe("phân quyền P2", () => {
  const doc = (u: User | null, collection: "hoi-vien" | "goi-hoi-vien" | "ma-gioi-thieu" | "yeu-cau-doanh-nghiep" | "ho-so-tho" | "tep-ho-so") =>
    payload.find({ collection, overrideAccess: false, ...(u ? { req: reqCua(u), user: u } : {}), limit: 1 }).then(() => true, () => false);
  test("ai đọc được gì", async () => {
    const bang: [string, string, boolean][] = [];
    for (const [ten, u] of [["khach", null], ...Object.entries(nguoi)] as [string, User | null][]) {
      for (const c of ["hoi-vien", "goi-hoi-vien", "ma-gioi-thieu", "yeu-cau-doanh-nghiep", "ho-so-tho", "tep-ho-so"] as const) bang.push([ten, c, await doc(u, c)]);
    }
    const duoc = (ten: string) => bang.filter((b) => b[0] === ten && b[2]).map((b) => b[1]).sort();
    assert.deepEqual(duoc("khach"), ["goi-hoi-vien"]);
    assert.deepEqual(duoc("bienTap"), ["goi-hoi-vien"]);
    assert.deepEqual(duoc("marketing"), ["goi-hoi-vien", "hoi-vien", "ma-gioi-thieu", "yeu-cau-doanh-nghiep"]);
    assert.deepEqual(duoc("dieuPhoi"), ["goi-hoi-vien", "hoi-vien"]);
    assert.deepEqual(duoc("quanLyDichVu"), ["goi-hoi-vien", "ho-so-tho", "hoi-vien", "ma-gioi-thieu", "tep-ho-so", "yeu-cau-doanh-nghiep"]);
  });

  test("sửa giá gói: quản lý dịch vụ được, marketing không", async () => {
    const g = (await payload.find({ collection: "goi-hoi-vien", where: { slug: { equals: "co-ban" } }, overrideAccess: true })).docs[0];
    await assert.rejects(payload.update({ collection: "goi-hoi-vien", id: g.id, data: { giaNam: 1 }, overrideAccess: false, req: reqCua(nguoi.marketing), user: nguoi.marketing }));
    const r = await payload.update({ collection: "goi-hoi-vien", id: g.id, data: { giaNam: g.giaNam }, overrideAccess: false, req: reqCua(nguoi.quanLyDichVu), user: nguoi.quanLyDichVu });
    assert.equal(r.giaNam, g.giaNam);
  });
});
