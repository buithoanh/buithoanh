import { test } from "node:test";
import assert from "node:assert/strict";
import { crc16, noiDungChuyenKhoan, taoChuoiVietQR, timMaTrongNoiDung } from "../../lib/vietqr.mjs";
import { kiemTraMa, moTaGiam, tinhGiam, tinhHoaHong, trangThaiMa } from "../../lib/khuyen-mai.mjs";
import { chonHangMuc, tinhThanhToan } from "../../lib/bao-gia.mjs";
import { conLai, hangMucBaoHanh, mocBaoDuong } from "../../lib/bao-hanh.mjs";
import { tyLeTrung } from "../../lib/trung-noi-dung.mjs";
import { cacMucKiemTra } from "../../lib/kiem-tra.mjs";

test("VietQR: CRC16 chuẩn, chuỗi EMVCo có đủ trường", () => {
  assert.equal(crc16("123456789"), "29B1"); // giá trị kiểm chuẩn của CRC-16/CCITT-FALSE
  const s = taoChuoiVietQR({ maBin: "970436", soTaiKhoan: "1023 456 789", soTien: 1970000, noiDung: "TT000123" });
  assert.ok(s.startsWith("000201010212"));
  assert.ok(s.includes("0010A000000727"));
  assert.ok(s.includes("0006970436011010234567890208QRIBFTTA"));
  assert.ok(s.includes("54071970000"));
  assert.ok(s.includes("0808TT000123"));
  assert.equal(s.slice(-4), crc16(s.slice(0, -4)));
  assert.throws(() => taoChuoiVietQR({ maBin: "97", soTaiKhoan: "1", soTien: 1, noiDung: "x" }));
  assert.throws(() => taoChuoiVietQR({ maBin: "970436", soTaiKhoan: "1023456789", soTien: 10.5, noiDung: "x" }));
});

test("VietQR: nội dung chuyển khoản và nhận lại mã đơn", () => {
  assert.equal(noiDungChuyenKhoan("TT-000123"), "TT000123");
  assert.equal(timMaTrongNoiDung("NGUYEN VAN A chuyen tien TT000123 FT2628"), "TT-000123");
  assert.equal(timMaTrongNoiDung("tt 000123"), "TT-000123");
  assert.equal(timMaTrongNoiDung("chuyen khoan"), null);
});

const MA = { kieuGiam: "phanTram", giaTri: 10, giamToiDa: 100000, batDau: "2027-01-01", hetHan: "2027-12-31T23:59:59Z", soLuotToiDa: 300 };

test("mã khuyến mãi: trạng thái và lý do khi khách nhập", () => {
  const bayGio = new Date("2027-06-01");
  assert.equal(trangThaiMa(MA, { daDung: 10, bayGio }), "dangChay");
  assert.equal(trangThaiMa(MA, { daDung: 300, bayGio }), "hetLuot");
  assert.equal(trangThaiMa(MA, { bayGio: new Date("2028-01-02") }), "hetHan");
  assert.equal(trangThaiMa(MA, { bayGio: new Date("2026-12-01") }), "chuaBatDau");
  assert.equal(trangThaiMa({ ...MA, tamDung: true }, { bayGio }), "tamDung");
  assert.match(kiemTraMa(MA, { daDung: 300, bayGio }).lyDo, /hết lượt/);
  assert.match(kiemTraMa(MA, { sdtDaDung: true, bayGio }).lyDo, /đã dùng/);
  assert.equal(kiemTraMa({ ...MA, moiSdtMotLan: false }, { sdtDaDung: true, bayGio }).hopLe, true);
  assert.equal(kiemTraMa(null).hopLe, false);
  assert.equal(moTaGiam(MA), "Giảm 10% tiền công (tối đa 100.000đ)");
});

test("giảm giá: % chỉ trên tiền công có mức tối đa; số tiền không vượt tổng", () => {
  assert.equal(tinhGiam(MA, { tienCong: 300000, tongTien: 2000000 }), 30000);
  assert.equal(tinhGiam(MA, { tienCong: 3000000, tongTien: 5000000 }), 100000);
  assert.equal(tinhGiam({ kieuGiam: "soTien", giaTri: 50000 }, { tienCong: 0, tongTien: 1000000 }), 50000);
  assert.equal(tinhGiam({ kieuGiam: "soTien", giaTri: 50000 }, { tienCong: 0, tongTien: 30000 }), 30000);
  assert.equal(tinhGiam(null, { tienCong: 1, tongTien: 1 }), 0);
  assert.equal(tinhHoaHong(40120000, 5), 2006000);
  assert.equal(tinhHoaHong(1000001, 7.5), 75000);
});

const BG = [
  { ma: "aq", ten: "Ắc quy 12V 45Ah", loai: "phuTung", gia: 1650000, batBuoc: true },
  { ma: "cong", ten: "Công thay ắc quy", loai: "cong", gia: 150000, batBuoc: true },
  { ma: "coc", ten: "Vệ sinh cọc", loai: "cong", gia: 120000 },
  { ma: "gat", ten: "Lưỡi gạt mưa", loai: "phuTung", gia: 280000 },
];

test("báo giá: bỏ hạng mục tuỳ chọn, không bỏ được hạng mục bắt buộc", () => {
  const kq = chonHangMuc(BG, ["gat"]);
  assert.equal(kq.ok, true);
  assert.equal(kq.tienCong, 270000);
  assert.equal(kq.phuTung, 1650000);
  assert.equal(chonHangMuc(BG, ["aq"]).ok, false);
  assert.equal(chonHangMuc(BG, ["khong-co"]).ok, false);
});

test("thanh toán: như thiết kế ThanhToan (1.970.000đ); từ chối chỉ thu phí kiểm tra; giảm giá", () => {
  const t = tinhThanhToan({ baoGiaDaDuyet: [chonHangMuc(BG, ["gat"])], phiDiLai: 50000 });
  assert.equal(t.tong, 1970000);
  assert.equal(t.dong.at(-1).ten, "Phí đi lại");
  const tc = tinhThanhToan({ tuChoi: true, phiKiemTra: 100000 });
  assert.equal(tc.tong, 100000);
  const g = tinhThanhToan({ baoGiaDaDuyet: [chonHangMuc(BG, [])], phiDiLai: 50000, giam: 27000 });
  assert.equal(g.tong, 1650000 + 150000 + 120000 + 280000 + 50000 - 27000);
  const phatSinh = tinhThanhToan({ baoGiaDaDuyet: [chonHangMuc(BG, ["gat"]), { chon: [{ ten: "Thay cầu chì", loai: "cong", gia: 80000 }] }], phiDiLai: 50000 });
  assert.equal(phatSinh.tong, 2050000, "phát sinh cộng thêm, phí đi lại tính một lần");
});

test("bảo hành: phụ tùng 6 tháng, công 3 tháng, phần trăm còn lại; mốc bảo dưỡng", () => {
  const bh = hangMucBaoHanh([...BG, { ten: "Phí đi lại", loai: "phi", gia: 50000 }], { tuNgay: "2026-10-08T04:47:00.000Z", thangPhuTung: 6, thangCong: 3 });
  assert.equal(bh.length, 4);
  assert.equal(bh[0].denNgay.slice(0, 10), "2027-04-08");
  assert.equal(bh[1].denNgay.slice(0, 10), "2027-01-08");
  const c = conLai({ tuNgay: "2027-03-15T00:00:00Z", denNgay: "2027-09-15T00:00:00Z" }, new Date("2027-05-20T00:00:00Z"));
  assert.equal(c.conNgay, 118);
  assert.equal(c.phanTram, 64);
  assert.equal(conLai({ tuNgay: "2027-01-01", denNgay: "2027-02-01" }, new Date("2027-03-01")).hetHan, true);
  const m = mocBaoDuong({ kmGanNhat: 48200, lanBaoDuongCuoi: { ngay: "2027-01-08T00:00:00Z", km: 45120 }, chuKyKm: 5000, chuKyThang: 6 });
  assert.equal(m.mocKm, 50000);
  assert.equal(m.conKm, 1800);
  assert.equal(m.ngayDuKien.slice(0, 10), "2027-07-08");
  assert.equal(hangMucBaoHanh([{ ten: "x", loai: "cong" }], { tuNgay: "2027-01-31T00:00:00Z", thangPhuTung: 6, thangCong: 1 })[0].denNgay.slice(0, 10), "2027-02-28");
});

test("trùng nội dung: đổi mỗi tên quận vẫn trùng gần hết", () => {
  const goc = "Ở Cầu Giấy thợ hay được gọi tới hầm các toà chung cư quanh Trung Hòa Yên Hòa và bãi đỗ dọc Trần Thái Tông Duy Tân. Xe đỗ hầm lâu ngày buổi sáng dễ hết ắc quy.";
  const doiTen = goc.replace(/Cầu Giấy/g, "Thanh Xuân");
  assert.ok(tyLeTrung(doiTen, goc) > 0.7);
  assert.ok(tyLeTrung("Đường Nguyễn Trãi và Khuất Duy Tiến hay có đinh vít rơi từ công trình nên thợ mang đủ đồ vá lốp không săm", goc) < 0.1);
  assert.equal(tyLeTrung("ngắn", goc), 0);
});

test("luật trang khu vực chặn khi thiếu đoạn riêng, ảnh, đánh giá hoặc trùng quá 70%", () => {
  const slugs = { "dich-vu": new Set(), "cam-nang": new Set() };
  const data = { title: "Thay ắc quy ô tô tận nơi Thanh Xuân", description: "x".repeat(120), keyword: "thay ắc quy", dichVu: 1, quan: 2 };
  const muc = cacMucKiemTra({ loai: "khu-vuc", data, markdown: "thay ắc quy " + "chữ ".repeat(400), slugs,
    khuVuc: { soChuDoanRieng: 40, soAnh: 1, soAnhThieuMoTa: 0, soDanhGiaThat: 0, tyLeTrung: 0.82, trangTrung: "/dich-vu/ac-quy/cau-giay/" } });
  const loi = muc.filter((m) => !m.ok && m.level === "error").map((m) => m.label);
  assert.ok(loi.some((l) => l.includes("150 chữ")));
  assert.ok(loi.some((l) => l.includes("2 ảnh")));
  assert.ok(loi.some((l) => l.includes("đánh giá")));
  assert.ok(loi.some((l) => l.includes("70%")));
  const dat = cacMucKiemTra({ loai: "khu-vuc", data, markdown: "thay ắc quy " + "chữ ".repeat(400), slugs,
    khuVuc: { soChuDoanRieng: 160, soAnh: 2, soAnhThieuMoTa: 0, soDanhGiaThat: 1, tyLeTrung: 0.31 } });
  assert.equal(dat.filter((m) => !m.ok && m.level === "error").length, 0);
});
