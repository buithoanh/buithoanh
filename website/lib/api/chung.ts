// Tiện ích cho endpoint: đọc body (JSON hoặc multipart có tệp), IP, giới hạn tần suất, trả lỗi tiếng Việt.
import type { PayloadRequest } from "payload";
import { ghiNhan } from "../gioi-han.mjs";
import { LoiNguoiDung } from "../cong-khai";
import type { TepTaiLen } from "../don/tao-don";

export const ipCua = (req: PayloadRequest) =>
  (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "?";

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Trả { loi, ma, ...chiTiet } với mã HTTP phù hợp. Lỗi lạ: ghi log, trả câu chung. */
export function traLoi(req: PayloadRequest, e: unknown) {
  if (e instanceof LoiNguoiDung) return json({ loi: e.message, ma: e.ma, ...(e.chiTiet || {}) }, e.status);
  req.payload.logger.error({ err: e, msg: `Lỗi API ${req.url}` });
  return json({ loi: "Có lỗi trên máy chủ. Vui lòng thử lại hoặc gọi hotline.", ma: "LOI_MAY_CHU" }, 500);
}

/** Vượt giới hạn thì ném lỗi 429. */
export function gioiHan(khoa: string, toiDa: number, trongPhut: number) {
  const r = ghiNhan(khoa, { toiDa, trongMs: trongPhut * 60 * 1000 });
  if (r.vuot) throw new LoiNguoiDung(`Bạn thao tác quá nhanh, thử lại sau ${Math.max(1, Math.ceil(r.conLaiGiay / 60))} phút hoặc gọi hotline.`, 429, "QUA_NHIEU_LAN");
}

/**
 * Đọc body. Hỗ trợ:
 *  - application/json
 *  - multipart/form-data: ô "duLieu" là JSON của đơn; ô "tep" (lặp lại) là ảnh/video;
 *    ô "thoiLuongVideo" là số giây của video (trình duyệt đo).
 */
export async function docBody(req: PayloadRequest): Promise<{ duLieu: Record<string, unknown>; tep: TepTaiLen[] }> {
  const loai = req.headers.get("content-type") || "";
  try {
    if (loai.includes("multipart/form-data")) {
      const fd = await (req as unknown as Request).formData();
      const duLieu = JSON.parse(String(fd.get("duLieu") || "{}"));
      const thoiLuong = Number(fd.get("thoiLuongVideo")) || null;
      const tep: TepTaiLen[] = [];
      for (const v of fd.getAll("tep")) {
        if (typeof v === "string") continue;
        tep.push({ ten: v.name || "tep", loai: v.type || "", kichThuoc: v.size, duLieu: Buffer.from(await v.arrayBuffer()), thoiLuongGiay: v.type.startsWith("video/") ? thoiLuong : null });
      }
      return { duLieu, tep };
    }
    const duLieu = req.json ? await req.json() : {};
    return { duLieu: duLieu && typeof duLieu === "object" ? duLieu : {}, tep: [] };
  } catch {
    throw new LoiNguoiDung("Dữ liệu gửi lên không đọc được.", 400, "BODY_SAI");
  }
}
