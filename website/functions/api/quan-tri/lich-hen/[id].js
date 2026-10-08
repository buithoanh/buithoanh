// PATCH /api/quan-tri/lich-hen/<id> {trangThai?, ghiChuNoiBo?} – đổi trạng thái, ghi chú nội bộ.
import { db, json, TRANG_THAI } from "../../../../cf/db.js";

export async function onRequestPatch({ request, env, params }) {
  const DB = await db(env);
  if (!DB) return json({ loi: "Chưa gắn cơ sở dữ liệu D1 (binding DB)." }, 503);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ loi: "Mã lịch hẹn không đúng." }, 400);
  let body;
  try { body = await request.json(); } catch { return json({ loi: "Dữ liệu không hợp lệ." }, 400); }

  const sets = [], args = [];
  if (body.trangThai !== undefined) {
    if (!TRANG_THAI.includes(body.trangThai)) return json({ loi: "Trạng thái không đúng." }, 400);
    sets.push("trang_thai = ?"); args.push(body.trangThai);
  }
  if (body.ghiChuNoiBo !== undefined) { sets.push("ghi_chu_noi_bo = ?"); args.push(String(body.ghiChuNoiBo).slice(0, 1000)); }
  if (!sets.length) return json({ loi: "Không có gì để cập nhật." }, 400);
  sets.push("cap_nhat_luc = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')");

  const row = await DB.prepare(`UPDATE lich_hen SET ${sets.join(", ")} WHERE id = ? RETURNING *`).bind(...args, id).first();
  return row ? json({ lichHen: row }) : json({ loi: "Không tìm thấy lịch hẹn." }, 404);
}
