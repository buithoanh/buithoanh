// POST /api/dat-lich – form đặt lịch trên web gửi vào đây, lưu vào Cloudflare D1 (binding DB).
import { db, json } from "../../cf/db.js";

const LIMITS = { dichVu: 120, xe: 120, bienSo: 20, viTri: 300, gio: 40, sdt: 20, ghiChu: 1000 };

export async function onRequestPost({ request, env }) {
  const DB = await db(env);
  if (!DB) return json({ loi: "Chưa gắn cơ sở dữ liệu D1 (binding DB)." }, 503);

  let f;
  try { f = await request.json(); } catch { return json({ loi: "Dữ liệu không hợp lệ." }, 400); }
  if (f.web) return json({ ok: true }); // ô bẫy spam có chữ: giả vờ nhận, không lưu

  const v = {};
  for (const [k, max] of Object.entries(LIMITS)) v[k] = String(f[k] ?? "").trim().slice(0, max);
  const digits = v.sdt.replace(/\D/g, "");
  if (!v.dichVu || !v.xe || !v.viTri || digits.length < 9 || digits.length > 12) {
    return json({ loi: "Thiếu dịch vụ, xe, vị trí hoặc số điện thoại chưa đúng." }, 400);
  }

  const r = await DB.prepare(
    "INSERT INTO lich_hen (dich_vu, xe, bien_so, vi_tri, gio, sdt, ghi_chu, nguon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(v.dichVu, v.xe, v.bienSo, v.viTri, v.gio, v.sdt, v.ghiChu, String(f.nguon || "website").slice(0, 40)).run();
  return json({ ok: true, id: r.meta?.last_row_id }, 201);
}
