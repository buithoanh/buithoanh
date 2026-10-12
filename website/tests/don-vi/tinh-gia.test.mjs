import { test } from "node:test";
import assert from "node:assert/strict";
import { baoGiaSoBo, dinhDangKhoang, dinhDangTien, giaHangMuc } from "../../lib/tinh-gia.mjs";

const acQuy = { loai: "phuTung", giaPhanKhuc: { A: { tu: 1200000, den: 1600000 }, B: { tu: 1350000, den: 2000000 }, C: { tu: 1600000, den: 2400000 }, D: { tu: 2000000, den: 2800000 } }, baoGiaSoBo: "luonCo", ten: "Ắc quy 12V" };
const congThay = { loai: "cong", gia: 150000, baoGiaSoBo: "luonCo", ten: "Công thay ắc quy" };
const kichNo = { loai: "cong", gia: 150000, baoGiaSoBo: "khong", ten: "Kích nổ" };
const lopMoi = { loai: "phuTung", giaPhanKhuc: { A: { tu: 900000, den: 1400000 }, B: { tu: 1200000, den: 1900000 }, C: { tu: 1700000, den: 2800000 }, D: { tu: 2400000, den: 4200000 } }, baoGiaSoBo: "coThe", ten: "Lốp mới" };
const vaLop = { loai: "cong", gia: 120000, baoGiaSoBo: "luonCo", ten: "Vá lốp" };
const AQ = { slug: "ac-quy", ten: "Ắc quy", baoGiaSoBo: true, hangMuc: [congThay, kichNo, acQuy] };
const LOP = { slug: "lop", ten: "Lốp", baoGiaSoBo: true, hangMuc: [vaLop, lopMoi] };
const DL = { slug: "doc-loi", ten: "Đọc lỗi", baoGiaSoBo: false, hangMuc: [{ loai: "cong", gia: 200000, baoGiaSoBo: "luonCo" }] };

test("giá hạng mục: công cố định, phụ tùng theo phân khúc, chưa biết xe thì khoảng A–D", () => {
  assert.deepEqual(giaHangMuc(congThay, "B"), { tu: 150000, den: 150000 });
  assert.deepEqual(giaHangMuc(acQuy, "B"), { tu: 1350000, den: 2000000 });
  assert.deepEqual(giaHangMuc(acQuy, null), { tu: 1200000, den: 2800000 });
  assert.deepEqual(giaHangMuc({ loai: "cong", gia: 0 }), { tu: 0, den: 0 });
});

test("báo giá sơ bộ ắc quy xe phân khúc B gồm phí đi lại", () => {
  const kq = baoGiaSoBo({ dichVu: [AQ], phanKhuc: "B", phiDiLai: 50000 });
  assert.equal(kq.trangThai, "coGia");
  assert.equal(kq.tu, 50000 + 150000 + 1350000);
  assert.equal(kq.den, 50000 + 150000 + 2000000);
  assert.ok(!kq.dong.some((d) => d.ten === "Kích nổ"), "hạng mục 'không tính' không vào báo giá");
});

test("nhiều dịch vụ: phí đi lại chỉ tính một lần; hạng mục 'có thể' chỉ cộng vào giá cao", () => {
  const kq = baoGiaSoBo({ dichVu: [AQ, LOP], phanKhuc: "B", phiDiLai: 50000 });
  assert.equal(kq.dong.filter((d) => d.loai === "phi").length, 1);
  assert.equal(kq.tu, 50000 + 150000 + 1350000 + 120000);
  assert.equal(kq.den, 50000 + 150000 + 2000000 + 120000 + 1900000);
  assert.ok(Number.isInteger(kq.tu) && Number.isInteger(kq.den));
});

test("có việc phức tạp thì cố vấn gọi lại; chưa chọn thì trống", () => {
  assert.equal(baoGiaSoBo({ dichVu: [AQ, DL], phanKhuc: "B", phiDiLai: 50000 }).trangThai, "coVanGoiLai");
  assert.equal(baoGiaSoBo({ dichVu: [], phiDiLai: 50000 }).trangThai, "chuaChon");
});

test("định dạng tiền VND", () => {
  assert.equal(dinhDangTien(1250000), "1.250.000đ");
  assert.equal(dinhDangTien(0, { mienPhi: true }), "Miễn phí");
  assert.equal(dinhDangKhoang(1200000, 2800000), "1.200.000 – 2.800.000đ");
  assert.equal(dinhDangKhoang(50000, 50000), "50.000đ");
  assert.equal(dinhDangTien(-5), "0đ");
});
