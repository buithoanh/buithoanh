// Phần mềm điều phối (app thợ của VCsoft): nhận đơn mới để xếp thợ.
// Chiều ngược lại (điều phối cập nhật trạng thái đơn vào web) dùng API có khoá: xem docs/api.md, mục "Điều phối".
//
// Bản thật (giả định, chờ VCsoft xác nhận hợp đồng):
//   POST {DIEU_PHOI_URL}/don-hang      Authorization: Bearer {DIEU_PHOI_KEY}
//   body: DonGuiDieuPhoi (JSON)        → 200 { "id": "<mã đơn bên điều phối>" }
import { cheDo, dangKy, goiHttp, logGiaLap } from "./chung";

export type DonGuiDieuPhoi = {
  ma: string; loai: "datLich" | "khanCap"; uuTien: number; trangThai: string;
  dichVu: string[]; suCo?: string; trieuChung?: string;
  xe: { ten?: string; bienSo?: string; doi?: number; soKm?: number };
  viTri: { lat?: number; lng?: number; diaChi?: string; quan?: string; phuong?: string; choDo?: string; ghiChuChoTho?: string };
  khungGio?: { ngay: string; batDau: string; ketThuc: string };
  khach: { hoTen?: string; sdt: string };
  giaSoBo?: { tu: number; den: number } | null;
  linkTheoDoi: string;
};

const MO_TA = dangKy({ ten: "dieu-phoi", moTa: "Phần mềm điều phối (VCsoft)", bien: ["DIEU_PHOI_URL", "DIEU_PHOI_KEY"] });

export const dieuPhoi = {
  moTa: MO_TA,
  async guiDonMoi(don: DonGuiDieuPhoi): Promise<{ id: string }> {
    if (cheDo(MO_TA) === "giaLap") {
      logGiaLap("dieu-phoi", `gửi đơn ${don.ma}${don.loai === "khanCap" ? " (KHẨN CẤP)" : ""}`, { dichVu: don.dichVu, quan: don.viTri.quan });
      return { id: `GL-${don.ma}` };
    }
    const j = (await goiHttp("Phần mềm điều phối", `${process.env.DIEU_PHOI_URL}/don-hang`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DIEU_PHOI_KEY}` },
      body: JSON.stringify(don),
    })) as { id?: string } | null;
    if (!j?.id) throw new Error("Phần mềm điều phối không trả mã đơn.");
    return { id: String(j.id) };
  },
  /** Báo điều phối khi người trong công ty đổi trạng thái đơn trên web (vd huỷ theo yêu cầu khách). */
  async baoDoiTrangThai(ma: string, trangThai: string, ghiChu?: string) {
    if (cheDo(MO_TA) === "giaLap") {
      logGiaLap("dieu-phoi", `đơn ${ma} → ${trangThai}`, ghiChu);
      return;
    }
    await goiHttp("Phần mềm điều phối", `${process.env.DIEU_PHOI_URL}/don-hang/${encodeURIComponent(ma)}/trang-thai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DIEU_PHOI_KEY}` },
      body: JSON.stringify({ trangThai, ghiChu }),
    });
  },
};
