// Tra mã số thuế để tự điền tên, địa chỉ công ty (form DoanhNghiep).
// Bản thật: MST_URL, mặc định gợi ý API công khai của VietQR: https://api.vietqr.io/v2/business/{mst}
//   → { code: "00", data: { id, name, internationalName, shortName, address } }. Có MST_KEY thì gửi header x-api-key.
//   Đặt MST_URL=https://api.vietqr.io/v2/business (bắt buộc đặt rõ, kể cả khi dịch vụ không cần khoá).
// Giả lập: trả công ty mẫu cho mọi MST đúng dạng, MST kết thúc bằng 000 thì "không tìm thấy".
import { cheDo, dangKy, goiHttp, logGiaLap } from "./chung";

export type CongTy = { mst: string; ten: string; tenQuocTe: string | null; tenVietTat: string | null; diaChi: string | null };

const MO_TA = dangKy({ ten: "tra-mst", moTa: "Tra mã số thuế (tên, địa chỉ công ty)", bien: ["MST_URL"] });

export const traMst = {
  moTa: MO_TA,
  /** null = không tìm thấy MST. Ném lỗi khi dịch vụ tra cứu lỗi. */
  async tra(mst: string): Promise<CongTy | null> {
    if (cheDo(MO_TA) === "giaLap") {
      logGiaLap("tra-mst", `tra ${mst}`);
      if (mst.endsWith("000")) return null;
      return { mst, ten: `CÔNG TY TNHH VẬN TẢI MẪU ${mst.slice(-4)}`, tenQuocTe: null, tenVietTat: null, diaChi: "12 Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội (DỮ LIỆU MẪU)" };
    }
    const j = (await goiHttp("Tra mã số thuế", `${process.env.MST_URL!.replace(/\/$/, "")}/${encodeURIComponent(mst)}`, {
      headers: process.env.MST_KEY ? { "x-api-key": process.env.MST_KEY } : {},
      hanMs: 6000,
    })) as { code?: string; data?: { name?: string; internationalName?: string; shortName?: string; address?: string } | null } | null;
    if (!j?.data?.name) return null;
    return { mst, ten: j.data.name, tenQuocTe: j.data.internationalName || null, tenVietTat: j.data.shortName || null, diaChi: j.data.address || null };
  },
};
