import { test } from "node:test";
import assert from "node:assert/strict";
import { chuanTen, diemTrongRanhGioi, ketLuanVung } from "../../lib/vung-phuc-vu.mjs";
import { lichDat, trongGioNhanGap, batDauKhung } from "../../lib/lich-dat.mjs";
import { cacBuoc, chuyenDuoc } from "../../lib/don/trang-thai.mjs";
import { ghiNhan, xoaGioiHan } from "../../lib/gioi-han.mjs";

const QUAN = [
  { ten: "Cầu Giấy", slug: "cau-giay", dangPhucVu: true, etaTu: 25, etaDen: 40,
    ranhGioi: { type: "Polygon", coordinates: [[[105.775, 21.015], [105.805, 21.015], [105.805, 21.05], [105.775, 21.05], [105.775, 21.015]]] } },
  { ten: "Ba Đình", slug: "ba-dinh", dangPhucVu: true, etaTu: 35, etaDen: 50 },
  { ten: "Tây Hồ", slug: "tay-ho", dangPhucVu: false, etaTu: 40, etaDen: 60 },
];
const PHUONG = [
  { ten: "Dịch Vọng Hậu", quan: "cau-giay", dangPhucVu: true },
  { ten: "Phúc Xá", quan: "ba-dinh", dangPhucVu: false, ghiChu: "Khu ngoài đê" },
];

test("so tên quận/phường bỏ dấu và tiền tố", () => {
  assert.equal(chuanTen("Quận Cầu Giấy"), chuanTen("cau giay"));
  assert.equal(chuanTen("Phường Dịch Vọng Hậu"), "dich vong hau");
  assert.equal(chuanTen("Đống Đa"), "dong da");
});

test("vùng phục vụ: trong vùng, phường tắt, quận chưa phục vụ, ngoài vùng", () => {
  const a = ketLuanVung({ quan: QUAN, phuong: PHUONG, diaGioi: { quan: "Quận Cầu Giấy", phuong: "Phường Dịch Vọng Hậu" } });
  assert.equal(a.trongVung, true);
  assert.deepEqual(a.eta, { tu: 25, den: 40 });
  const b = ketLuanVung({ quan: QUAN, phuong: PHUONG, diaGioi: { quan: "Ba Đình", phuong: "Phúc Xá" } });
  assert.equal(b.trongVung, false);
  assert.equal(b.lyDo, "phuongTamTat");
  assert.equal(ketLuanVung({ quan: QUAN, phuong: PHUONG, diaGioi: { quan: "Tây Hồ" } }).lyDo, "quanChuaPhucVu");
  assert.equal(ketLuanVung({ quan: QUAN, phuong: PHUONG, diaGioi: { quan: "Hoài Đức" } }).lyDo, "ngoaiQuan");
});

test("vùng phục vụ theo toạ độ khi bản đồ không trả tên quận (ranh giới GeoJSON)", () => {
  assert.equal(diemTrongRanhGioi(105.79, 21.03, QUAN[0].ranhGioi), true);
  assert.equal(diemTrongRanhGioi(105.70, 21.03, QUAN[0].ranhGioi), false);
  const k = ketLuanVung({ quan: QUAN, phuong: PHUONG, diaGioi: {}, toaDo: { lat: 21.03, lng: 105.79 } });
  assert.equal(k.trongVung, true);
  assert.equal(k.quan.slug, "cau-giay");
});

const KHUNG = [
  { ma: "08-10", batDau: "08:00", ketThuc: "10:00", soDonToiDa: 2, ngayTrongTuan: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] },
  { ma: "14-16", batDau: "14:00", ketThuc: "16:00", soDonToiDa: 2, ngayTrongTuan: ["T2", "T3", "T4", "T5", "T6", "T7"] },
];

test("khung giờ: đầy, đã qua, ngày nghỉ, chủ nhật nghỉ chiều", () => {
  // 08/10/2026 là thứ Năm; 09:30 giờ VN = 02:30 UTC
  const bayGio = new Date("2026-10-08T02:30:00Z");
  const daDat = new Map([["2026-10-09|08-10", 2]]);
  const ngay = lichDat({ khungGio: KHUNG, ngayNghi: ["2026-10-10"], daDat, soNgay: 4, phutChuanBi: 60, bayGio });
  assert.deepEqual(ngay.map((n) => n.ngay), ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
  assert.equal(ngay[0].nhan, "Hôm nay");
  assert.equal(ngay[0].khung[0].daQua, true, "08–10 hôm nay đã qua");
  assert.equal(ngay[0].khung[1].datDuoc, true);
  assert.equal(ngay[1].khung[0].day, true, "khung đủ 2 đơn là đầy");
  assert.equal(ngay[1].khung[0].datDuoc, false);
  assert.equal(ngay[2].nghi, true);
  assert.equal(ngay[2].khung.length, 0);
  assert.equal(ngay[3].thu, "CN");
  assert.deepEqual(ngay[3].khung.map((k) => k.ma), ["08-10"]);
  assert.equal(ngay[1].khung[0].nhan, "8h – 10h");
});

test("giờ nhận đơn gấp và giờ bắt đầu khung (UTC+7)", () => {
  assert.equal(trongGioNhanGap({ tu: "06:00", den: "22:00" }, new Date("2026-10-08T02:30:00Z")), true);
  assert.equal(trongGioNhanGap({ tu: "06:00", den: "22:00" }, new Date("2026-10-08T16:00:00Z")), false);
  assert.equal(batDauKhung("2026-10-09", "08:00"), "2026-10-09T01:00:00.000Z");
});

test("luồng trạng thái đơn: chỉ đi tới, huỷ khi chưa xong, đơn xong thì đứng yên", () => {
  assert.equal(chuyenDuoc("daNhan", "daXepTho").ok, true);
  assert.equal(chuyenDuoc("daNhan", "dangSua").ok, true, "được bỏ qua bước");
  assert.equal(chuyenDuoc("dangSua", "daXepTho").ok, false);
  assert.equal(chuyenDuoc("thoDangDen", "huy").ok, true);
  assert.equal(chuyenDuoc("hoanThanh", "huy").ok, false);
  assert.equal(chuyenDuoc("huy", "daNhan").ok, false);
  assert.equal(chuyenDuoc("hoanThanh", "dangSua", { choPhepLui: true }).ok, true);
  assert.equal(chuyenDuoc("daNhan", "khong-co").ok, false);
  const b = cacBuoc("thoDangDen", [{ trangThai: "daNhan", luc: "t1" }, { trangThai: "daXepTho", luc: "t2" }, { trangThai: "thoDangDen", luc: "t3" }]);
  assert.deepEqual(b.map((x) => x.tinhTrang), ["done", "done", "now", "todo", "todo", "todo", "todo"]);
  assert.equal(b[1].luc, "t2");
  assert.ok(cacBuoc("hoanThanh").every((x) => x.tinhTrang === "done"));
});

test("giới hạn tần suất", () => {
  xoaGioiHan();
  const g = { toiDa: 3, trongMs: 60000 };
  assert.equal(ghiNhan("ip:1", g).vuot, false);
  ghiNhan("ip:1", g); ghiNhan("ip:1", g);
  const r = ghiNhan("ip:1", g);
  assert.equal(r.vuot, true);
  assert.ok(r.conLaiGiay > 0);
  assert.equal(ghiNhan("ip:2", g).vuot, false, "khoá khác không ảnh hưởng");
});
