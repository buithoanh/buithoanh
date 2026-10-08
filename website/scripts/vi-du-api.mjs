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

let md = fs.readFileSync(FILE, "utf8");
let soKhoi = 0;
md = md.replace(/<!-- vi-du:([\w-]+) -->[\s\S]*?<!-- \/vi-du -->/g, (m, ten) => {
  if (!viDu[ten]) { console.warn(`Không có ví dụ cho "${ten}"`); return m; }
  soKhoi++;
  return `<!-- vi-du:${ten} -->\n${viDu[ten]}\n<!-- /vi-du -->`;
});
fs.writeFileSync(FILE, md);
console.log(`Đã ghi ${soKhoi} ví dụ vào docs/api.md (server ${BASE}).`);
