// Số liệu cho màn QtSoLieu: KPI theo ngày/tuần/tháng so với kỳ trước, đơn theo nguồn, tỷ lệ so với mục tiêu,
// top trang, đơn mới nhất kèm nguồn, đối soát số đơn với phần mềm điều phối. Gom bằng SQL theo giờ Việt Nam.
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { soSanh, tyLeChuyenDoi } from "./su-kien.mjs";
import { dieuPhoi } from "./tich-hop/dieu-phoi";
import type { Bang } from "./xuat-file";

type Ky = "ngay" | "tuan" | "thang";
type Drizzle = { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
const DON_VI: Record<Ky, { pg: string; mac: number; nhan: string }> = {
  ngay: { pg: "day", mac: 14, nhan: "ngày" }, tuan: { pg: "week", mac: 8, nhan: "tuần" }, thang: { pg: "month", mac: 6, nhan: "tháng" },
};
export const KENH = ["Google", "Facebook", "QR cây xăng", "KOC", "BQL chung cư", "Zalo", "TikTok", "Giới thiệu", "QR đối tác", "Khác", "Trực tiếp"];

/** k = "YYYY-MM-DD" (đầu kỳ, giờ Việt Nam) */
const nhanKy = (ky: Ky, k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return ky === "thang" ? `T${m}/${y % 100}` : `${d}/${m}`;
};

export async function baoCaoSoLieu(payload: Payload, p: { ky: Ky; soKy?: number }) {
  const dv = DON_VI[p.ky];
  const soKy = Math.min(Math.max(2, p.soKy || dv.mac), 60);
  const db = (payload.db as unknown as { drizzle: Drizzle }).drizzle;
  const tz = "Asia/Ho_Chi_Minh";
  // Mốc đầu kỳ (theo giờ VN, biểu diễn như timestamp không múi giờ)
  const moc = (await db.execute(sql.raw(
    `SELECT to_char(g, 'YYYY-MM-DD') AS k FROM generate_series(date_trunc('${dv.pg}', now() AT TIME ZONE '${tz}') - interval '${soKy - 1} ${dv.pg}', date_trunc('${dv.pg}', now() AT TIME ZONE '${tz}'), interval '1 ${dv.pg}') AS g`,
  ))).rows.map((r) => String(r.k));
  const truncKy = `date_trunc('${dv.pg}', created_at AT TIME ZONE '${tz}')`;
  const kyCua = `to_char(${truncKy}, 'YYYY-MM-DD')`;
  const tuSql = `('${moc[0]}'::timestamp AT TIME ZONE '${tz}')`;
  const q = async (s: string) => (await db.execute(sql.raw(s))).rows;
  const [suKien, don, nguon, trang, donTrang] = await Promise.all([
    q(`SELECT ${kyCua} AS k, loai, count(*)::int AS n FROM su_kien WHERE created_at >= ${tuSql} GROUP BY 1, 2`),
    q(`SELECT ${kyCua} AS k, count(*)::int AS n FROM don_hang WHERE created_at >= ${tuSql} AND trang_thai <> 'huy' GROUP BY 1`),
    q(`SELECT ${kyCua} AS k, coalesce(nguon_kenh, 'Trực tiếp') AS kenh, count(*)::int AS n FROM don_hang WHERE created_at >= ${tuSql} AND trang_thai <> 'huy' GROUP BY 1, 2`),
    q(`SELECT duong_dan, count(*)::int AS n FROM su_kien WHERE loai = 'xemTrang' AND ${truncKy} = date_trunc('${dv.pg}', now() AT TIME ZONE '${tz}') GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
    q(`SELECT coalesce(nguon_trang_vao, '') AS duong_dan, count(*)::int AS n FROM don_hang WHERE trang_thai <> 'huy' AND ${truncKy} = date_trunc('${dv.pg}', now() AT TIME ZONE '${tz}') GROUP BY 1`),
  ]);
  const viTri = (k: unknown) => moc.indexOf(String(k));
  const day = (ds: Record<string, unknown>[], loc: (r: Record<string, unknown>) => boolean = () => true) => {
    const a = new Array(moc.length).fill(0);
    for (const r of ds) if (loc(r)) { const i = viTri(r.k); if (i >= 0) a[i] += Number(r.n); }
    return a;
  };
  const luotVao = day(suKien, (r) => r.loai === "xemTrang");
  const cuocGoi = day(suKien, (r) => r.loai === "bamGoi");
  const zalo = day(suKien, (r) => r.loai === "bamZalo");
  const soDon = day(don);
  const tyLe = moc.map((_, i) => tyLeChuyenDoi({ soDon: soDon[i], cuocGoi: cuocGoi[i], zalo: zalo[i], luotVao: luotVao[i] }));
  const L = moc.length - 1;
  const kenhCo = [...new Set(nguon.map((r) => String(r.kenh)))].sort((a, b) => KENH.indexOf(a) - KENH.indexOf(b));
  const donTheoNguon = Object.fromEntries(kenhCo.map((k) => [k, day(nguon, (r) => r.kenh === k)]));
  const goiTheoKenh = await q(`SELECT coalesce(kenh, 'Trực tiếp') AS kenh, loai, count(*)::int AS n FROM su_kien WHERE loai IN ('bamGoi','bamZalo') AND ${truncKy} = date_trunc('${dv.pg}', now() AT TIME ZONE '${tz}') GROUP BY 1, 2`);
  const c = await payload.findGlobal({ slug: "cai-dat", depth: 0 });
  const mucTieu = c.mucTieuTyLeDatLich ?? 4;
  const tongKyNay = soDon[L] || 0;
  const moi = await payload.find({ collection: "don-hang", sort: "-createdAt", limit: 8, depth: 0, overrideAccess: true, select: { ma: true, createdAt: true, nguon: true, loai: true, maKhuyenMai: true } });
  const ketThuc = new Date();
  let dieuPhoiDem: number | null = null;
  try { dieuPhoiDem = await dieuPhoi.demDon(new Date(`${moc[L]}T00:00:00+07:00`).toISOString(), ketThuc.toISOString()); } catch { dieuPhoiDem = null; }
  const donTrangMap = new Map(donTrang.map((r) => [String(r.duong_dan), Number(r.n)]));
  return {
    ky: p.ky, donVi: dv.nhan, nhan: moc.map((m) => nhanKy(p.ky, m)),
    luotVao, soDon, cuocGoi, zalo, tyLe, mucTieuTyLe: mucTieu,
    kpi: {
      luotVao: { giaTri: luotVao[L], ...soSanh(luotVao[L], luotVao[L - 1]) },
      soDon: { giaTri: soDon[L], ...soSanh(soDon[L], soDon[L - 1]) },
      tyLe: { giaTri: tyLe[L], ...soSanh(tyLe[L], tyLe[L - 1], true), datMucTieu: tyLe[L] >= mucTieu },
      cuocGoi: { giaTri: cuocGoi[L], ...soSanh(cuocGoi[L], cuocGoi[L - 1]) },
      zalo: { giaTri: zalo[L], ...soSanh(zalo[L], zalo[L - 1]) },
    },
    donTheoNguon,
    nguonKyNay: kenhCo.map((k) => ({
      kenh: k, soDon: donTheoNguon[k][L],
      cuocGoi: goiTheoKenh.filter((r) => r.kenh === k && r.loai === "bamGoi").reduce((a, r) => a + Number(r.n), 0),
      zalo: goiTheoKenh.filter((r) => r.kenh === k && r.loai === "bamZalo").reduce((a, r) => a + Number(r.n), 0),
      tyTrong: tongKyNay ? Math.round((donTheoNguon[k][L] / tongKyNay) * 1000) / 10 : 0,
    })).sort((a, b) => b.soDon - a.soDon),
    topTrang: trang.map((r) => {
      const v = Number(r.n);
      const o = donTrangMap.get(String(r.duong_dan)) || 0;
      return { duongDan: String(r.duong_dan), luotVao: v, soDon: o, tyLe: v ? Math.round((o / v) * 1000) / 10 : 0 };
    }),
    donMoiNhat: moi.docs.map((d) => ({
      ma: d.ma, luc: d.createdAt, kenh: d.nguon?.kenh || "Trực tiếp",
      hanhDong: d.loai === "khanCap" ? "Gửi form gọi gấp" : "Gửi form đặt lịch",
      chiTiet: d.maKhuyenMai ? `Mã ${d.maKhuyenMai}` : d.nguon?.trangVao ? `Từ trang ${d.nguon.trangVao}` : "",
    })),
    doiSoat: { kyNay: nhanKy(p.ky, moc[L]), web: tongKyNay, dieuPhoi: dieuPhoiDem, khop: dieuPhoiDem == null ? null : dieuPhoiDem === tongKyNay },
  };
}

export function bangSoLieu(bc: Awaited<ReturnType<typeof baoCaoSoLieu>>): Bang[] {
  return [
    {
      ten: `Theo ${bc.donVi}`,
      cot: [{ khoa: "ky", tieuDe: "Kỳ" }, { khoa: "luotVao", tieuDe: "Lượt vào" }, { khoa: "soDon", tieuDe: "Số đơn" }, { khoa: "cuocGoi", tieuDe: "Bấm gọi" }, { khoa: "zalo", tieuDe: "Bấm Zalo" }, { khoa: "tyLe", tieuDe: "Tỷ lệ (%)" },
        ...Object.keys(bc.donTheoNguon).map((k) => ({ khoa: `n_${k}`, tieuDe: `Đơn ${k}` }))],
      dong: bc.nhan.map((ky, i) => ({
        ky, luotVao: bc.luotVao[i], soDon: bc.soDon[i], cuocGoi: bc.cuocGoi[i], zalo: bc.zalo[i], tyLe: bc.tyLe[i],
        ...Object.fromEntries(Object.entries(bc.donTheoNguon).map(([k, a]) => [`n_${k}`, a[i]])),
      })),
    },
    {
      ten: "Top trang",
      cot: [{ khoa: "duongDan", tieuDe: "Trang", rong: 40 }, { khoa: "luotVao", tieuDe: "Lượt vào" }, { khoa: "soDon", tieuDe: "Đơn" }, { khoa: "tyLe", tieuDe: "Tỷ lệ (%)" }],
      dong: bc.topTrang,
    },
  ];
}
