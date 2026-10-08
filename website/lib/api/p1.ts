// Endpoint cấp config cho P1: webhook ngân hàng, tra cứu lịch sử xe, việc định kỳ.
import crypto from "node:crypto";
import type { Endpoint, PayloadRequest } from "payload";
import { LoiNguoiDung } from "../cong-khai";
import { nganHang } from "../tich-hop/ngan-hang";
import { nhanTien } from "../don/phuc-vu";
import { guiLinkDanhGiaDenHan } from "../don/danh-gia";
import { guiMaTraCuu, lichSuXe, thoatTraCuu, xacNhanMa } from "../tra-cuu-xe";
import { dangBaiHenGio, danhSachBai } from "../noi-dung";
import { laNguoiViet } from "../quyen";
import { docBody, gioiHan, ipCua, json, traLoi } from "./chung";

const phienCua = (req: PayloadRequest) =>
  (req.headers.get("authorization") || "").replace(/^Phien\s+/i, "") || req.searchParams.get("phien") || "";

const bangNhau = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Chạy các việc định kỳ một lần. Server gọi mỗi 5 phút (service "hen-gio" trong docker-compose). */
export async function chayViecDinhKy(payload: PayloadRequest["payload"]) {
  const [danhGia, baiDang] = [await guiLinkDanhGiaDenHan(payload), await dangBaiHenGio(payload)];
  const cu = new Date(Date.now() - 2 * 86400000).toISOString();
  await payload.delete({ collection: "ma-xac-nhan", overrideAccess: true, where: { guiLuc: { less_than: cu } } });
  return { guiLinkDanhGia: danhGia, dangBaiHenGio: baiDang, luc: new Date().toISOString() };
}

export const endpointP1: Endpoint[] = [
  {
    // Màn QtBaiViet: mọi bài và trang (4 loại) với trạng thái Nháp / Chờ duyệt / Đã hẹn giờ / Đã đăng
    path: "/quan-tri/bai-viet",
    method: "get",
    handler: async (req) => {
      try {
        if (!laNguoiViet(req)) throw new LoiNguoiDung("Cần đăng nhập tài khoản nội dung.", req.user ? 403 : 401, "KHONG_CO_QUYEN");
        return json(await danhSachBai(req.payload, {
          trangThai: req.searchParams.get("trangThai") || undefined, loai: req.searchParams.get("loai") || undefined, q: req.searchParams.get("q") || undefined,
        }));
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    // Webhook tiền về từ SePay/Casso. Trả 200 kể cả khi không khớp đơn (đã ghi lại để đối soát), để bên kia không gửi lại mãi.
    path: "/thanh-toan/webhook",
    method: "post",
    handler: async (req) => {
      try {
        const body = req.json ? await req.json().catch(() => null) : null;
        let giaoDich;
        try {
          giaoDich = nganHang.docWebhook(req.headers, body);
        } catch (e) {
          return json({ success: false, loi: (e as Error).message }, 401);
        }
        const ketQua = [];
        for (const g of giaoDich) ketQua.push(await nhanTien(req.payload, g));
        return json({ success: true, ketQua });
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    path: "/tra-cuu-xe/gui-ma",
    method: "post",
    handler: async (req) => {
      try {
        gioiHan(`tra-cuu:ip:${ipCua(req)}`, 10, 30);
        const { duLieu } = await docBody(req);
        gioiHan(`tra-cuu:bien-so:${String(duLieu.bienSo || "").toUpperCase().replace(/\W/g, "")}`, 5, 60);
        return json(await guiMaTraCuu(req.payload, { bienSo: String(duLieu.bienSo || ""), kenh: duLieu.kenh as string }));
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    path: "/tra-cuu-xe/xac-nhan",
    method: "post",
    handler: async (req) => {
      try {
        gioiHan(`tra-cuu-xn:ip:${ipCua(req)}`, 20, 30);
        const { duLieu } = await docBody(req);
        return json(await xacNhanMa(req.payload, { bienSo: String(duLieu.bienSo || ""), ma: String(duLieu.ma || "") }));
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    path: "/tra-cuu-xe/lich-su",
    method: "get",
    handler: async (req) => {
      try {
        gioiHan(`tra-cuu-ls:ip:${ipCua(req)}`, 120, 10);
        return json(await lichSuXe(req.payload, phienCua(req)));
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    path: "/tra-cuu-xe/thoat",
    method: "post",
    handler: async (req) => {
      try {
        return json(await thoatTraCuu(req.payload, phienCua(req)));
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    path: "/viec-dinh-ky",
    method: "post",
    handler: async (req) => {
      try {
        const khoa = process.env.VIEC_DINH_KY_KEY;
        const gui = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const duocPhep = khoa ? bangNhau(gui, khoa) : process.env.NODE_ENV !== "production" || (req.user as { vaiTro?: string } | null)?.vaiTro === "quanTri";
        if (!duocPhep) throw new LoiNguoiDung("Sai khoá việc định kỳ.", 401, "CHUA_DANG_NHAP");
        return json(await chayViecDinhKy(req.payload));
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
];
