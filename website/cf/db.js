// Dùng chung cho các hàm Cloudflare Pages trong functions/. Không đặt trong functions/ để không thành đường dẫn web.

export const TRANG_THAI = ["moi", "da-goi", "dang-lam", "xong", "huy"];

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

let schemaReady = false;
// Tự tạo bảng ở lần gọi đầu tiên, người phụ trách không phải chạy SQL bằng tay.
export async function db(env) {
  if (!env.DB) return null;
  if (!schemaReady) {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS lich_hen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tao_luc TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        dich_vu TEXT NOT NULL, xe TEXT NOT NULL, bien_so TEXT, vi_tri TEXT NOT NULL,
        gio TEXT, sdt TEXT NOT NULL, ghi_chu TEXT, nguon TEXT,
        trang_thai TEXT NOT NULL DEFAULT 'moi', ghi_chu_noi_bo TEXT, cap_nhat_luc TEXT)`),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS lich_hen_trang_thai ON lich_hen (trang_thai, tao_luc)"),
    ]);
    schemaReady = true;
  }
  return env.DB;
}
