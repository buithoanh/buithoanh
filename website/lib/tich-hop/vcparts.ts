// Danh mục hãng, dòng, đời xe từ VCparts (nguồn chuẩn cho danh mục xe của web).
// Bản thật (giả định, chờ VCparts xác nhận): GET {VCPARTS_URL}/danh-muc-xe, header x-api-key: {VCPARTS_KEY}
//   → [{ ma, ten, dong: [{ ma, ten, doiTu, doiDen, xeDien, phanKhucGoiY }] }]
// Bản giả lập trả danh sách mẫu trong du-lieu-mau/xe.json, cộng vài dòng "mới" chưa gán phân khúc.
import fs from "node:fs";
import path from "node:path";
import { cheDo, dangKy, goiHttp, logGiaLap } from "./chung";

export type DongVCparts = { ma: string; ten: string; doiTu?: number; doiDen?: number; xeDien?: boolean; phanKhucGoiY?: "A" | "B" | "C" | "D" | null };
export type HangVCparts = { ma: string; ten: string; dong: DongVCparts[] };

const MO_TA = dangKy({ ten: "vcparts", moTa: "Danh mục xe, phụ tùng VCparts", bien: ["VCPARTS_URL", "VCPARTS_KEY"] });

export function danhMucXeMau(): HangVCparts[] {
  const f = path.join(process.cwd(), "du-lieu-mau", "xe.json");
  const j = JSON.parse(fs.readFileSync(f, "utf8")) as { hang: { ten: string; dong: [string, string | null, number, number, number?][] }[] };
  const ma = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return j.hang.map((h) => ({
    ma: ma(h.ten),
    ten: h.ten,
    dong: h.dong.map(([ten, pk, doiTu, doiDen, dien]) => ({
      ma: `${ma(h.ten)}-${ma(ten)}`, ten, doiTu, doiDen, xeDien: Boolean(dien), phanKhucGoiY: (pk as DongVCparts["phanKhucGoiY"]) || null,
    })),
  }));
}

export const vcparts = {
  moTa: MO_TA,
  async layDanhMucXe(): Promise<HangVCparts[]> {
    if (cheDo(MO_TA) === "giaLap") {
      const ds = danhMucXeMau();
      logGiaLap("vcparts", `trả danh mục mẫu ${ds.length} hãng`);
      return ds;
    }
    const j = await goiHttp("VCparts", `${process.env.VCPARTS_URL}/danh-muc-xe`, { headers: { "x-api-key": process.env.VCPARTS_KEY! } });
    if (!Array.isArray(j)) throw new Error("VCparts trả danh mục xe không đúng dạng.");
    return j as HangVCparts[];
  },
};
