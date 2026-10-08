// Tạo bộ đơn thử cho các màn phục vụ khách (link riêng /don/...) và tra cứu xe, rồi in ra các link.
// Chỉ chạy trên máy chạy thử (dữ liệu mẫu của npm run nap-du-lieu, tin nhắn và ngân hàng giả lập).
//
//   node scripts/tao-don-thu.mjs                 # in bảng link dễ đọc
//   node scripts/tao-don-thu.mjs --json          # in JSON (Playwright đọc)
//   BASE_URL=http://localhost:3000 MAT_KHAU_TAI_KHOAN_THU=... node scripts/tao-don-thu.mjs
//
// Mỗi lần chạy dùng một biển số mới (tra cứu xe không vướng giới hạn 5 lần gửi mã/giờ của một biển số)
// và tạo các đơn ở từng bước:
//   moiDat        đơn vừa đặt (Đã nhận)                         → /don/<token>/
//   thoDangDen    đã xếp thợ, thợ gửi vị trí                     → /don/<token>/
//   choDuyet      thợ gửi báo giá 4 hạng mục (2 bắt buộc)        → /don/<token>/bao-gia/  (duyệt, bỏ bớt)
//   tuChoi        thợ gửi báo giá 2 hạng mục                      → /don/<token>/bao-gia/  (từ chối, trả phí kiểm tra)
//   choThanhToan  khách đã duyệt, thợ bấm xong                    → /don/<token>/thanh-toan/
//                 (tiền về: POST /api/don-hang/theo-doi/<token>/gia-lap-tien-ve — chỉ trong kiểm thử, không có nút trên web)
//   daThanhToan   đã trả đủ: biên nhận, hoá đơn, bảo hành         → /don/<token>/thanh-toan/
//   danhGiaTot, danhGiaKem  link đánh giá (tokenDanhGia riêng)  → /don/<tokenDanhGia>/danh-gia/
//   hetHan        link đã hết hạn (410)                           → /don/<token>/
// Cùng một biển số cho mọi đơn → tra cứu: /tra-cuu-xe/ với biển số in ra, mã lấy từ `maGiaLap` của POST /api/tra-cuu-xe/gui-ma.

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const MAT_KHAU = process.env.MAT_KHAU_TAI_KHOAN_THU || "ThoToi-ThuNghiem-2026";
const IN_JSON = process.argv.includes("--json");
const nhatKy = (...a) => { if (!IN_JSON) console.error(...a); };

// Mỗi request một IP giả (X-Forwarded-For) để không vướng giới hạn tạo đơn theo IP của máy chạy thử.
let ip = Math.floor(Math.random() * 200);
async function goi(method, path, body, headers = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.77.${Math.floor(ip / 250) % 250}.${(ip++ % 250) + 1}`, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, json };
}
async function phai(method, path, body, headers) {
  const r = await goi(method, path, body, headers);
  if (r.status >= 300) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}
async function dangNhap(email) {
  const r = await goi("POST", "/api/users/login", { email, password: MAT_KHAU });
  if (!r.json?.token) throw new Error(`Không đăng nhập được ${email} (chạy npm run nap-du-lieu ở chế độ chạy thử?)`);
  return { Authorization: `JWT ${r.json.token}` };
}

const so = String(Date.now()).slice(-5);
const bienSo = `30K-${so.slice(0, 3)}.${so.slice(3)}`;
let dem = 0;
const sdtMoi = () => `09${String(Date.now() + dem++ * 7919).slice(-8)}`;

const lich = await phai("GET", "/api/lich-dat/khung-gio?soNgay=7");
const conCho = () => {
  for (const n of lich.ngay) for (const k of n.khung) if (k.datDuoc && (k.conCho ?? 1) > 0) return { ngay: n.ngay, ma: k.ma };
  throw new Error("Không còn khung giờ trống trong 7 ngày tới.");
};

async function datLich() {
  const body = {
    dichVu: ["ac-quy"], trieuChung: "Sáng đề không nổ, đèn táp-lô mờ (đơn thử)",
    xe: { hang: "toyota", dong: "toyota-vios", doi: 2019, bienSo, soKm: 48000 },
    viTri: { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy", choDo: "ham", ghiChuChoTho: "Hầm B2, ô 112" },
    khungGio: conCho(),
    khach: { hoTen: "Khách Thử Nghiệm", sdt: sdtMoi() },
    dongY: true, nguon: { utm_source: "kiem-thu" }, website: "",
  };
  let r = await goi("POST", "/api/don-hang/dat-lich", body);
  if (r.status === 409 && r.json?.ma?.startsWith("KHUNG")) {
    // Khung vừa đầy: lấy lại lịch và thử khung khác
    Object.assign(lich, await phai("GET", "/api/lich-dat/khung-gio?soNgay=7"));
    r = await goi("POST", "/api/don-hang/dat-lich", { ...body, khungGio: conCho() });
  }
  if (r.status !== 201) throw new Error(`Không tạo được đơn: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}

const HANG_MUC = [
  { ma: "aq", ten: "Ắc quy 12V 45Ah", lyDo: "Điện áp khởi động 8,9V, dưới mức an toàn", loai: "phuTung", gia: 1650000, batBuoc: true, mucDo: "canLamNgay" },
  { ma: "cong", ten: "Công thay ắc quy", lyDo: "Gồm lưu bộ nhớ xe", loai: "cong", gia: 150000, batBuoc: true, mucDo: "canLamNgay" },
  { ma: "coc", ten: "Vệ sinh cọc, thay đầu cos", lyDo: "Cọc âm bị rỉ trắng", loai: "cong", gia: 120000, mucDo: "nenLam" },
  { ma: "gat", ten: "Thay lưỡi gạt mưa", lyDo: "Lưỡi gạt chai, để vệt khi gạt", loai: "phuTung", gia: 280000, mucDo: "coTheDeSau" },
];

const dieuPhoi = await dangNhap("dieuphoi@thotoi.test");
const quanTri = await dangNhap("quantri@thotoi.test");
const duKien = () => new Date(Date.now() + 25 * 60000).toISOString();
// Thợ đang hoạt động bất kỳ (thợ mẫu THO-1… chỉ có khi nap-du-lieu chạy trên database chưa có thợ nào)
const thoCo = (await phai("GET", "/api/tho?where[dangHoatDong][equals]=true&limit=1&depth=0", null, quanTri)).docs[0];
if (!thoCo) throw new Error("Chưa có thợ đang hoạt động (chạy npm run nap-du-lieu ở chế độ chạy thử).");
const MA_THO = thoCo.maBenDieuPhoi || String(thoCo.id);

async function denThoDangDen(d) {
  await phai("POST", `/api/don-hang/${d.ma}/xep-tho`, { tho: MA_THO, duKienDenLuc: duKien() }, dieuPhoi);
  await phai("POST", `/api/don-hang/${d.ma}/vi-tri-tho`, { lat: 21.0298, lng: 105.7931 }, dieuPhoi);
}
async function denChoDuyet(d, hangMuc = HANG_MUC) {
  await denThoDangDen(d);
  await phai("POST", `/api/don-hang/${d.ma}/bao-gia`, { chanDoan: "Ắc quy chỉ còn 8,9V khi đề, cần thay mới.", hangMuc }, dieuPhoi);
}
async function denChoThanhToan(d) {
  await denChoDuyet(d);
  await phai("POST", `/api/don-hang/theo-doi/${d.token}/bao-gia/duyet`, { boHangMuc: ["gat"], dongY: true });
  await phai("POST", `/api/don-hang/${d.ma}/xong`, { soKm: 48200 }, dieuPhoi);
}
async function denDaThanhToan(d) {
  await denChoThanhToan(d);
  await phai("POST", `/api/don-hang/theo-doi/${d.token}/gia-lap-tien-ve`);
}
/** Link đánh giá chỉ được gửi 24 giờ sau khi xong: lùi giờ kết thúc rồi chạy việc định kỳ. */
async function layLinkDanhGia(d) {
  await denDaThanhToan(d);
  const id = (await phai("GET", `/api/don-hang?where[ma][equals]=${d.ma}&limit=1&depth=0`, null, quanTri)).docs[0].id;
  await phai("PATCH", `/api/don-hang/${id}`, { ketThucLuc: new Date(Date.now() - 25 * 3600000).toISOString() }, quanTri);
  await phai("POST", "/api/viec-dinh-ky", null, quanTri);
  const don = await phai("GET", `/api/don-hang/${id}?depth=0`, null, quanTri);
  if (!don.danhGia?.token) throw new Error(`Đơn ${d.ma} chưa có link đánh giá sau khi chạy việc định kỳ.`);
  return don.danhGia.token;
}
async function lamHetHan(d) {
  const id = (await phai("GET", `/api/don-hang?where[ma][equals]=${d.ma}&limit=1&depth=0`, null, quanTri)).docs[0].id;
  await phai("PATCH", `/api/don-hang/${id}`, { hetHanLinkLuc: new Date(Date.now() - 3600000).toISOString() }, quanTri);
}

const ketQua = { base: BASE, bienSo, don: {} };
const them = (ten, d, trang = "", token = d.token) => {
  ketQua.don[ten] = { ma: d.ma, token, link: `${BASE}/don/${token}/${trang ? `${trang}/` : ""}` };
  nhatKy(`✓ ${ten.padEnd(13)} ${d.ma}  ${ketQua.don[ten].link}`);
};

nhatKy(`Tạo đơn thử trên ${BASE}, biển số ${bienSo}…`);
// Đơn đã xong tạo trước để tra cứu xe có lịch sử, bảo hành
const dTot = await datLich(); const tokenTot = await layLinkDanhGia(dTot); them("danhGiaTot", dTot, "danh-gia", tokenTot);
const dKem = await datLich(); const tokenKem = await layLinkDanhGia(dKem); them("danhGiaKem", dKem, "danh-gia", tokenKem);
const dXong = await datLich(); await denDaThanhToan(dXong); them("daThanhToan", dXong, "thanh-toan");
const dHan = await datLich(); await lamHetHan(dHan); them("hetHan", dHan);
const dTT = await datLich(); await denChoThanhToan(dTT); them("choThanhToan", dTT, "thanh-toan");
const dTC = await datLich(); await denChoDuyet(dTC, HANG_MUC.slice(0, 2)); them("tuChoi", dTC, "bao-gia");
const dCD = await datLich(); await denChoDuyet(dCD); them("choDuyet", dCD, "bao-gia");
const dDen = await datLich(); await denThoDangDen(dDen); them("thoDangDen", dDen);
// Đơn mới nhất: số điện thoại của nó nhận mã tra cứu xe
const dMoi = await datLich(); them("moiDat", dMoi);

ketQua.giaLapTienVe = `${BASE}/api/don-hang/theo-doi/${dTT.token}/gia-lap-tien-ve`;
ketQua.traCuuXe = { link: `${BASE}/tra-cuu-xe/`, bienSo, guiMa: `${BASE}/api/tra-cuu-xe/gui-ma`, ghiChu: "Mã 6 số: trường maGiaLap trong kết quả gửi mã (chỉ khi tin nhắn giả lập)" };
ketQua.linkSai = `${BASE}/don/khong-co-don-nay-abcdefghijklmnop/`;

if (IN_JSON) console.log(JSON.stringify(ketQua, null, 2));
else {
  console.log(`\nTiền về (kiểm thử): POST ${ketQua.giaLapTienVe}`);
  console.log(`Tra cứu xe: ${ketQua.traCuuXe.link}  biển số ${bienSo}`);
  console.log(`Link sai (404): ${ketQua.linkSai}`);
}
