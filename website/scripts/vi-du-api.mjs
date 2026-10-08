// Gọi API trên server đang chạy (dữ liệu mẫu, tích hợp giả lập) rồi chép request/response thật vào docs/api.md,
// giữa các dấu <!-- vi-du:ten --> ... <!-- /vi-du -->.
//   BASE_URL=http://localhost:3000 node scripts/vi-du-api.mjs
// Cần: npm run nap-du-lieu khi chạy thử (có tài khoản thử dieuphoi@ / quanly@, mật khẩu MAT_KHAU_TAI_KHOAN_THU).
// Script tạo vài đơn mới và đổi giá một hạng mục rồi trả lại giá cũ: chỉ chạy trên máy chạy thử.
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const MAT_KHAU = process.env.MAT_KHAU_TAI_KHOAN_THU || "ThoToi-ThuNghiem-2026";
const FILE = new URL("../docs/api.md", import.meta.url);
let ip = 0;

function rutGon(v, sau = 0) {
  if (typeof v === "string" && v.startsWith("data:image/")) return v.slice(0, 40) + "…";
  if (Array.isArray(v)) {
    const giu = v.slice(0, 2).map((x) => rutGon(x, sau + 1));
    return v.length > 2 ? [...giu, `… (còn ${v.length - 2} mục)`] : giu;
  }
  if (v && typeof v === "object") {
    if (v.root && v.root.children) return "(nội dung Lexical JSON, rút gọn)";
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rutGon(x, sau + 1)]));
  }
  return v;
}

async function goi(method, path, body, headers = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.9.0.${++ip}`, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, json };
}

function khoi(method, path, body, res, ghiChu = "") {
  const req = `${method} ${path}${body ? `\n\n${JSON.stringify(body, null, 2)}` : ""}`;
  return `${ghiChu ? `${ghiChu}\n\n` : ""}Request:\n\`\`\`http\n${req}\n\`\`\`\nResponse \`${res.status}\`:\n\`\`\`json\n${JSON.stringify(rutGon(res.json), null, 2)}\n\`\`\``;
}

const viDu = {};
async function ghi(ten, method, path, body, headers, ghiChu) {
  const res = await goi(method, path, body, headers);
  viDu[ten] = khoi(method, path, body, res, ghiChu);
  return res;
}

const dangNhap = async (email) => {
  const r = await goi("POST", "/api/users/login", { email, password: MAT_KHAU });
  if (!r.json.token) throw new Error(`Không đăng nhập được ${email}: chạy npm run nap-du-lieu (chế độ chạy thử) trước.`);
  return { Authorization: `JWT ${r.json.token}` };
};

await ghi("chung", "GET", "/api/trang/chung");
await ghi("chu", "GET", "/api/trang/chu");
await ghi("bang-gia", "GET", "/api/trang/bang-gia?phanKhuc=B");
await ghi("dich-vu", "GET", "/api/trang/dich-vu/ac-quy");
await ghi("khu-vuc", "GET", "/api/trang/khu-vuc/ac-quy/cau-giay");
await ghi("hang-xe", "GET", "/api/trang/hang-xe/toyota");
await ghi("xe", "GET", "/api/xe?hang=vinfast&xeDien=1");
await ghi("bao-gia", "POST", "/api/bao-gia-so-bo", { dichVu: ["ac-quy", "lop"], dongXe: "toyota-vios" });
await ghi("vung", "POST", "/api/vung-phuc-vu/kiem-tra", { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy" });
viDu.vung += "\n\n" + khoi("POST", "/api/vung-phuc-vu/kiem-tra", { lat: 21.04, lng: 105.7 },
  await goi("POST", "/api/vung-phuc-vu/kiem-tra", { lat: 21.04, lng: 105.7 }), "Ngoài vùng:");
const lich = await ghi("khung-gio", "GET", "/api/lich-dat/khung-gio?soNgay=2");
await ghi("trang-dat-lich", "GET", "/api/trang/dat-lich");
await ghi("trang-goi-gap", "GET", "/api/trang/goi-gap");

// Khung còn chỗ gần nhất để đặt thử
const lich7 = await goi("GET", "/api/lich-dat/khung-gio?soNgay=7");
const ngay = lich7.json.ngay.find((n) => n.khung.some((k) => k.datDuoc));
const khung = ngay.khung.find((k) => k.datDuoc);
void lich;
const donDatLich = {
  dichVu: ["ac-quy"], trieuChung: "Sáng đề không nổ, đèn táp-lô mờ",
  xe: { hang: "toyota", dong: "toyota-vios", doi: 2019, bienSo: "30a12345", soKm: 48000 },
  viTri: { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy", choDo: "ham", ghiChuChoTho: "Hầm B2, ô 112" },
  khungGio: { ngay: ngay.ngay, ma: khung.ma },
  khach: { hoTen: "Nguyễn Văn Hoàng", sdt: "0912 345 678" },
  dongY: true, nhacBaoDuong: true,
  nguon: { utm_source: "google", utm_medium: "cpc", trangVao: "/dich-vu/ac-quy/" },
  website: "",
};
const dl = await ghi("dat-lich", "POST", "/api/don-hang/dat-lich", donDatLich);
await ghi("dat-lich-loi", "POST", "/api/don-hang/dat-lich", { dichVu: [], khach: { sdt: "0912" }, xe: { bienSo: "abc" }, dongY: false });
await ghi("dat-lich-ngoai-vung", "POST", "/api/don-hang/dat-lich", { ...donDatLich, khach: { hoTen: "Lan", sdt: "0912 345 679" }, viTri: { diaChi: "Đại lộ Thăng Long, Hoài Đức", choDo: "duong" } });
await ghi("goi-gap", "POST", "/api/don-hang/goi-gap", { suCo: "aq", moTaSuCo: "", viTri: { lat: 21.02, lng: 105.82 }, khach: { sdt: "0987 654 321" }, dongY: true, website: "" });
await ghi("theo-doi", "GET", `/api/don-hang/theo-doi/${dl.json.token}`);

const dieuPhoi = await dangNhap("dieuphoi@thotoi.test");
await ghi("trang-thai", "POST", `/api/don-hang/${dl.json.ma}/trang-thai`, { trangThai: "daXepTho", ghiChu: "Thợ Đức nhận đơn" }, dieuPhoi,
  "Header `Authorization: users API-Key <khoá>` (hoặc `JWT <token>`):");
await ghi("trang-thai-loi", "POST", `/api/don-hang/${dl.json.ma}/trang-thai`, { trangThai: "daNhan" }, dieuPhoi, "Quay lại bước trước:");

const quanLy = await dangNhap("quanly@thotoi.test");
const hm = (await goi("GET", "/api/hang-muc-gia?limit=1&depth=0&where[ten][equals]=" + encodeURIComponent("Kích nổ tại chỗ"))).json.docs[0];
await ghi("luu-nhieu", "POST", "/api/hang-muc-gia/luu-nhieu", { thayDoi: [{ id: hm.id, gia: hm.gia + 20000 }], lyDo: "VCparts báo tăng giá" }, quanLy, "Đăng nhập vai trò quanLyDichVu:");
await goi("POST", "/api/hang-muc-gia/luu-nhieu", { thayDoi: [{ id: hm.id, gia: hm.gia }], lyDo: "Trả lại giá (script ví dụ)" }, quanLy);
await ghi("nhat-ky", "GET", "/api/nhat-ky-gia?sort=-createdAt&limit=2&depth=0", null, quanLy);

// ---------------------------------------------------------------- P1
// Đơn thử cho P1: mỗi đơn chọn khung còn chỗ (khung đầu có thể đã đầy sau nhiều lần chạy)
const datThu = async (them = {}) => {
  const l = (await goi("GET", "/api/lich-dat/khung-gio?soNgay=7")).json;
  const n = l.ngay.find((x) => x.khung.some((k) => k.datDuoc));
  const k = n.khung.find((x) => x.datDuoc);
  const r = (await goi("POST", "/api/don-hang/dat-lich", {
    ...donDatLich, khungGio: { ngay: n.ngay, ma: k.ma }, khach: { hoTen: "Nguyễn Văn Hoàng", sdt: `09123${String(Date.now()).slice(-5)}` }, ...them,
  })).json;
  if (!r.token) throw new Error("Không tạo được đơn thử: " + JSON.stringify(r));
  return { json: r };
};
const d1 = (await datThu({ maKhuyenMai: "XANG-TDH12" })).json;
await ghi("xep-tho", "POST", `/api/don-hang/${d1.ma}/xep-tho`, { tho: "THO-1", duKienDenLuc: new Date(Date.now() + 25 * 60000).toISOString() }, dieuPhoi, "Đăng nhập vai trò dieuPhoi (VCsoft dùng khoá API):");
await ghi("vi-tri-tho", "POST", `/api/don-hang/${d1.ma}/vi-tri-tho`, { lat: 21.0298, lng: 105.7931 }, dieuPhoi);
await ghi("theo-doi-tho", "GET", `/api/don-hang/theo-doi/${d1.token}`);
const hangMucBaoGia = [
  { ma: "aq", ten: "Ắc quy 12V 45Ah", lyDo: "Điện áp khởi động 8,9V, dưới mức an toàn", loai: "phuTung", gia: 1650000, batBuoc: true, mucDo: "canLamNgay" },
  { ma: "cong", ten: "Công thay ắc quy", lyDo: "Gồm lưu bộ nhớ xe", loai: "cong", gia: 150000, batBuoc: true, mucDo: "canLamNgay" },
  { ma: "coc", ten: "Vệ sinh cọc, thay đầu cos", lyDo: "Cọc âm bị rỉ trắng", loai: "cong", gia: 120000, mucDo: "nenLam" },
  { ma: "gat", ten: "Thay lưỡi gạt mưa", lyDo: "Lưỡi gạt chai, để vệt khi gạt", loai: "phuTung", gia: 280000, mucDo: "coTheDeSau" },
];
await ghi("tao-bao-gia", "POST", `/api/don-hang/${d1.ma}/bao-gia`, { chanDoan: "Ắc quy chỉ còn 8,9V khi đề, cần thay mới.", hangMuc: hangMucBaoGia }, dieuPhoi);
await ghi("xem-bao-gia", "GET", `/api/don-hang/theo-doi/${d1.token}/bao-gia`);
await ghi("duyet-bao-gia-loi", "POST", `/api/don-hang/theo-doi/${d1.token}/bao-gia/duyet`, { boHangMuc: ["aq"], dongY: true }, null, "Bỏ hạng mục bắt buộc:");
await ghi("duyet-bao-gia", "POST", `/api/don-hang/theo-doi/${d1.token}/bao-gia/duyet`, { boHangMuc: ["gat"], dongY: true });
await ghi("xong", "POST", `/api/don-hang/${d1.ma}/xong`, { soKm: 48200 }, dieuPhoi);
await ghi("xem-thanh-toan", "GET", `/api/don-hang/theo-doi/${d1.token}/thanh-toan`, null, null, "`vietQR.anh` là ảnh PNG dạng data URL (rút gọn ở đây):");
const tt = (await goi("GET", `/api/don-hang/theo-doi/${d1.token}/thanh-toan`)).json;
await ghi("webhook", "POST", "/api/thanh-toan/webhook", {
  id: 92704, gateway: "Vietcombank", transactionDate: "2026-10-08 11:47:02", accountNumber: "1023456789", content: `NGUYEN VAN HOANG chuyen tien ${tt.chuyenKhoan?.noiDung || ""}`,
  transferType: "in", transferAmount: 1000000, referenceCode: `FT${Date.now()}`,
}, null, "Định dạng SePay (Casso: `{ error: 0, data: [{ tid, amount, description, when }] }` + header `secure-token`). Ví dụ chuyển thiếu:");
await ghi("gia-lap-tien-ve", "POST", `/api/don-hang/theo-doi/${d1.token}/gia-lap-tien-ve`, null, null, "Chỉ có khi ngân hàng chạy giả lập (máy chạy thử, kiểm thử end-to-end):");
await ghi("da-thanh-toan", "GET", `/api/don-hang/theo-doi/${d1.token}/thanh-toan`);
await ghi("gui-hoa-don", "POST", `/api/don-hang/theo-doi/${d1.token}/gui-hoa-don`, { kenh: "zalo" });
const d2 = (await datThu()).json;
await goi("POST", `/api/don-hang/${d2.ma}/bao-gia`, { hangMuc: hangMucBaoGia.slice(0, 2) }, dieuPhoi);
await ghi("tu-choi", "POST", `/api/don-hang/theo-doi/${d2.token}/bao-gia/tu-choi`, { lyDo: "Để tự mua ắc quy" });
const dsDon = (await goi("GET", "/api/don-hang?limit=50&depth=0&where[danhGia.token][exists]=true", null, dieuPhoi)).json.docs || [];
const conLink = dsDon.find((d) => !d.danhGia?.luc);
if (conLink) {
  await ghi("xem-danh-gia", "GET", `/api/don-hang/danh-gia/${conLink.danhGia.token}`);
  await ghi("gui-danh-gia", "POST", `/api/don-hang/danh-gia/${conLink.danhGia.token}`, { soSao: 2, vanDe: ["tre"], moTa: "Thợ đến trễ gần 40 phút so với giờ hẹn, không báo trước.", sdtGoiLai: "0912345678" });
  await ghi("gui-danh-gia-lai", "POST", `/api/don-hang/danh-gia/${conLink.danhGia.token}`, { soSao: 5 }, null, "Dùng lại link:");
}
const guiMa = await ghi("tra-cuu-gui-ma", "POST", "/api/tra-cuu-xe/gui-ma", { bienSo: "30a12345" });
await ghi("tra-cuu-xac-nhan", "POST", "/api/tra-cuu-xe/xac-nhan", { bienSo: "30A-123.45", ma: guiMa.json.maGiaLap });
const ph = viDu["tra-cuu-xac-nhan"].match(/"phien": "([^"]+)"/)?.[1];
await ghi("tra-cuu-lich-su", "GET", "/api/tra-cuu-xe/lich-su", null, { Authorization: `Phien ${ph}` }, "Header `Authorization: Phien <phien>`:");
const marketing = await dangNhap("marketing@thotoi.test");
await ghi("km-kiem-tra", "POST", "/api/ma-khuyen-mai/kiem-tra", { ma: "xang-tdh12", sdt: "0987000111" });
viDu["km-kiem-tra"] += "\n\n" + khoi("POST", "/api/ma-khuyen-mai/kiem-tra", { ma: "KM-XEDIEN" }, await goi("POST", "/api/ma-khuyen-mai/kiem-tra", { ma: "KM-XEDIEN" }), "Mã hết hạn:");
await ghi("km-danh-sach", "GET", "/api/ma-khuyen-mai/danh-sach", null, marketing, "Đăng nhập marketing:");
await ghi("km-thong-ke", "GET", "/api/ma-khuyen-mai/thong-ke", null, marketing);
await ghi("km-hoa-hong", "GET", "/api/ma-khuyen-mai/hoa-hong", null, marketing);
const csv = await fetch(BASE + "/api/ma-khuyen-mai/hoa-hong?dinhDang=csv", { headers: marketing });
viDu["km-hoa-hong"] += `\n\n\`GET /api/ma-khuyen-mai/hoa-hong?dinhDang=csv\` → \`${csv.status}\` \`${csv.headers.get("content-type")}\`:\n\`\`\`csv\n${(await csv.text()).replace(/^\uFEFF/, "")}\n\`\`\``;
await ghi("su-kien", "POST", "/api/su-kien/ghi", { suKien: [{ loai: "xemTrang", duongDan: "/dich-vu/ac-quy/?utm_source=google", nguon: { utm_source: "google", utm_medium: "cpc" }, phien: "p-3f9a2c71" }, { loai: "bamGoi", duongDan: "/dich-vu/ac-quy/", nguon: { utm_source: "google" }, phien: "p-3f9a2c71" }] });
await ghi("so-lieu", "GET", "/api/su-kien/bao-cao?ky=thang&soKy=6", null, marketing);
const bienTap = await dangNhap("bientap@thotoi.test");
await ghi("bai-viet", "GET", "/api/quan-tri/bai-viet?loai=khu-vuc", null, bienTap, "Đăng nhập biên tập:");
const cu = (await goi("GET", "/api/trang-khu-vuc?where[slug][equals]=doc-loi-chan-doan-ba-dinh&draft=true&depth=0", null, quanLy)).json.docs?.[0];
if (cu) await goi("DELETE", `/api/trang-khu-vuc/${cu.id}`, null, quanLy);
const tm = await ghi("tao-tu-mau", "POST", "/api/trang-khu-vuc/tao-tu-mau", { dichVu: "doc-loi-chan-doan", quan: "ba-dinh" }, bienTap);
await ghi("gui-duyet-loi", "PATCH", `/api/trang-khu-vuc/${tm.json.id}?draft=true`, { trangThaiDuyet: "choDuyet" }, bienTap, "Gửi duyệt khi chưa đủ điều kiện:");
await ghi("viec-dinh-ky", "POST", "/api/viec-dinh-ky", null, process.env.VIEC_DINH_KY_KEY ? { Authorization: `Bearer ${process.env.VIEC_DINH_KY_KEY}` } : {},
  "Header `Authorization: Bearer <VIEC_DINH_KY_KEY>` (máy chạy thử không đặt khoá thì bỏ qua):");

let md = fs.readFileSync(FILE, "utf8");
let soKhoi = 0;
md = md.replace(/<!-- vi-du:([\w-]+) -->[\s\S]*?<!-- \/vi-du -->/g, (m, ten) => {
  if (!viDu[ten]) { console.warn(`Không có ví dụ cho "${ten}"`); return m; }
  soKhoi++;
  return `<!-- vi-du:${ten} -->\n${viDu[ten]}\n<!-- /vi-du -->`;
});
fs.writeFileSync(FILE, md);
console.log(`Đã ghi ${soKhoi} ví dụ vào docs/api.md (server ${BASE}).`);
