// Mã chứng từ tuần tự: TT-000123 (đơn), BH- (bảo hành), KN- (khiếu nại), HV- (hội viên), DN- (doanh nghiệp), TH- (hồ sơ thợ).
// Dùng sequence của PostgreSQL nên hai đơn gửi cùng lúc không bao giờ trùng mã.
// Sequence bị mất hoặc chạy lùi (vd chế độ dev tự đồng bộ bảng xoá sequence, khôi phục bản sao lưu cũ) thì tự nắn
// lại theo mã lớn nhất đang có trong bảng.
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

const LOAI = {
  TT: { seq: "ma_so_tt", bang: "don_hang", cot: "ma" },
  BH: { seq: "ma_so_bh", bang: "phieu_bao_hanh", cot: "ma" },
  KN: { seq: "ma_so_kn", bang: "khieu_nai", cot: "ma" },
  HV: { seq: "ma_so_hv", bang: "hoi_vien", cot: "ma" },
  DN: { seq: "ma_so_dn", bang: "yeu_cau_doanh_nghiep", cot: "ma" },
  TH: { seq: "ma_so_th", bang: "ho_so_tho", cot: "ma" },
} as const;
export type LoaiMa = keyof typeof LOAI;

type Drizzle = { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> };

export async function maTiepTheo(payload: Payload, loai: LoaiMa): Promise<string> {
  const { seq, bang, cot } = LOAI[loai];
  const db = (payload.db as unknown as { drizzle: Drizzle }).drizzle;
  await db.execute(sql.raw(`CREATE SEQUENCE IF NOT EXISTS ${seq} START 1`));
  for (let lan = 0; lan < 3; lan++) {
    const { rows } = await db.execute(sql.raw(`SELECT nextval('${seq}') AS n`));
    const ma = dinhDangMa(loai, Number(rows[0].n));
    const trung = await db.execute(sql.raw(`SELECT 1 FROM ${bang} WHERE ${cot} = '${ma}' LIMIT 1`)).catch(() => ({ rows: [] }));
    if (!trung.rows.length) return ma;
    await db.execute(sql.raw(
      `SELECT setval('${seq}', (SELECT COALESCE(MAX(NULLIF(regexp_replace(${cot}, '\\D', '', 'g'), '')::bigint), 0) FROM ${bang} WHERE ${cot} LIKE '${loai}-%'))`,
    ));
  }
  throw new Error(`Không cấp được mã ${loai} mới.`);
}

export const dinhDangMa = (loai: LoaiMa, n: number) => `${loai}-${String(n).padStart(6, "0")}`;
