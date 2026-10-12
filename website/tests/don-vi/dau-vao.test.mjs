import { test } from "node:test";
import assert from "node:assert/strict";
import { kiemTraDauVao, laBot } from "../../lib/don/dau-vao.mjs";
import { kenhNguon } from "../../lib/don/nguon.mjs";

const datLich = {
  dichVu: ["ac-quy"], xe: { hang: "toyota", dong: "toyota-vios", doi: 2019, bienSo: "30a12345" },
  viTri: { diaChi: "18 Trần Thái Tông, Cầu Giấy", choDo: "ham" }, khungGio: { ngay: "2026-10-09", ma: "08-10" },
  khach: { hoTen: "Hoàng", sdt: "0912 345 678" }, dongY: true,
};

test("đơn đặt lịch hợp lệ: chuẩn hoá biển số, số điện thoại", () => {
  const kq = kiemTraDauVao("datLich", datLich);
  assert.equal(kq.ok, true);
  assert.equal(kq.duLieu.xe.bienSo, "30A-123.45");
  assert.equal(kq.duLieu.khach.sdt, "0912345678");
});

test("chưa đồng ý xử lý dữ liệu thì không nhận", () => {
  const kq = kiemTraDauVao("datLich", { ...datLich, dongY: false });
  assert.equal(kq.ok, false);
  assert.match(kq.loi.dongY, /đồng ý/);
});

test("báo lỗi tiếng Việt theo từng ô", () => {
  const kq = kiemTraDauVao("datLich", { dongY: true, khach: { sdt: "12" }, xe: { bienSo: "xx", doi: 1800 }, hoaDon: { mst: "123" } });
  assert.equal(kq.ok, false);
  for (const k of ["dichVu", "khach.sdt", "khach.hoTen", "xe.bienSo", "xe.doi", "viTri.diaChi", "viTri.choDo", "khungGio", "hoaDon.mst", "xe.dong"]) {
    assert.ok(kq.loi[k], `thiếu lỗi ô ${k}`);
  }
});

test("gọi gấp chỉ cần sự cố, vị trí, số điện thoại", () => {
  const kq = kiemTraDauVao("khanCap", { suCo: "aq", viTri: { lat: 21.03, lng: 105.79 }, khach: { sdt: "0987654321" }, dongY: "on" });
  assert.equal(kq.ok, true);
  assert.equal(kiemTraDauVao("khanCap", { suCo: "aq", viTri: { lat: 200, lng: 105 }, khach: { sdt: "0987654321" }, dongY: true }).ok, false);
});

test("mã giới thiệu từ link ?ma= và ô bẫy bot", () => {
  const kq = kiemTraDauVao("datLich", { ...datLich, nguon: { ma: "tuan2481", utm_source: "google" } });
  assert.equal(kq.duLieu.maGioiThieu, "TUAN2481");
  assert.equal(laBot({ website: "http://spam" }), true);
  assert.equal(laBot({ website: "" }), false);
});

test("xếp kênh nguồn khách", () => {
  assert.equal(kenhNguon({ utmSource: "google", utmMedium: "cpc" }), "Google");
  assert.equal(kenhNguon({ referrer: "https://www.google.com/" }), "Google");
  assert.equal(kenhNguon({ maKhuyenMai: "XANG-TDH12" }), "QR cây xăng");
  assert.equal(kenhNguon({ maKhuyenMai: "KOC-LINHXEHOP", utmSource: "tiktok" }), "KOC");
  assert.equal(kenhNguon({ utmSource: "facebook" }), "Facebook");
  assert.equal(kenhNguon({ maGioiThieu: "TUAN2481" }), "Giới thiệu");
  assert.equal(kenhNguon({}), "Trực tiếp");
});
