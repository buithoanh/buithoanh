// Kiểm thử tích hợp P0 trên database thật (cần DATABASE_URL đã migrate + `npm run nap-du-lieu`).
// Tích hợp ngoài chạy giả lập: đặt TICH_HOP_GIA_LAP=tat-ca nếu NODE_ENV=production.
//   npm run test:tich-hop
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { getPayload, type Payload } from "payload";
import config from "../../payload.config";
import { layDanhGia, layKhungGio, LoiNguoiDung, tinhBaoGiaSoBo, kiemTraVung } from "../../lib/cong-khai";
import { taoDon } from "../../lib/don/tao-don";
import { donTheoToken } from "../../lib/don/theo-doi";
import type { User } from "../../payload-types";

let payload: Payload;
const nguoi: Record<string, User> = {};
const VAI_TRO = ["quanTri", "quanLyDichVu", "bienTap", "marketing", "dieuPhoi"] as const;
const TIEN_TO = `kiemthu-${Date.now()}`;
const sdtMoi = (() => { let i = 0; return () => `0977${String(Date.now() % 100000).padStart(5, "0")}${i++ % 10}`.slice(0, 10); })();

const donMau = (ngay: string, ma: string, them: Record<string, unknown> = {}) => ({
  dichVu: ["ac-quy"], xe: { hang: "toyota", dong: "toyota-vios", doi: 2019, bienSo: "30a99999" },
  viTri: { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy", choDo: "ham" },
  khungGio: { ngay, ma }, khach: { hoTen: "Khách kiểm thử", sdt: sdtMoi() }, dongY: true, ...them,
});

async function ngayConKhung() {
  const lich = await layKhungGio(payload, { soNgay: 7 });
  for (const n of lich.ngay) for (const k of n.khung) if (k.datDuoc) return { ngay: n.ngay, ma: k.ma, conCho: k.conCho };
  throw new Error("Không còn khung trống trong 7 ngày tới");
}

let gioGapCu: { tu: string; den: string } | undefined;

before(async () => {
  payload = await getPayload({ config });
  // Gọi gấp chỉ nhận trong giờ cấu hình; mở cả ngày để kiểm thử không phụ thuộc giờ chạy CI
  const lich = await payload.findGlobal({ slug: "lich-nhan-don" });
  gioGapCu = { tu: lich.gioNhanGap?.tu || "06:00", den: lich.gioNhanGap?.den || "22:00" };
  await payload.updateGlobal({ slug: "lich-nhan-don", data: { gioNhanGap: { tu: "00:00", den: "23:59" } } });
  for (const v of VAI_TRO) {
    nguoi[v] = await payload.create({
      collection: "users", overrideAccess: true,
      data: { email: `${TIEN_TO}-${v}@thotoi.test`, password: "KiemThu-123456", ten: `Kiểm thử ${v}`, vaiTro: v },
    });
  }
});

after(async () => {
  if (gioGapCu) await payload.updateGlobal({ slug: "lich-nhan-don", data: { gioNhanGap: gioGapCu } });
  await payload.delete({ collection: "users", where: { email: { like: TIEN_TO } }, overrideAccess: true });
  await payload.delete({ collection: "don-hang", where: { "khach.hoTen": { equals: "Khách kiểm thử" } }, overrideAccess: true });
  await payload.delete({ collection: "danh-gia", where: { tenHienThi: { equals: TIEN_TO } }, overrideAccess: true });
  process.exit(0); // Payload giữ kết nối database mở
});

describe("phân quyền theo vai trò", () => {
  test("chỉ quản trị và quản lý dịch vụ sửa được giá", async () => {
    const hm = (await payload.find({ collection: "hang-muc-gia", where: { loai: { equals: "cong" } }, limit: 1 })).docs[0];
    for (const v of ["bienTap", "marketing", "dieuPhoi"] as const) {
      await assert.rejects(
        payload.update({ collection: "hang-muc-gia", id: hm.id, data: { gia: (hm.gia ?? 0) + 1000 }, user: nguoi[v], overrideAccess: false }),
        `${v} không được sửa giá`,
      );
      await assert.rejects(payload.updateGlobal({ slug: "bang-gia-chung", data: { phiDiLai: 1 }, user: nguoi[v], overrideAccess: false }));
    }
    const moi = await payload.update({
      collection: "hang-muc-gia", id: hm.id, data: { gia: (hm.gia ?? 0) + 1000, lyDoDoi: "kiểm thử" }, user: nguoi.quanLyDichVu, overrideAccess: false,
    });
    assert.equal(moi.gia, (hm.gia ?? 0) + 1000);
    const nk = (await payload.find({ collection: "nhat-ky-gia", sort: "-createdAt", limit: 1, user: nguoi.quanLyDichVu, overrideAccess: false })).docs[0];
    assert.equal(nk.lyDo, "kiểm thử");
    assert.equal(nk.tenNguoi, "Kiểm thử quanLyDichVu");
    assert.match(String(nk.giaMoi), /đ/);
    await payload.update({ collection: "hang-muc-gia", id: hm.id, data: { gia: hm.gia }, user: nguoi.quanTri, overrideAccess: false });
  });

  test("nhật ký giá không ai sửa, xoá được; khách không đọc được", async () => {
    const nk = (await payload.find({ collection: "nhat-ky-gia", limit: 1 })).docs[0];
    await assert.rejects(payload.update({ collection: "nhat-ky-gia", id: nk.id, data: { lyDo: "x" }, user: nguoi.quanTri, overrideAccess: false }));
    await assert.rejects(payload.delete({ collection: "nhat-ky-gia", id: nk.id, user: nguoi.quanTri, overrideAccess: false }));
    await assert.rejects(payload.find({ collection: "nhat-ky-gia", overrideAccess: false }));
    await assert.rejects(payload.find({ collection: "nhat-ky-gia", user: nguoi.bienTap, overrideAccess: false }));
  });

  test("đơn hàng (dữ liệu cá nhân): chỉ quản trị, quản lý dịch vụ, điều phối", async () => {
    for (const v of ["quanTri", "quanLyDichVu", "dieuPhoi"] as const) {
      await payload.find({ collection: "don-hang", limit: 1, user: nguoi[v], overrideAccess: false });
    }
    for (const v of ["bienTap", "marketing"] as const) {
      await assert.rejects(payload.find({ collection: "don-hang", limit: 1, user: nguoi[v], overrideAccess: false }), `${v} không đọc được đơn`);
    }
    await assert.rejects(payload.find({ collection: "don-hang", limit: 1, overrideAccess: false }), "khách không đọc được đơn");
  });

  test("biên tập viết được bài nhưng không đăng được", async () => {
    const tk = await payload.create({
      collection: "tu-khoa", data: { tuKhoa: `${TIEN_TO} từ khoá`, nhom: "Ắc quy" }, user: nguoi.bienTap, overrideAccess: false,
    });
    await payload.delete({ collection: "tu-khoa", id: tk.id, overrideAccess: true });
    await assert.rejects(payload.create({ collection: "tu-khoa", data: { tuKhoa: `${TIEN_TO} x`, nhom: "Lốp" }, user: nguoi.dieuPhoi, overrideAccess: false }));
  });

  test("chỉ quản trị đổi được vai trò", async () => {
    const u = await payload.update({ collection: "users", id: nguoi.bienTap.id, data: { vaiTro: "quanTri" }, user: nguoi.bienTap, overrideAccess: false });
    assert.equal(u.vaiTro, "bienTap");
  });
});

describe("bảng giá và báo giá sơ bộ", () => {
  test("báo giá theo dòng xe dùng phân khúc của dòng xe", async () => {
    const kq = await tinhBaoGiaSoBo(payload, { dichVu: ["ac-quy"], dongXe: "toyota-vios" });
    assert.equal(kq.trangThai, "coGia");
    assert.equal(kq.phanKhuc, "B");
    assert.ok(kq.tu > 0 && kq.den >= kq.tu);
    assert.ok(Number.isInteger(kq.tu) && Number.isInteger(kq.den));
    const fortuner = await tinhBaoGiaSoBo(payload, { dichVu: ["ac-quy"], dongXe: "toyota-fortuner" });
    assert.ok(fortuner.den > kq.den, "xe phân khúc D đắt hơn B");
  });

  test("dòng xe chưa gán phân khúc: khoảng rộng nhất, đánh dấu cần gán", async () => {
    const kq = await tinhBaoGiaSoBo(payload, { dichVu: ["ac-quy"], dongXe: "toyota-yaris-cross" });
    assert.equal(kq.phanKhuc, null);
    assert.equal(kq.xe?.canGanPhanKhuc, true);
  });

  test("dịch vụ không có thì báo lỗi rõ", async () => {
    await assert.rejects(tinhBaoGiaSoBo(payload, { dichVu: ["khong-co"] }), (e: Error) => e instanceof LoiNguoiDung && /Không có dịch vụ/.test(e.message));
  });
});

describe("vùng phục vụ (bản đồ giả lập)", () => {
  test("địa chỉ trong vùng, phường tạm tắt, ngoài vùng", async () => {
    const a = await kiemTraVung(payload, { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy" });
    assert.equal(a.trongVung, true);
    assert.equal(a.quan?.slug, "cau-giay");
    const b = await kiemTraVung(payload, { diaChi: "1 Phúc Xá, phường Phúc Xá, Ba Đình" });
    assert.equal(b.lyDo, "phuongTamTat");
    const c = await kiemTraVung(payload, { lat: 21.04, lng: 105.7 });
    assert.equal(c.trongVung, false);
    await assert.rejects(kiemTraVung(payload, { diaChi: "đâu đó không rõ" }), (e: Error) => e instanceof LoiNguoiDung && (e as LoiNguoiDung).status === 422);
  });
});

describe("đơn đặt lịch và gọi gấp", () => {
  test("tạo đơn: mã TT-, giá sơ bộ lưu lại, link riêng che số điện thoại", async () => {
    const { ngay, ma } = await ngayConKhung();
    const kq = await taoDon(payload, "datLich", donMau(ngay, ma, { nguon: { utm_source: "google" } }));
    assert.match(kq.ma, /^TT-\d{6}$/);
    assert.equal(kq.giaSoBo?.trangThai, "coGia");
    const don = (await payload.find({ collection: "don-hang", where: { ma: { equals: kq.ma } }, overrideAccess: true })).docs[0];
    assert.equal(don.xe?.bienSo, "30A-999.99");
    assert.equal(don.nguon?.kenh, "Google");
    assert.ok(don.dongY?.dongYLuc, "lưu thời điểm đồng ý");
    assert.equal(don.giaSoBo?.tu, kq.giaSoBo?.tu);
    const td = await donTheoToken(payload, kq.token);
    assert.equal(td.ma, kq.ma);
    assert.match(td.khach.sdt, /^\d{4} xxx \d{3}$/);
    assert.equal(td.cacBuoc[0].tinhTrang, "now");
    assert.ok(!("tokenTheoDoi" in td));
  });

  test("không biết mã đơn thì không xem được đơn; link hết hạn sau khi xong", async () => {
    await assert.rejects(donTheoToken(payload, "TT-000001"), (e: Error) => (e as LoiNguoiDung).status === 404);
    const { ngay, ma } = await ngayConKhung();
    const kq = await taoDon(payload, "datLich", donMau(ngay, ma));
    const don = (await payload.find({ collection: "don-hang", where: { ma: { equals: kq.ma } }, overrideAccess: true })).docs[0];
    const xong = await payload.update({ collection: "don-hang", id: don.id, data: { trangThai: "hoanThanh" }, overrideAccess: true, context: { khongBaoDieuPhoi: true } });
    assert.ok(xong.hetHanLinkLuc, "đặt hạn link khi hoàn thành");
    assert.ok(new Date(xong.hetHanLinkLuc!).getTime() - Date.now() > 23 * 3600 * 1000);
    await payload.update({ collection: "don-hang", id: don.id, data: { hetHanLinkLuc: new Date(Date.now() - 1000).toISOString() }, overrideAccess: true, context: { boQuaHook: true } });
    await assert.rejects(donTheoToken(payload, kq.token), (e: Error) => (e as LoiNguoiDung).status === 410);
  });

  test("luồng trạng thái: không lùi; điều phối đổi được; lịch sử có thời điểm", async () => {
    const { ngay, ma } = await ngayConKhung();
    const kq = await taoDon(payload, "datLich", donMau(ngay, ma));
    const don = (await payload.find({ collection: "don-hang", where: { ma: { equals: kq.ma } }, overrideAccess: true })).docs[0];
    const d1 = await payload.update({ collection: "don-hang", id: don.id, data: { trangThai: "thoDangDen" }, user: nguoi.dieuPhoi, overrideAccess: false });
    assert.equal(d1.lichSuTrangThai?.length, 2);
    assert.ok(d1.lichSuTrangThai?.[1].luc);
    await assert.rejects(payload.update({ collection: "don-hang", id: don.id, data: { trangThai: "daXepTho" }, user: nguoi.dieuPhoi, overrideAccess: false }));
    await assert.rejects(payload.update({ collection: "don-hang", id: don.id, data: { trangThai: "huy" }, user: nguoi.bienTap, overrideAccess: false }));
    const d2 = await payload.update({ collection: "don-hang", id: don.id, data: { trangThai: "huy" }, user: nguoi.dieuPhoi, overrideAccess: false });
    assert.equal(d2.trangThai, "huy");
  });

  test("khung giờ đầy thì không nhận thêm", async () => {
    const { ngay, ma, conCho } = await ngayConKhung();
    for (let i = 0; i < conCho; i++) await taoDon(payload, "datLich", donMau(ngay, ma));
    await assert.rejects(taoDon(payload, "datLich", donMau(ngay, ma)), (e: Error) => (e as LoiNguoiDung).ma === "KHUNG_DAY");
  });

  test("ngoài vùng, chưa đồng ý dữ liệu, dịch vụ tạm ngừng: không tạo đơn", async () => {
    const { ngay, ma } = await ngayConKhung();
    const truoc = (await payload.count({ collection: "don-hang", overrideAccess: true })).totalDocs;
    await assert.rejects(taoDon(payload, "datLich", donMau(ngay, ma, { viTri: { diaChi: "1 An Khánh, Hoài Đức", choDo: "nha" } })), (e: Error) => (e as LoiNguoiDung).ma === "NGOAI_VUNG");
    await assert.rejects(taoDon(payload, "datLich", donMau(ngay, ma, { dongY: false })), (e: Error) => (e as LoiNguoiDung).ma === "DU_LIEU_SAI");
    await assert.rejects(taoDon(payload, "datLich", donMau(ngay, ma, { dichVu: ["dieu-hoa"] })), (e: Error) => (e as LoiNguoiDung).ma === "DICH_VU_TAM_NGUNG");
    assert.equal((await payload.count({ collection: "don-hang", overrideAccess: true })).totalDocs, truoc);
  });

  test("gọi gấp: đơn khẩn cấp lên đầu hàng chờ", async () => {
    const kq = await taoDon(payload, "khanCap", { suCo: "aq", viTri: { lat: 21.02, lng: 105.82 }, khach: { sdt: sdtMoi(), hoTen: "Khách kiểm thử" }, dongY: true });
    assert.equal(kq.loai, "khanCap");
    const dau = (await payload.find({ collection: "don-hang", limit: 1, user: nguoi.dieuPhoi, overrideAccess: false, where: { trangThai: { equals: "daNhan" } } })).docs[0];
    assert.equal(dau.loai, "khanCap");
  });
});

describe("đánh giá hiển thị", () => {
  test("đánh giá mẫu không bao giờ trả ra khi chạy production", async () => {
    const quan = (await payload.find({ collection: "quan", limit: 1 })).docs[0];
    await payload.create({ collection: "danh-gia", overrideAccess: true, data: { noiDung: "mẫu", tenHienThi: TIEN_TO, soSao: 5, ngay: new Date().toISOString(), quan: quan.id, duLieuMau: true, hienThi: true } });
    const cu = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "production";
    try {
      const ds = await layDanhGia(payload, { gioiHan: 50 });
      assert.ok(!ds.some((d) => d.tenHienThi === TIEN_TO));
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = cu;
    }
  });
});
