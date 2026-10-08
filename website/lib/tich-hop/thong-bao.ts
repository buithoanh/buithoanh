// Gửi tin cho khách: Zalo ZNS trước, khách không dùng Zalo (hoặc ZNS lỗi) thì SMS cùng nội dung, link rút gọn.
// Bản thật:
//   Zalo ZNS: POST https://business.openapi.zalo.me/message/template, header access_token = ZALO_ZNS_ACCESS_TOKEN,
//             template xác nhận đơn = ZALO_ZNS_MAU_XAC_NHAN (mẫu INT-02 trong thiết kế TinZalo).
//   SMS:      POST {SMS_URL}, header Authorization: Bearer {SMS_KEY}, body { to, text } (giả định, chờ chọn nhà mạng).
// Phiên này (P0) chỉ gửi tin xác nhận đơn và báo điều phối trực khi có đơn khẩn cấp; tin theo từng bước đơn là P1.
import { cheDo, dangKy, goiHttp, logGiaLap } from "./chung";

const ZNS = dangKy({ ten: "zalo-zns", moTa: "Zalo ZNS (tin đơn hàng)", bien: ["ZALO_ZNS_ACCESS_TOKEN", "ZALO_ZNS_MAU_XAC_NHAN"] });
const SMS = dangKy({ ten: "sms", moTa: "SMS dự phòng", bien: ["SMS_URL", "SMS_KEY"] });

export type TinXacNhan = {
  sdt: string; hoTen?: string; ma: string; dichVu: string; gioHen: string; xe: string; diaChi: string; link: string; khanCap: boolean;
};

const sdtQuocTe = (sdt: string) => "84" + sdt.replace(/^0/, "");

async function guiZns(mau: string, sdt: string, duLieu: Record<string, string>, maTheoDoi: string) {
  const j = (await goiHttp("Zalo ZNS", "https://business.openapi.zalo.me/message/template", {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: process.env.ZALO_ZNS_ACCESS_TOKEN! },
    body: JSON.stringify({ phone: sdtQuocTe(sdt), template_id: mau, template_data: duLieu, tracking_id: maTheoDoi }),
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
  /** Trả về kênh đã gửi được. Ném lỗi nếu cả Zalo và SMS đều không gửi được. */
  async guiXacNhanDon(t: TinXacNhan): Promise<"zalo" | "sms"> {
    const chao = t.hoTen ? `Chào ${t.hoTen}, ` : "";
    try {
      if (cheDo(ZNS) === "giaLap") {
        logGiaLap("zalo-zns", `xác nhận đơn ${t.ma} tới ${t.sdt}`, { link: t.link });
        return "zalo";
      }
      await guiZns(process.env.ZALO_ZNS_MAU_XAC_NHAN!, t.sdt, {
        ten_khach: t.hoTen || "Quý khách", ma_don: t.ma, gio_hen: t.gioHen, dich_vu: t.dichVu, xe: t.xe, dia_chi: t.diaChi, link: t.link,
      }, t.ma);
      return "zalo";
    } catch (loiZalo) {
      const noiDung = `${chao}ThoToi da nhan don ${t.ma}${t.khanCap ? " (KHAN CAP)" : ""}. ${t.gioHen}. Theo doi: ${t.link}`;
      try {
        await guiSms(t.sdt, noiDung);
        return "sms";
      } catch (loiSms) {
        throw new Error(`Zalo: ${(loiZalo as Error).message}. SMS: ${(loiSms as Error).message}`);
      }
    }
  },
  /** Nhắn số trực điều phối (SDT_TRUC_DIEU_PHOI) khi có đơn khẩn cấp. Không đặt số thì bỏ qua. */
  async baoTrucDieuPhoi(noiDung: string) {
    const sdt = process.env.SDT_TRUC_DIEU_PHOI;
    if (!sdt) return false;
    await guiSms(sdt, noiDung);
    return true;
  },
};
