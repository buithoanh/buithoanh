// Tin Zalo ZNS (SMS dự phòng) gửi tự động sau mỗi bước của đơn (thiết kế TinZalo). Mọi tin ghi vào "Tin Zalo/SMS đã gửi".
import type { Payload } from "payload";
import site from "../../site.config.mjs";
import type { DonHang } from "../../payload-types";
import { cheSdt } from "../so-dien-thoai.mjs";
import { dinhDangTien } from "../tinh-gia.mjs";
import { thongBao, type LoaiTin } from "../tich-hop/thong-bao";

export const linkDon = (token: string, trang = "") => `${site.url}/don/${token}/${trang ? `${trang}/` : ""}`;

const khongDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

/** Dựng nội dung tin cho một bước. Trả null nếu đơn chưa đủ dữ liệu cho tin đó. */
export function noiDungTin(don: DonHang, loai: LoaiTin, them: Record<string, string> = {}) {
  const ten = don.khach?.hoTen || "Quý khách";
  const xe = [don.xe?.tenXe, don.xe?.bienSo].filter(Boolean).join(" · ");
  const dv = (don.dichVu || []).map((x) => (typeof x === "object" ? x.ten : "")).filter(Boolean).join(", ") || don.suCo || "";
  const token = don.tokenTheoDoi || "";
  const tho = typeof don.tho === "object" && don.tho ? don.tho : null;
  const chung = { ten_khach: ten, ma_don: don.ma || "", xe, dich_vu: dv };
  switch (loai) {
    case "xacNhan": {
      const link = linkDon(token);
      const gio = don.khungGio?.nhan || "Khẩn cấp, thợ gần nhất tới ngay";
      return { duLieu: { ...chung, gio_hen: gio, dia_chi: don.viTri?.diaChi || "", link }, sms: `ThoToi da nhan don ${don.ma}${don.loai === "khanCap" ? " (KHAN CAP)" : ""}. ${khongDau(gio)}. Theo doi: ${link}` };
    }
    case "daXepTho": {
      if (!tho) return null;
      const link = linkDon(token);
      const den = don.thoDuKienDenLuc ? new Date(don.thoDuKienDenLuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "";
      return {
        duLieu: { ...chung, ten_tho: tho.ten, diem_sao: tho.diemSao != null ? String(Math.round(tho.diemSao * 10) / 10).replace(".", ",") : "", bien_so_xe_van: tho.bienSoXeVan || "", gio_den: den, link },
        sms: `Don ${don.ma}: tho ${khongDau(tho.ten)}${tho.bienSoXeVan ? ` (xe ${tho.bienSoXeVan})` : ""} dang den${den ? `, du kien ${den}` : ""}. Xem: ${link}`,
      };
    }
    case "baoGia": {
      const link = linkDon(token, "bao-gia");
      return { duLieu: { ...chung, so_hang_muc: them.soHangMuc || "", tong_tien: them.tongTien || "", link }, sms: `Don ${don.ma}: tho da gui bao gia ${them.tongTien || ""}. Duyet tai: ${link}` };
    }
    case "thanhToan": {
      const link = linkDon(token, "thanh-toan");
      const tien = dinhDangTien(don.thanhToan?.soTien || 0);
      return { duLieu: { ...chung, so_tien: tien, link }, sms: `Don ${don.ma} da sua xong. So tien ${khongDau(tien)}. Thanh toan VietQR: ${link}` };
    }
    case "hoanThanh": {
      const link = linkDon(token, "thanh-toan");
      return { duLieu: { ...chung, so_tien: dinhDangTien(don.thanhToan?.daNhan || 0), so_hoa_don: don.hoaDonDienTu?.so || "", ma_bao_hanh: them.maBaoHanh || "", link }, sms: `ThoToi da nhan tien don ${don.ma}. Hoa don, bao hanh: ${link}` };
    }
    case "danhGia": {
      const link = `${site.url}/don/${them.token}/danh-gia/`;
      return { duLieu: { ...chung, link }, sms: `Cam on ban da sua xe cung ThoToi (don ${don.ma}). Danh gia 1 phut: ${link}` };
    }
    case "hoaDon": {
      const link = linkDon(token, "thanh-toan");
      return { duLieu: { ...chung, so_hoa_don: don.hoaDonDienTu?.so || "", link: don.hoaDonDienTu?.linkPdf || link }, sms: `Hoa don don ${don.ma}: ${don.hoaDonDienTu?.linkPdf || link}` };
    }
    default:
      return null;
  }
}

/** Gửi một tin (Zalo, SMS dự phòng) và ghi nhật ký. Không ném lỗi: trả null nếu không gửi được. */
export async function guiTin(payload: Payload, t: { loai: LoaiTin; sdt: string; duLieu: Record<string, string>; sms: string; donHang?: number; lienQuan?: string }) {
  let kenh: "zalo" | "sms" | undefined;
  let loi: string | undefined;
  const maTheoDoi = `${t.lienQuan || t.donHang || ""}-${t.loai}`;
  try {
    kenh = await thongBao.gui({ loai: t.loai, sdt: t.sdt, duLieu: t.duLieu, sms: t.sms, maTheoDoi });
  } catch (e) {
    loi = (e as Error).message;
    payload.logger.error({ err: e, msg: `Không gửi được tin ${t.loai} ${maTheoDoi}` });
  }
  await payload.create({
    collection: "tin-nhan", overrideAccess: true,
    data: { loai: t.loai, donHang: t.donHang, lienQuan: t.lienQuan, sdtChe: cheSdt(t.sdt), kenh, trangThai: loi ? "loi" : "daGui", loi, noiDung: t.sms },
  }).catch(() => {});
  return kenh ?? null;
}

/** Gửi tin theo bước của đơn và ghi nhật ký. Không ném lỗi (đơn không được hỏng vì tin nhắn). */
export async function guiTinDon(payload: Payload, donId: number, loai: LoaiTin, them: Record<string, string> = {}) {
  const don = await payload.findByID({ collection: "don-hang", id: donId, depth: 1, overrideAccess: true });
  const nd = noiDungTin(don, loai, them);
  if (!nd || !don.khach?.sdt) return null;
  return guiTin(payload, { loai, sdt: don.khach.sdt, duLieu: nd.duLieu, sms: nd.sms, donHang: don.id, lienQuan: don.ma || undefined });
}
