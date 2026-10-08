import { test } from "node:test";
import assert from "node:assert/strict";
import { tinhThanhToan } from "../../lib/bao-gia.mjs";
import { tinhGiam } from "../../lib/khuyen-mai.mjs";
import { bangSoSanh, congThang, conLuot, giaMoiThang, hieuLucMoi, MA_GIOI_THIEU, taoMaGioiThieu } from "../../lib/quyen-loi.mjs";
import { kiemTraYeuCauDoanhNghiep, kiemTraHoSoTho } from "../../lib/p2-dau-vao.mjs";

// Gói theo thiết kế HoiVien
const CO_BAN = { ten: "Cơ bản", mienDiLaiSoLan: 4, mienKichNoSoLan: 2, mienVaLopSoLan: 0, giamCongPhanTram: 10, uuTienGoiGap: false };
const AN_TAM = { ten: "An tâm", mienDiLaiSoLan: null, mienKichNoSoLan: null, mienVaLopSoLan: null, giamCongPhanTram: 15, uuTienGoiGap: true };
const KICH_NO = { ten: "Kích nổ tại chỗ", loai: "cong", gia: 150000, quyenLoi: "kichNo" };
const VA_LOP = { ten: "Vá lốp không săm", loai: "cong", gia: 120000, quyenLoi: "vaLop" };
const MA_PHANH = { ten: "Má phanh trước", loai: "phuTung", gia: 900000 };
const CONG_PHANH = { ten: "Công thay má phanh", loai: "cong", gia: 200000 };

test("hội viên An tâm: miễn đi lại, kích nổ, vá lốp; giảm 15% phần tiền công còn lại", () => {
  const t = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [KICH_NO, VA_LOP, CONG_PHANH, MA_PHANH] }], phiDiLai: 50000, hoiVien: AN_TAM });
  assert.equal(t.tienCong, 470000);
  assert.equal(t.suDung.mienDiLai, "hoiVien");
  assert.equal(t.suDung.kichNo, 1);
  assert.equal(t.suDung.vaLop, 1);
  assert.equal(t.suDung.giamHoiVien, 30000); // 15% của 200.000 công phanh, phụ tùng không giảm
  assert.equal(t.tong, 200000 - 30000 + 900000);
  assert.equal(t.dong.reduce((a, d) => a + d.soTien, 0), t.tong, "các dòng cộng lại đúng tổng");
});

test("hội viên Cơ bản: hết lượt miễn thì tính giá thường; vá lốp không có trong gói", () => {
  const dung = { ...CO_BAN, daDung: { diLai: 4, kichNo: 1, vaLop: 0 } };
  const t = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [KICH_NO, { ...KICH_NO, ten: "Kích nổ lần 2" }, VA_LOP] }], phiDiLai: 50000, hoiVien: dung });
  assert.equal(t.suDung.mienDiLai, null, "đã dùng 4/4 lượt đi lại");
  assert.equal(t.suDung.kichNo, 1, "còn đúng 1 lượt kích nổ");
  assert.equal(t.suDung.vaLop, 0);
  // công còn lại: kích nổ lần 2 150.000 + vá lốp 120.000 = 270.000, giảm 10% = 27.000
  assert.equal(t.suDung.giamHoiVien, 27000);
  assert.equal(t.tong, 270000 - 27000 + 50000);
});

test("giảm hội viên và mã khuyến mãi không cộng dồn: lấy mức lợi hơn cho khách", () => {
  const km15 = { kieuGiam: "phanTram", giaTri: 20, giamToiDa: 100000 };
  const ma = (tc, tong) => tinhGiam(km15, { tienCong: tc, tongTien: tong });
  const it = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [CONG_PHANH] }], phiDiLai: 50000, hoiVien: CO_BAN, tinhGiamMa: ma, tenMa: "KM-20" });
  assert.equal(it.suDung.giamMa, 40000, "mã 20% (40.000) lớn hơn hội viên 10% (20.000)");
  assert.equal(it.suDung.giamHoiVien, 0);
  assert.ok(it.dong.some((d) => d.ten === "Giảm giá (mã KM-20)"));
  const nhieu = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [CONG_PHANH] }], phiDiLai: 50000, hoiVien: AN_TAM, tinhGiamMa: () => 10000 });
  assert.equal(nhieu.suDung.giamHoiVien, 30000);
  assert.equal(nhieu.suDung.giamMa, 0);
});

test("giới thiệu: bạn mới miễn đi lại đơn đầu; người giới thiệu dùng lượt thưởng; hội viên ưu tiên trước", () => {
  const ban = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [CONG_PHANH] }], phiDiLai: 50000, gioiThieu: { banMoi: true } });
  assert.equal(ban.suDung.mienDiLai, "banMoi");
  assert.equal(ban.tong, 200000);
  const luot = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [CONG_PHANH] }], phiDiLai: 50000, gioiThieu: { luotConLai: 2 } });
  assert.equal(luot.suDung.mienDiLai, "luotGioiThieu");
  const het = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [CONG_PHANH] }], phiDiLai: 50000, gioiThieu: { luotConLai: 0 } });
  assert.equal(het.suDung.mienDiLai, null);
  assert.equal(het.tong, 250000);
  const hv = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [CONG_PHANH] }], phiDiLai: 50000, hoiVien: AN_TAM, gioiThieu: { luotConLai: 2 } });
  assert.equal(hv.suDung.mienDiLai, "hoiVien", "không tiêu lượt giới thiệu khi gói đã miễn");
});

test("không quyền lợi thì giữ nguyên cách tính P1; từ chối báo giá chỉ thu phí kiểm tra", () => {
  const t = tinhThanhToan({ baoGiaDaDuyet: [{ chon: [CONG_PHANH, MA_PHANH] }], phiDiLai: 50000, giam: 20000 });
  assert.equal(t.tong, 1130000);
  assert.equal(t.giam, 20000);
  const tc = tinhThanhToan({ tuChoi: true, phiKiemTra: 100000, hoiVien: AN_TAM });
  assert.equal(tc.tong, 100000);
});

test("thời hạn gói: 12 tháng từ lúc thanh toán, gia hạn sớm nối tiếp, cuối tháng", () => {
  assert.equal(congThang("2027-01-31T03:00:00.000Z", 1), "2027-02-28T03:00:00.000Z");
  assert.equal(congThang("2028-02-29T03:00:00.000Z", 12), "2029-02-28T03:00:00.000Z");
  const moi = hieuLucMoi({ thanhToanLuc: "2026-10-08T04:00:00.000Z" });
  assert.equal(moi.hetHan, "2027-10-08T04:00:00.000Z");
  const giaHan = hieuLucMoi({ thanhToanLuc: "2027-09-01T00:00:00.000Z", hetHanCu: "2027-10-08T04:00:00.000Z" });
  assert.equal(giaHan.batDau, "2027-10-08T04:00:00.000Z");
  assert.equal(giaHan.hetHan, "2028-10-08T04:00:00.000Z");
  const quaHan = hieuLucMoi({ thanhToanLuc: "2028-01-01T00:00:00.000Z", hetHanCu: "2027-10-08T04:00:00.000Z" });
  assert.equal(quaHan.batDau, "2028-01-01T00:00:00.000Z");
});

test("bảng so sánh gói theo thiết kế, giá mỗi tháng, lượt còn lại", () => {
  const b = bangSoSanh([CO_BAN, AN_TAM], { phiDiLai: 50000, kichNo: { ten: "Kích nổ ắc quy", gia: 150000 }, vaLop: { ten: "Vá lốp không săm", gia: 120000 } });
  assert.deepEqual(b.map((h) => h.ten), ["Phí đi lại (50.000đ/lần)", "Kích nổ ắc quy (150.000đ)", "Vá lốp không săm (120.000đ)", "Giảm tiền công", "Ưu tiên xếp thợ khi gọi gấp"]);
  assert.deepEqual(b[0].goi.map((o) => o.chu), ["Miễn 4 lần/năm", "Miễn không giới hạn"]);
  assert.deepEqual(b[2].goi.map((o) => [o.chu, o.co]), [["Giá thường", false], ["Miễn phí", true]]);
  assert.deepEqual(b[3].goi.map((o) => o.chu), ["Giảm 10%", "Giảm 15%"]);
  assert.equal(giaMoiThang(490000), 41000);
  assert.equal(giaMoiThang(1290000), 108000);
  assert.equal(conLuot(null, 99), Infinity);
  assert.equal(conLuot(0), 0);
  assert.equal(conLuot(4, 5), 0);
});

test("mã giới thiệu: tên gọi không dấu + 4 số", () => {
  assert.equal(taoMaGioiThieu("Trần Minh Tuấn", 2481), "TUAN2481");
  assert.equal(taoMaGioiThieu("Nguyễn Thị Ánh Nguyệt", 7), "NGUYET0007");
  assert.equal(taoMaGioiThieu("Đặng Đức", 12345), "DUC2345");
  assert.equal(taoMaGioiThieu("", 1), "BAN0001");
  assert.ok(MA_GIOI_THIEU.test("TUAN2481"));
  assert.ok(!MA_GIOI_THIEU.test("XANG-TDH12"));
});

test("yêu cầu báo giá doanh nghiệp: bắt buộc, MST, số xe, đồng ý dữ liệu", () => {
  const ok = kiemTraYeuCauDoanhNghiep({
    tenCongTy: "Công ty TNHH Vận tải Mẫu", mst: "0101234567", soXe: "42", loaiXe: "4-5-cho", loaiDoiXe: "thue", khuVuc: ["dong-da", "khac"],
    nguoiLienHe: "Phạm Lan", sdt: "0988 216 400", email: "lan@vantaimau.vn", dongY: true,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.duLieu.sdt, "0988216400");
  assert.equal(ok.duLieu.soXe, 42);
  const loi = kiemTraYeuCauDoanhNghiep({ mst: "12345", soXe: "0", loaiXe: "tau", email: "x@", dongY: false });
  assert.equal(loi.ok, false);
  for (const k of ["dongY", "tenCongTy", "mst", "soXe", "loaiXe", "loaiDoiXe", "khuVuc", "nguoiLienHe", "sdt", "email"]) assert.ok(loi.loi[k], `thiếu lỗi ô ${k}`);
});

test("hồ sơ thợ cộng tác: kinh nghiệm, khu vực, dụng cụ, đồng ý dữ liệu", () => {
  const ok = kiemTraHoSoTho({ hoTen: "Lê Văn Bình", sdt: "0977123456", namKinhNghiem: "4-5", khuVuc: ["cau-giay"], dungCu: ["obd", "kich", "obd"], dongY: "true" });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.duLieu.dungCu, ["obd", "kich"]);
  const loi = kiemTraHoSoTho({ hoTen: "", sdt: "123", namKinhNghiem: "1", khuVuc: [], dungCu: ["phi-thuyen"] });
  assert.equal(loi.ok, false);
  for (const k of ["dongY", "hoTen", "sdt", "namKinhNghiem", "khuVuc", "dungCu"]) assert.ok(loi.loi[k], `thiếu lỗi ô ${k}`);
});
