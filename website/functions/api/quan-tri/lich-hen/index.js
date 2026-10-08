// GET /api/quan-tri/lich-hen?trangThai=moi&q=0912 – danh sách lịch hẹn, mới nhất trước.
import { db, json, TRANG_THAI } from "../../../../cf/db.js";

export async function onRequestGet({ request, env }) {
  const DB = await db(env);
  if (!DB) return json({ loi: "Chưa gắn cơ sở dữ liệu D1 (binding DB)." }, 503);
  const url = new URL(request.url);
  const trangThai = url.searchParams.get("trangThai") || "";
  const q = (url.searchParams.get("q") || "").trim().slice(0, 60);

  const where = [], args = [];
  if (TRANG_THAI.includes(trangThai)) { where.push("trang_thai = ?"); args.push(trangThai); }
  if (q) {
    where.push("(sdt LIKE ? OR bien_so LIKE ? OR xe LIKE ? OR vi_tri LIKE ?)");
    args.push(...Array(4).fill(`%${q}%`));
  }
  const sql = `SELECT * FROM lich_hen ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY tao_luc DESC, id DESC LIMIT 300`;
  const [rows, counts] = await Promise.all([
    DB.prepare(sql).bind(...args).all(),
    DB.prepare("SELECT trang_thai, COUNT(*) AS n FROM lich_hen GROUP BY trang_thai").all(),
  ]);
  const dem = Object.fromEntries(counts.results.map((r) => [r.trang_thai, r.n]));
  return json({ lichHen: rows.results, dem });
}
