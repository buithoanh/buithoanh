// Ngân hàng: nhận xác nhận tiền về qua webhook của dịch vụ đọc biến động số dư (SePay hoặc Casso).
// Bản thật:
//   NGAN_HANG_NHA_CUNG_CAP = sepay | casso
//   NGAN_HANG_WEBHOOK_KEY  = khoá bí mật cài ở trang quản trị SePay/Casso
//   SePay gửi header "Authorization: Apikey <khoá>", body { id, transferType: "in", transferAmount, content, referenceCode, transactionDate }
//   Casso gửi header "secure-token: <khoá>", body { error: 0, data: [{ id, tid, amount, description, when }] }
// Bản giả lập: không kiểm khoá; dùng cùng định dạng SePay. Chỉ chạy được khi cho phép giả lập (xem chung.ts).
import crypto from "node:crypto";
import { cheDo, dangKy } from "./chung";

export type GiaoDichVao = { maGiaoDich: string; soTien: number; noiDung: string; luc: string; nguon: string };

const MO_TA = dangKy({ ten: "ngan-hang", moTa: "Ngân hàng, xác nhận tiền về (SePay/Casso)", bien: ["NGAN_HANG_NHA_CUNG_CAP", "NGAN_HANG_WEBHOOK_KEY"] });

const bangNhau = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

function docSepay(b: Record<string, unknown>): GiaoDichVao[] {
  if (b.transferType && b.transferType !== "in") return [];
  return [{
    maGiaoDich: String(b.referenceCode || b.id || ""),
    soTien: Math.round(Number(b.transferAmount) || 0),
    noiDung: String(b.content || b.description || ""),
    luc: b.transactionDate ? new Date(String(b.transactionDate).replace(" ", "T") + "+07:00").toISOString() : new Date().toISOString(),
    nguon: "sepay",
  }];
}

function docCasso(b: { data?: Record<string, unknown>[] }): GiaoDichVao[] {
  return (b.data || [])
    .filter((x) => Number(x.amount) > 0)
    .map((x) => ({
      maGiaoDich: String(x.tid || x.id || ""),
      soTien: Math.round(Number(x.amount) || 0),
      noiDung: String(x.description || ""),
      luc: x.when ? new Date(String(x.when).replace(" ", "T") + "+07:00").toISOString() : new Date().toISOString(),
      nguon: "casso",
    }));
}

export const nganHang = {
  moTa: MO_TA,
  cheDo: () => cheDo(MO_TA),
  /** Kiểm khoá và đọc giao dịch tiền vào. Sai khoá: ném lỗi (endpoint trả 401). */
  docWebhook(headers: Headers, body: unknown): GiaoDichVao[] {
    const b = (body || {}) as Record<string, unknown>;
    if (cheDo(MO_TA) === "giaLap") return docSepay(b).map((g) => ({ ...g, nguon: "gia-lap" }));
    const key = process.env.NGAN_HANG_WEBHOOK_KEY!;
    const ncc = process.env.NGAN_HANG_NHA_CUNG_CAP;
    if (ncc === "casso") {
      if (!bangNhau(headers.get("secure-token") || "", key)) throw new Error("Sai khoá webhook ngân hàng");
      return docCasso(b as { data?: Record<string, unknown>[] });
    }
    const auth = (headers.get("authorization") || "").replace(/^Apikey\s+/i, "");
    if (!bangNhau(auth, key)) throw new Error("Sai khoá webhook ngân hàng");
    return docSepay(b);
  },
};
