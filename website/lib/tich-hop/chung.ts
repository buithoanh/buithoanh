// Khung chung cho mọi tích hợp bên ngoài (bản đồ, điều phối, Zalo, SMS, VCparts…).
//
// Mỗi tích hợp có hai bản: bản thật (đọc cấu hình từ biến môi trường) và bản giả lập (ghi log, trả dữ liệu mẫu).
// - Đủ biến môi trường → luôn dùng bản thật.
// - Thiếu cấu hình khi chạy thử (NODE_ENV khác production) → bản giả lập.
// - Thiếu cấu hình khi chạy thật (production) → báo lỗi rõ ràng, KHÔNG âm thầm dùng giả lập.
//   Máy chạy thử dựng bằng NODE_ENV=production (server staging, CI) muốn giả lập thì phải ghi rõ tên tích hợp
//   trong TICH_HOP_GIA_LAP, vd TICH_HOP_GIA_LAP=ban-do,dieu-phoi (hoặc "tat-ca").

export class ChuaCauHinhTichHop extends Error {
  constructor(public ten: string, public thieu: string[]) {
    super(`Chưa cấu hình tích hợp "${ten}": thiếu biến môi trường ${thieu.join(", ")}.`);
    this.name = "ChuaCauHinhTichHop";
  }
}

export type CheDo = "that" | "giaLap";

export type MoTaTichHop = { ten: string; moTa: string; bien: string[] };
export const DANH_SACH: MoTaTichHop[] = [];

export function dangKy(m: MoTaTichHop) {
  if (!DANH_SACH.some((x) => x.ten === m.ten)) DANH_SACH.push(m);
  return m;
}

const choPhepGiaLap = (ten: string) => {
  if (process.env.NODE_ENV !== "production") return true;
  const ds = (process.env.TICH_HOP_GIA_LAP || "").split(",").map((s) => s.trim());
  return ds.includes("tat-ca") || ds.includes(ten);
};

/** Chọn bản thật hay giả lập. Ném ChuaCauHinhTichHop nếu production thiếu cấu hình mà không cho phép giả lập. */
export function cheDo(m: MoTaTichHop): CheDo {
  const thieu = m.bien.filter((b) => !process.env[b]);
  if (!thieu.length) return "that";
  if (choPhepGiaLap(m.ten)) return "giaLap";
  throw new ChuaCauHinhTichHop(m.ten, thieu);
}

/** Tình trạng mọi tích hợp, cho trang quản trị và log lúc khởi động. */
export function tinhTrangTichHop() {
  return DANH_SACH.map((m) => {
    const thieu = m.bien.filter((b) => !process.env[b]);
    let tinhTrang: CheDo | "loi";
    try { tinhTrang = cheDo(m); } catch { tinhTrang = "loi"; }
    return { ten: m.ten, moTa: m.moTa, tinhTrang, thieu };
  });
}

export function logGiaLap(ten: string, viec: string, duLieu?: unknown) {
  console.info(`[giả lập ${ten}] ${viec}`, duLieu === undefined ? "" : JSON.stringify(duLieu));
}

/** Gọi HTTP có hạn giờ, lỗi thì ném Error có câu tiếng Việt. */
export async function goiHttp(ten: string, url: string, init: RequestInit & { hanMs?: number } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), init.hanMs ?? 10000);
  try {
    const r = await fetch(url, { ...init, signal: ac.signal });
    const text = await r.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* không phải JSON */ }
    if (!r.ok) throw new Error(`${ten} trả lỗi ${r.status}: ${text.slice(0, 200)}`);
    return json;
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new Error(`${ten} không trả lời sau ${(init.hanMs ?? 10000) / 1000} giây.`);
    throw e;
  } finally {
    clearTimeout(t);
  }
}
