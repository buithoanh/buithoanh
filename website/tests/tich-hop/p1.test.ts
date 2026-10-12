// Kiểm thử tích hợp P1 trên database thật (đã migrate + nap-du-lieu). Tích hợp ngoài chạy giả lập.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import { getPayload, type Payload, type PayloadRequest } from "payload";
import config from "../../payload.config";
import { layKhungGio, LoiNguoiDung } from "../../lib/cong-khai";
import { taoDon } from "../../lib/don/tao-don";
import { danhDauXong, duyetBaoGia, nhanTien, taoBaoGia, tuChoiBaoGia, xemBaoGia, xemThanhToan, xepTho } from "../../lib/don/phuc-vu";
import { guiDanhGia, guiLinkDanhGiaDenHan } from "../../lib/don/danh-gia";
import { guiMaTraCuu, lichSuXe, xacNhanMa } from "../../lib/tra-cuu-xe";
import { baoCaoHoaHong, kiemTraMaChoKhach } from "../../lib/ma-khuyen-mai";
import { dangBaiHenGio, taoTrangKhuVucTuMau } from "../../lib/noi-dung";
import { baoCaoSoLieu } from "../../lib/so-lieu";
import type { User } from "../../payload-types";

let payload: Payload;
const nguoi: Record<string, User> = {};
const TT = `kt1-${Date.now()}`;
const khongReq = undefined as unknown as PayloadRequest;
const reqCua = (u: User) => ({ user: { ...u, collection: "users" }, payload, context: {} }) as unknown as PayloadRequest;
let dem = 0;
const sdtMoi = () => `0966${String(Date.now() % 100000).padStart(5, "0")}${dem++ % 10}`.slice(0, 10);
const BIEN = `30K-${String(Date.now() % 1000).padStart(3, "0")}.${String(Date.now() % 100).padStart(2, "0")}`;
let gioGapCu: { tu: string; den: string } | undefined;
let nganHangCu: Record<string, unknown> | undefined;

const BG = [
  { ma: "aq", ten: "Ắc quy 12V 45Ah", loai: "phuTung" as const, gia: 1650000, batBuoc: true },
  { ma: "cong", ten: "Công thay ắc quy", loai: "cong" as const, gia: 150000, batBuoc: true },
  { ma: "coc", ten: "Vệ sinh cọc", loai: "cong" as const, gia: 120000 },
  { ma: "gat", ten: "Lưỡi gạt mưa", loai: "phuTung" as const, gia: 280000 },
];

async function donMoi(them: Record<string, unknown> = {}) {
  const lich = await layKhungGio(payload, { soNgay: 10 });
  const n = lich.ngay.find((x) => x.khung.some((k) => k.datDuoc))!;
  const k = n.khung.find((x) => x.datDuoc)!;
  return taoDon(payload, "datLich", {
    dichVu: ["ac-quy"], xe: { dong: "toyota-vios", bienSo: BIEN, soKm: 50000 },
    viTri: { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy", choDo: "ham" },
    khungGio: { ngay: n.ngay, ma: k.ma }, khach: { hoTen: TT, sdt: sdtMoi() }, dongY: true, ...them,
  });
}
const don = async (ma: string) => (await payload.find({ collection: "don-hang", where: { ma: { equals: ma } }, overrideAccess: true, depth: 1 })).docs[0];
const thoMot = async () => (await payload.find({ collection: "tho", limit: 1, overrideAccess: true })).docs[0];

before(async () => {
  payload = await getPayload({ config });
  for (const v of ["quanTri", "quanLyDichVu", "bienTap", "marketing", "dieuPhoi"] as const) {
    nguoi[v] = await payload.create({ collection: "users", overrideAccess: true, data: { email: `${TT}-${v}@thotoi.test`, password: "KiemThu-123456", ten: `KT ${v}`, vaiTro: v } });
  }
  if (!(await payload.count({ collection: "tho", overrideAccess: true })).totalDocs) {
    await payload.create({ collection: "tho", overrideAccess: true, data: { ten: "Thợ kiểm thử", maBenDieuPhoi: "THO-KT", soNamNghe: 3 } });
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
  await payload.delete({ collection: "users", where: { email: { like: TT } }, overrideAccess: true });
  process.exit(0);
});

describe("báo giá, thanh toán, hoá đơn, bảo hành", () => {
  test("luồng đủ: xếp thợ → báo giá → bỏ hạng mục tuỳ chọn → xong → tiền về → hoàn thành", async () => {
    const d = await donMoi();
    const tho = await thoMot();
    await xepTho(payload, reqCua(nguoi.dieuPhoi), d.ma, { tho: tho.id });
    await taoBaoGia(payload, reqCua(nguoi.dieuPhoi), d.ma, { chanDoan: "Ắc quy yếu", hangMuc: BG });
    assert.equal((await don(d.ma)).trangThai, "choDuyetBaoGia");
    const xem = await xemBaoGia(payload, d.token);
    assert.equal(xem.baoGia.hangMuc.length, 4);
    await assert.rejects(duyetBaoGia(payload, d.token, { boHangMuc: ["aq"], dongY: true }), (e: Error) => (e as LoiNguoiDung).ma === "BO_HANG_MUC_SAI");
    await assert.rejects(duyetBaoGia(payload, d.token, { boHangMuc: ["gat"] }), (e: Error) => (e as LoiNguoiDung).ma === "CHUA_DONG_Y");
    const dy = await duyetBaoGia(payload, d.token, { boHangMuc: ["gat"], dongY: true });
    assert.equal(dy.trangThai, "dangSua");
    const bg = (await payload.find({ collection: "bao-gia", where: { donHang: { equals: (await don(d.ma)).id } }, overrideAccess: true })).docs[0];
    assert.ok(bg.ketQua?.banChup, "lưu bản chụp nội dung đã duyệt");
    assert.equal(bg.ketQua?.sdt, (await don(d.ma)).khach?.sdt);
    await danhDauXong(payload, reqCua(nguoi.dieuPhoi), d.ma, { soKm: 50100 });
    const tt = await xemThanhToan(payload, d.token);
    assert.equal(tt.tong, 1650000 + 150000 + 120000 + 50000);
    assert.ok(tt.vietQR?.chuoi.includes("0808TT" + d.ma.slice(3)));
    // Chuyển thiếu rồi chuyển đủ; webhook gửi lặp thì không ghi hai lần
    const r1 = await nhanTien(payload, { maGiaoDich: `${TT}-1`, soTien: 1000000, noiDung: `ck ${d.ma.replace("-", "")} nguyen van a`, luc: new Date().toISOString(), nguon: "kt" });
    assert.equal(r1.ketQua, "thieu");
    assert.equal((await nhanTien(payload, { maGiaoDich: `${TT}-1`, soTien: 1000000, noiDung: d.ma, luc: "", nguon: "kt" })).ketQua, "daXuLy");
    const r2 = await nhanTien(payload, { maGiaoDich: `${TT}-2`, soTien: tt.tong - 1000000, noiDung: d.ma.replace("-", ""), luc: new Date().toISOString(), nguon: "kt" });
    assert.equal(r2.ketQua, "du");
    const xong = await don(d.ma);
    assert.equal(xong.trangThai, "hoanThanh");
    assert.ok(xong.hoaDonDienTu?.so, "đã xuất hoá đơn");
    const bh = xong.phieuBaoHanh as { ma: string; hangMuc: { loai: string; denNgay: string }[] };
    assert.match(bh.ma, /^BH-\d{6}$/);
    assert.equal(bh.hangMuc.length, 3);
    assert.ok(xong.hetHanLinkLuc);
  });

  test("phát sinh: báo giá bổ sung khi đang sửa, tổng cộng dồn, phí đi lại một lần", async () => {
    const d = await donMoi();
    await taoBaoGia(payload, khongReq, d.ma, { hangMuc: BG.slice(0, 2) });
    await duyetBaoGia(payload, d.token, { dongY: true });
    await taoBaoGia(payload, khongReq, d.ma, { hangMuc: [{ ma: "cauchi", ten: "Thay cầu chì", loai: "cong", gia: 80000, batBuoc: true }] });
    assert.equal((await don(d.ma)).trangThai, "choDuyetBaoGia");
    const xem = await xemBaoGia(payload, d.token);
    assert.equal(xem.baoGia.phatSinh, true);
    assert.equal(xem.phiDiLai, 0, "phát sinh không tính lại phí đi lại");
    await duyetBaoGia(payload, d.token, { dongY: true });
    await danhDauXong(payload, khongReq, d.ma, {});
    assert.equal((await xemThanhToan(payload, d.token)).tong, 1650000 + 150000 + 80000 + 50000);
  });

  test("từ chối báo giá: đơn kết thúc, chỉ thu phí kiểm tra, không có bảo hành", async () => {
    const d = await donMoi();
    await taoBaoGia(payload, khongReq, d.ma, { hangMuc: BG });
    const kq = await tuChoiBaoGia(payload, d.token, { lyDo: "Để tự mua" });
    assert.equal(kq.trangThai, "choThanhToan");
    const phi = await payload.findGlobal({ slug: "bang-gia-chung" });
    assert.equal((await xemThanhToan(payload, d.token)).tong, phi.phiKiemTra);
    await nhanTien(payload, { maGiaoDich: `${TT}-tc`, soTien: phi.phiKiemTra!, noiDung: d.ma, luc: new Date().toISOString(), nguon: "kt" });
    const x = await don(d.ma);
    assert.equal(x.trangThai, "hoanThanh");
    assert.equal(x.phieuBaoHanh ?? null, null);
  });

  test("việc nền sau khi tạo đơn không ghi đè trạng thái vừa đổi (đơn huỷ ngay không sống lại)", async () => {
    const d = await donMoi();
    const id = (await don(d.ma)).id;
    await payload.update({ collection: "don-hang", id, data: { trangThai: "huy" }, overrideAccess: true, context: { khongBaoDieuPhoi: true } });
    await new Promise((r) => setTimeout(r, 1500)); // chờ gửi điều phối, nhắn tin chạy nền xong
    const x = await payload.findByID({ collection: "don-hang", id, overrideAccess: true });
    assert.equal(x.trangThai, "huy");
    assert.ok(x.tichHop?.dieuPhoiId, "kết quả gửi điều phối vẫn được ghi");
  });

  test("tiền không khớp đơn nào: ghi lại để đối soát, không lỗi", async () => {
    const r = await nhanTien(payload, { maGiaoDich: `${TT}-la`, soTien: 50000, noiDung: "chuyen tien", luc: new Date().toISOString(), nguon: "kt" });
    assert.equal(r.ketQua, "khongThayDon");
    assert.equal((await payload.find({ collection: "giao-dich", where: { maGiaoDich: { equals: `${TT}-la` } }, overrideAccess: true })).docs[0].ketQua, "khongThayDon");
  });
});

describe("mã khuyến mãi, hoa hồng", () => {
  test("giảm % chỉ trên tiền công, mỗi số một lần, mã hết hạn báo rõ; hoa hồng chỉ tính đơn đã trả", async () => {
    const ma = `KM-KT${Date.now() % 100000}`;
    await payload.create({ collection: "ma-khuyen-mai", overrideAccess: true, data: { ma, loai: "koc", doiTac: "KT", kieuGiam: "phanTram", giaTri: 10, giamToiDa: 100000, hoaHongPhanTram: 8, soLuotToiDa: 5 } });
    const sdt = sdtMoi();
    const d = await donMoi({ maKhuyenMai: ma.toLowerCase(), khach: { hoTen: TT, sdt } });
    assert.equal(d.khuyenMai?.ma, ma);
    assert.equal((await kiemTraMaChoKhach(payload, ma, sdt)).hopLe, false, "số này đã dùng mã");
    await assert.rejects(donMoi({ maKhuyenMai: ma, khach: { hoTen: TT, sdt } }), (e: Error) => (e as LoiNguoiDung).ma === "MA_KHUYEN_MAI_KHONG_DUNG_DUOC");
    await taoBaoGia(payload, khongReq, d.ma, { hangMuc: BG });
    await duyetBaoGia(payload, d.token, { boHangMuc: [], dongY: true });
    await danhDauXong(payload, khongReq, d.ma, {});
    const tt = await xemThanhToan(payload, d.token);
    assert.equal(tt.tong, 1650000 + 150000 + 120000 + 280000 + 50000 - 27000, "giảm 10% của 270.000đ tiền công");
    const truoc = (await baoCaoHoaHong(payload)).dong.find((x) => x.ma === ma);
    assert.equal(truoc, undefined, "chưa trả tiền thì chưa có hoa hồng");
    await nhanTien(payload, { maGiaoDich: `${TT}-km`, soTien: tt.tong, noiDung: d.ma, luc: new Date().toISOString(), nguon: "kt" });
    const sau = (await baoCaoHoaHong(payload)).dong.find((x) => x.ma === ma)!;
    assert.equal(sau.soDon, 1);
    assert.equal(sau.hoaHong, Math.round(tt.tong * 0.08));
    await payload.create({ collection: "ma-khuyen-mai", overrideAccess: true, data: { ma: `${ma}-CU`, loai: "km", kieuGiam: "soTien", giaTri: 50000, hetHan: "2020-01-01" } });
    assert.match(String((await kiemTraMaChoKhach(payload, `${ma}-CU`)).lyDo), /hết hạn/);
  });

  test("quyền: biên tập không tạo mã; marketing tạo được, không đọc được đơn", async () => {
    await assert.rejects(payload.create({ collection: "ma-khuyen-mai", user: nguoi.bienTap, overrideAccess: false, data: { ma: "KM-BT", loai: "km", kieuGiam: "soTien", giaTri: 1 } }));
    const m = await payload.create({ collection: "ma-khuyen-mai", user: nguoi.marketing, overrideAccess: false, data: { ma: `KM-MK${Date.now() % 10000}`, loai: "km", kieuGiam: "soTien", giaTri: 1 } });
    assert.ok(m.id);
    await assert.rejects(payload.find({ collection: "don-hang", user: nguoi.marketing, overrideAccess: false }));
    await assert.rejects(payload.find({ collection: "su-kien", user: nguoi.dieuPhoi, overrideAccess: false }));
  });
});

describe("đánh giá, khiếu nại, tra cứu xe", () => {
  test("link đánh giá gửi sau 24 giờ, dùng một lần; 1–3 sao tạo phiếu khiếu nại", async () => {
    const d = await donMoi();
    // Thợ đã có điểm mang sang từ điều phối: đánh giá mới cộng dồn, không tính lại từ đầu
    const tho = await payload.create({ collection: "tho", overrideAccess: true, data: { ten: `Thợ kiểm thử ${TT}`, maBenDieuPhoi: `KT-${TT}`, diemSao: 4.9, soDanhGia: 100 } });
    await xepTho(payload, khongReq, d.ma, { tho: String(tho.id) });
    await taoBaoGia(payload, khongReq, d.ma, { hangMuc: BG.slice(0, 2) });
    await duyetBaoGia(payload, d.token, { dongY: true });
    await danhDauXong(payload, khongReq, d.ma, {});
    const tong = (await don(d.ma)).thanhToan!.soTien!;
    await nhanTien(payload, { maGiaoDich: `${TT}-dg`, soTien: tong, noiDung: d.ma, luc: new Date().toISOString(), nguon: "kt" });
    const id = (await don(d.ma)).id;
    await guiLinkDanhGiaDenHan(payload);
    assert.equal((await don(d.ma)).danhGia?.token ?? null, null, "chưa đủ 24 giờ thì chưa gửi");
    await guiLinkDanhGiaDenHan(payload, new Date(Date.now() + 25 * 3600 * 1000));
    const token = (await payload.findByID({ collection: "don-hang", id, overrideAccess: true })).danhGia?.token;
    assert.ok(token);
    const kq = await guiDanhGia(payload, token!, { soSao: 2, vanDe: ["tre"], moTa: "Thợ tới trễ" });
    assert.equal(kq.ketQua, "khieuNai");
    assert.match(String(kq.maPhieu), /^KN-\d{6}$/);
    const thoSau = await payload.findByID({ collection: "tho", id: tho.id, overrideAccess: true });
    assert.equal(thoSau.soDanhGia, 101);
    assert.equal(thoSau.diemSao, 4.87);
    await assert.rejects(guiDanhGia(payload, token!, { soSao: 5 }), (e: Error) => (e as LoiNguoiDung).ma === "DA_DANH_GIA");
    const kn = (await payload.find({ collection: "khieu-nai", where: { ma: { equals: kq.maPhieu } }, overrideAccess: true })).docs[0];
    assert.equal(kn.trangThai, "moi");
    await assert.rejects(payload.find({ collection: "khieu-nai", overrideAccess: false }), "khách không đọc được khiếu nại");
  });

  test("tra cứu xe: mã 6 số, sai quá 5 lần khoá, phiên xem lịch sử", async () => {
    const r = await guiMaTraCuu(payload, { bienSo: BIEN.replace(/\W/g, "").toLowerCase() });
    assert.match(r.sdtChe, /xxx/);
    assert.ok(r.maGiaLap, "máy chạy thử trả mã giả lập");
    await assert.rejects(guiMaTraCuu(payload, { bienSo: BIEN }), (e: Error) => (e as LoiNguoiDung).ma === "GUI_LAI_QUA_NHANH");
    const sai = r.maGiaLap === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) await assert.rejects(xacNhanMa(payload, { bienSo: BIEN, ma: sai }));
    await assert.rejects(xacNhanMa(payload, { bienSo: BIEN, ma: r.maGiaLap! }), (e: Error) => (e as LoiNguoiDung).ma === "SAI_QUA_NHIEU");
    // Mã mới (giả lập đã qua 45 giây)
    await payload.update({ collection: "ma-xac-nhan", where: { bienSo: { equals: BIEN } }, data: { guiLuc: new Date(Date.now() - 60000).toISOString() }, overrideAccess: true });
    const r2 = await guiMaTraCuu(payload, { bienSo: BIEN, kenh: "sms" });
    const { phien } = await xacNhanMa(payload, { bienSo: BIEN, ma: r2.maGiaLap! });
    const ls = await lichSuXe(payload, phien);
    assert.equal(ls.xe.bienSo, BIEN);
    assert.ok(ls.soLanSua >= 1);
    assert.ok(ls.lichSu.every((x) => x.ma?.startsWith("TT-")));
    await assert.rejects(lichSuXe(payload, "phien-sai-khong-co-that-day-du-dai"), (e: Error) => (e as LoiNguoiDung).ma === "HET_PHIEN");
  });
});

describe("nội dung: trang khu vực, hẹn giờ đăng", () => {
  test("trang khu vực: thiếu đoạn riêng, ảnh, đánh giá thì không gửi duyệt; đủ thì gửi được; chép sang quận khác bị chặn vì trùng", async () => {
    const quan = (await payload.find({ collection: "quan", where: { slug: { equals: "dong-da" } }, overrideAccess: true })).docs[0];
    await payload.delete({ collection: "trang-khu-vuc", where: { slug: { in: ["phanh-dong-da", "phanh-ba-dinh"] } }, overrideAccess: true });
    const t = await taoTrangKhuVucTuMau(payload, reqCua(nguoi.bienTap), { dichVu: "phanh", quan: "dong-da" });
    await assert.rejects(
      payload.update({ collection: "trang-khu-vuc", id: t.id, draft: true, user: nguoi.bienTap, overrideAccess: false, data: { trangThaiDuyet: "choDuyet" } }),
      /Chưa gửi duyệt được/,
    );
    const png = await QRCode.toBuffer("anh-that", { type: "png", width: 64 });
    const anh = [];
    for (const i of [1, 2]) {
      anh.push((await payload.create({ collection: "media", overrideAccess: true, data: { alt: `Thợ thay má phanh ở Đống Đa ${i}` }, file: { data: png, mimetype: "image/png", name: `${TT}-${i}.png`, size: png.length } })).id);
    }
    const dg = await payload.create({ collection: "danh-gia", overrideAccess: true, data: { noiDung: "Thợ thay má phanh nhanh, gọn.", tenHienThi: "Chị L.", soSao: 5, ngay: new Date().toISOString(), quan: quan.id, hienThi: true } });
    const doanRieng = Array.from({ length: 16 }, (_, i) => `Ở Đống Đa đoạn số ${i + 1} kể về phố Láng Hạ Thái Hà Kim Liên giờ cao điểm hầm toà nhà.`).join(" ");
    const ok = await payload.update({
      collection: "trang-khu-vuc", id: t.id, draft: true, user: nguoi.bienTap, overrideAccess: false,
      data: { doanRieng, anhThat: anh, danhGia: [dg.id], trangThaiDuyet: "choDuyet" },
    });
    assert.equal(ok.trangThaiDuyet, "choDuyet");
    // Chép nguyên sang Ba Đình: trùng > 70%
    const bd = (await payload.find({ collection: "quan", where: { slug: { equals: "ba-dinh" } }, overrideAccess: true })).docs[0];
    const dgBd = await payload.create({ collection: "danh-gia", overrideAccess: true, data: { noiDung: "Tốt.", tenHienThi: "Anh B.", soSao: 5, ngay: new Date().toISOString(), quan: bd.id, hienThi: true } });
    const sao = await payload.create({
      collection: "trang-khu-vuc", draft: true, overrideAccess: true,
      data: { _status: "draft", dichVu: ok.dichVu as number, quan: bd.id, title: "Thay má phanh ô tô tận nơi Ba Đình, thợ tới nhanh", description: ok.description, keyword: "phanh ô tô tận nơi ba đình", doanRieng, noiDung: ok.noiDung as never, anhThat: anh, danhGia: [dgBd.id] },
    });
    await assert.rejects(
      payload.update({ collection: "trang-khu-vuc", id: sao.id, draft: true, user: nguoi.bienTap, overrideAccess: false, data: { trangThaiDuyet: "choDuyet" } }),
      /Trùng \d+% nội dung/,
    );
  });

  test("hẹn giờ đăng: chỉ người duyệt; tới giờ thì việc định kỳ đăng bài", async () => {
    const bai = (await payload.find({ collection: "cam-nang", limit: 1, overrideAccess: true })).docs[0];
    await assert.rejects(payload.update({ collection: "cam-nang", id: bai.id, draft: true, user: nguoi.bienTap, overrideAccess: false, data: { trangThaiDuyet: "daHenGio", henGioDang: new Date(Date.now() + 3600000).toISOString() } }));
    await payload.update({ collection: "cam-nang", id: bai.id, draft: true, user: nguoi.quanLyDichVu, overrideAccess: false, data: { trangThaiDuyet: "daHenGio", henGioDang: new Date(Date.now() + 1000).toISOString() } });
    assert.equal(await dangBaiHenGio(payload, new Date(Date.now() - 1000)), 0, "chưa tới giờ");
    assert.ok((await dangBaiHenGio(payload, new Date(Date.now() + 5000))) >= 1);
    const sau = await payload.findByID({ collection: "cam-nang", id: bai.id, overrideAccess: true });
    assert.equal(sau._status, "published");
    assert.equal(sau.trangThaiDuyet, "daDuyet");
  });
});

describe("số liệu", () => {
  test("báo cáo theo tháng có đủ chuỗi, tỷ lệ là số, so với kỳ trước", async () => {
    const bc = await baoCaoSoLieu(payload, { ky: "thang", soKy: 3 });
    assert.equal(bc.nhan.length, 3);
    assert.equal(bc.luotVao.length, 3);
    assert.ok(typeof bc.kpi.tyLe.giaTri === "number");
    assert.ok(["%", "điểm"].includes(bc.kpi.tyLe.donVi));
    assert.ok(bc.soDon.at(-1)! >= 1);
  });
});
