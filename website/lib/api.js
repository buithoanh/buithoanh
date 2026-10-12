// Gọi API đặt lịch (VCsoft) và tra cứu lệnh (VCgarage).
// Chưa có API thật mà đang chạy thử (site.mock) thì dùng API GIẢ ngay trong trình duyệt, cùng định dạng dữ liệu với API thật:
// lệnh vừa đặt được lưu trong localStorage và tự chuyển trạng thái theo thời gian để thấy đủ các bước.
// Dữ liệu mẫu chỉ được tải khi đang chạy thử, không nằm trong bản chạy thật.
const mau = () => import("../mock/du-lieu-mau.mjs");

const KEY = "vcmc-lenh-mau";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const digits = (s) => String(s || "").replace(/\D/g, "");

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function saveLocal(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(-20))); } catch { /* chế độ ẩn danh */ }
}

// KTV mẫu theo loại việc.
function pickKtv(kyThuatVien, dichVu = "") {
  const d = dichVu.toLowerCase();
  const k = kyThuatVien[d.includes("ắc quy") ? 1 : d.includes("lốp") || d.includes("phanh") ? 2 : d.includes("bảo dưỡng") ? 3 : 0];
  return { ten: k.ten, anh: k.anh, chuyenMon: k.chucDanh.replace("Kỹ thuật viên ", ""), bienSo: k.bienSo, sdt: "0900 000 000" };
}

const hhmm = (t) => new Date(t).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

// Lệnh tự đặt khi chạy thử: mỗi bước kéo dài 1–3 phút để thử trọn vòng đời trong khoảng 10 phút.
function simulate(o, kyThuatVien) {
  const m = (Date.now() - o.taoLuc) / 60000;
  const steps = [["tiep-nhan", 0], ["dang-toi", 1], ["dang-sua", 4], ["hoan-tat", 8], ["da-thanh-toan", 10]];
  const reached = steps.filter(([, at]) => m >= at);
  const now = reached[reached.length - 1][0];
  const note = { "tiep-nhan": "Đã nhận yêu cầu, tổng đài sẽ gọi báo giá", "dang-toi": "Xuất phát", "dang-sua": "Bắt đầu làm việc tại xe", "hoan-tat": "Bàn giao xe", "da-thanh-toan": "Đã gửi hoá đơn điện tử" };
  return {
    ma: o.ma, dichVu: o.dichVu, xe: [o.xe, o.bienSo].filter(Boolean).join(" · "), trangThai: now,
    ...(now === "dang-toi" && { duKienPhut: Math.max(1, Math.round(4 - m) * 5) }),
    ...(m >= 1 && { ktv: pickKtv(kyThuatVien, o.dichVu) }),
    ...(m >= 8 && { tongTien: "Theo báo giá đã duyệt" }),
    lichSu: reached.map(([k, at]) => ({ trangThai: k, luc: `${hhmm(o.taoLuc + at * 60000)} · ${note[k]}` })),
  };
}

/** Gửi lịch hẹn. Trả { ok, ma } hoặc { ok: false }. */
export async function datLich({ endpoint, mock }, payload) {
  if (endpoint) {
    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) return { ok: false };
    const data = await r.json().catch(() => ({}));
    return { ok: true, ma: data.ma || "" };
  }
  if (!mock) return { ok: false, offline: true };
  await wait(800);
  const ma = `VC-${Math.floor(3000 + Math.random() * 6000)}`;
  saveLocal([...loadLocal(), { ...payload, ma, sdt: digits(payload.sdt), taoLuc: Date.now() }]);
  return { ok: true, ma };
}

/** Tra cứu lệnh. Trả { status: 200, order } | { status: 404 } | { status: "error" } | { status: "offline" }. */
export async function traCuu({ endpoint, mock }, sdt, ma) {
  const q = { sdt: digits(sdt), ma: String(ma).trim().toUpperCase() };
  if (endpoint) {
    try {
      const r = await fetch(`${endpoint}?${new URLSearchParams(q)}`, { headers: { Accept: "application/json" } });
      if (r.status === 404) return { status: 404 };
      if (!r.ok) return { status: "error" };
      return { status: 200, order: await r.json() };
    } catch { return { status: "error" }; }
  }
  if (!mock) return { status: "offline" };
  const [{ lenhMau, kyThuatVien }] = await Promise.all([mau(), wait(500)]);
  const local = loadLocal().find((o) => o.sdt === q.sdt && o.ma === q.ma);
  if (local) return { status: 200, order: simulate(local, kyThuatVien) };
  const preset = lenhMau.find((o) => o.sdt === q.sdt && o.ma === q.ma);
  return preset ? { status: 200, order: preset } : { status: 404 };
}

/** Các lệnh khách đã đặt trên máy này (để hiện "Lệnh gần đây"). */
export function lenhGanDay() {
  return loadLocal().slice(-5).reverse().map((o) => ({ ma: o.ma, sdt: o.sdt, dichVu: o.dichVu, taoLuc: o.taoLuc }));
}
