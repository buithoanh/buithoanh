// Xuất bảng ra CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt) hoặc Excel .xlsx.
import ExcelJS from "exceljs";

export type Bang = { ten: string; cot: { khoa: string; tieuDe: string; rong?: number; tien?: boolean }[]; dong: Record<string, unknown>[] };

const oCsv = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function sangCsv(bang: Bang) {
  const dong = [bang.cot.map((c) => oCsv(c.tieuDe)).join(","), ...bang.dong.map((d) => bang.cot.map((c) => oCsv(d[c.khoa])).join(","))];
  return "﻿" + dong.join("\r\n");
}

export async function sangXlsx(cacBang: Bang[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ThợTới";
  for (const b of cacBang) {
    const ws = wb.addWorksheet(b.ten.slice(0, 31));
    ws.columns = b.cot.map((c) => ({ header: c.tieuDe, key: c.khoa, width: c.rong || 18, style: c.tien ? { numFmt: "#,##0" } : {} }));
    ws.getRow(1).font = { bold: true };
    for (const d of b.dong) ws.addRow(d);
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function traFile(duLieu: Buffer | string, tenFile: string, loai: "csv" | "xlsx") {
  return new Response(duLieu, {
    headers: {
      "Content-Type": loai === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${tenFile}"`,
      "Cache-Control": "no-store",
    },
  });
}
