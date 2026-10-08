// Gửi tin cho khách: Zalo ZNS trước; khách không dùng Zalo (hoặc ZNS lỗi) thì SMS cùng nội dung, link rút gọn.
// Bản thật:
//   Zalo ZNS: POST https://business.openapi.zalo.me/message/template, header access_token = ZALO_ZNS_ACCESS_TOKEN.
//             Mỗi loại tin một mẫu đăng ký với Zalo: ZALO_ZNS_MAU_<LOẠI> (vd ZALO_ZNS_MAU_XAC_NHAN). Thiếu mẫu → gửi SMS.
//             Tên tham số trong mẫu phải khớp `duLieu` bên dưới (MAU_TIN).
//   SMS:      POST {SMS_URL}, header Authorization: Bearer {SMS_KEY}, body { to, text } (giả định, chờ chọn nhà mạng).
import { cheDo, dangKy, goiHttp, logGiaLap } from "./chung";

const ZNS = dangKy({ ten: "zalo-zns", moTa: "Zalo ZNS (tin đơn hàng)", bien: ["ZALO_ZNS_ACCESS_TOKEN", "ZALO_ZNS_MAU_XAC_NHAN"] });
const SMS = dangKy({ ten: "sms", moTa: "SMS dự phòng", bien: ["SMS_URL", "SMS_KEY"] });

/** Các loại tin (thiết kế TinZalo, mẫu INT-02…). bien = biến môi trường chứa mã mẫu ZNS. */
export const MAU_TIN = {
  xacNhan: { bien: "ZALO_ZNS_MAU_XAC_NHAN", ten: "Xác nhận đơn" },
  daXepTho: { bien: "ZALO_ZNS_MAU_XEP_THO", ten: "Đã xếp thợ" },
  baoGia: { bien: "ZALO_ZNS_MAU_BAO_GIA", ten: "Báo giá chính thức" },
  thanhToan: { bien: "ZALO_ZNS_MAU_THANH_TOAN", ten: "Mời thanh toán" },
  hoanThanh: { bien: "ZALO_ZNS_MAU_HOAN_THANH", ten: "Đã thanh toán, hoá đơn và bảo hành" },
  danhGia: { bien: "ZALO_ZNS_MAU_DANH_GIA", ten: "Mời đánh giá" },
  maXacNhan: { bien: "ZALO_ZNS_MAU_MA_XAC_NHAN", ten: "Mã xác nhận tra cứu xe" },
  hoaDon: { bien: "ZALO_ZNS_MAU_HOA_DON", ten: "Gửi lại hoá đơn" },
  hoiVienThanhToan: { bien: "ZALO_ZNS_MAU_HOI_VIEN_THANH_TOAN", ten: "Link thanh toán gói hội viên" },
  hoiVienKichHoat: { bien: "ZALO_ZNS_MAU_HOI_VIEN_KICH_HOAT", ten: "Gói hội viên đã có hiệu lực" },
  hoiVienSapHet: { bien: "ZALO_ZNS_MAU_HOI_VIEN_SAP_HET", ten: "Nhắc gia hạn gói hội viên" },
  maGioiThieu: { bien: "ZALO_ZNS_MAU_MA_GIOI_THIEU", ten: "Mã giới thiệu của bạn" },
  gioiThieuThuong: { bien: "ZALO_ZNS_MAU_GIOI_THIEU_THUONG", ten: "Nhận lượt thưởng giới thiệu" },
} as const;
export type LoaiTin = keyof typeof MAU_TIN;

export type Tin = {
  loai: LoaiTin;
  sdt: string;
  /** Tham số mẫu ZNS (chuỗi). */
  duLieu: Record<string, string>;
  /** Nội dung SMS (không dấu, ngắn) khi không gửi được Zalo. */
  sms: string;
  /** "sms" = khách chọn nhận SMS (vd mã tra cứu xe). */
  kenh?: "zalo" | "sms";
  maTheoDoi?: string;
};

const sdtQuocTe = (sdt: string) => "84" + sdt.replace(/^0/, "");

async function guiZns(mau: string, t: Tin) {
  const j = (await goiHttp("Zalo ZNS", "https://business.openapi.zalo.me/message/template", {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: process.env.ZALO_ZNS_ACCESS_TOKEN! },
    body: JSON.stringify({ phone: sdtQuocTe(t.sdt), template_id: mau, template_data: t.duLieu, tracking_id: t.maTheoDoi || t.loai }),
  })) as { error?: number; message?: string } | null;
  if (j?.error) throw new Error(`Zalo ZNS lỗi ${j.error}: ${j.message || ""}`);
}

async function guiSms(sdt: string, noiDung: string) {
  if (cheDo(SMS) === "giaLap") {
    logGiaLap("sms", `gửi ${sdt}`, noiDung);
    return;
  }
  await goiHttp("SMS", process.env.SMS_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SMS_KEY}` },
    body: JSON.stringify({ to: sdt, text: noiDung }),
  });
}

export const thongBao = {
  moTa: [ZNS, SMS],
  /** Cả Zalo và SMS đều giả lập (máy chạy thử): khách không nhận được tin thật. */
  dangGiaLap(): boolean {
    try {
      return cheDo(ZNS) === "giaLap" && cheDo(SMS) === "giaLap";
    } catch {
      return false;
    }
  },
  /** Gửi một tin. Trả về kênh đã gửi. Ném lỗi nếu cả Zalo và SMS đều không gửi được. */
  async gui(t: Tin): Promise<"zalo" | "sms"> {
    let loiZalo: unknown = null;
    if (t.kenh !== "sms") {
      try {
        if (cheDo(ZNS) === "giaLap") {
          logGiaLap("zalo-zns", `${MAU_TIN[t.loai].ten} tới ${t.sdt}`, t.duLieu);
          return "zalo";
        }
        const mau = process.env[MAU_TIN[t.loai].bien];
        if (!mau) throw new Error(`Chưa có mẫu ZNS ${MAU_TIN[t.loai].bien}`);
        await guiZns(mau, t);
        return "zalo";
      } catch (e) {
        loiZalo = e;
      }
    }
    try {
      await guiSms(t.sdt, t.sms);
      return "sms";
    } catch (loiSms) {
      throw new Error(`${loiZalo ? `Zalo: ${(loiZalo as Error).message}. ` : ""}SMS: ${(loiSms as Error).message}`);
    }
  },
  /** Nhắn SMS nội bộ (trực điều phối, CSKH). Không có số thì bỏ qua. */
  async nhanNoiBo(sdt: string | undefined | null, noiDung: string) {
    if (!sdt) return false;
    await guiSms(sdt, noiDung);
    return true;
  },
};
