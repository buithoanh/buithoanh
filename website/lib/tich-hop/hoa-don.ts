// Hoá đơn điện tử (có mã của cơ quan thuế). Nhà cung cấp chưa chọn (VNPT, Viettel, MISA… mỗi bên một API).
// Bản thật (giả định, chờ chọn nhà cung cấp): POST {HOA_DON_URL}/hoa-don, Authorization: Bearer {HOA_DON_KEY}
//   → { so, kyHieu, maCQT, linkXem, linkPdf }
import { cheDo, dangKy, goiHttp, logGiaLap } from "./chung";

export type YeuCauHoaDon = {
  maDon: string;
  nguoiMua: { ten?: string; sdt?: string; congTy?: { mst: string; ten: string; diaChi: string; email: string } | null };
  dong: { ten: string; soTien: number; loai: string }[];
  tong: number;
  hinhThuc: string;
};
export type HoaDon = { so: string; kyHieu: string; maCQT: string; linkXem: string | null; linkPdf: string | null };

const MO_TA = dangKy({ ten: "hoa-don", moTa: "Hoá đơn điện tử", bien: ["HOA_DON_URL", "HOA_DON_KEY"] });

export const hoaDon = {
  moTa: MO_TA,
  async xuat(y: YeuCauHoaDon): Promise<HoaDon> {
    if (cheDo(MO_TA) === "giaLap") {
      const so = String(Date.now() % 10000000).padStart(7, "0");
      logGiaLap("hoa-don", `xuất hoá đơn đơn ${y.maDon}`, { tong: y.tong });
      return { so, kyHieu: "1C26TTT", maCQT: `GIALAP-${so}`, linkXem: null, linkPdf: null };
    }
    const j = (await goiHttp("Hoá đơn điện tử", `${process.env.HOA_DON_URL}/hoa-don`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.HOA_DON_KEY}` },
      body: JSON.stringify(y),
    })) as Partial<HoaDon> | null;
    if (!j?.so) throw new Error("Nhà cung cấp hoá đơn không trả số hoá đơn.");
    return { so: String(j.so), kyHieu: String(j.kyHieu || ""), maCQT: String(j.maCQT || ""), linkXem: j.linkXem || null, linkPdf: j.linkPdf || null };
  },
};
