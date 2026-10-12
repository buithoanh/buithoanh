// Endpoint phục vụ khách sau khi đặt (gắn vào collection Đơn hàng: /api/don-hang/...).
// - Thợ/điều phối (đăng nhập hoặc khoá API, vai trò dieuPhoi/quanLyDichVu/quanTri): xếp thợ, vị trí, báo giá, xong, thu tay.
// - Khách (link riêng): xem/duyệt/từ chối báo giá, xem thanh toán, gửi lại hoá đơn, xem ảnh lỗi, đánh giá.
import type { Endpoint, PayloadRequest } from "payload";
import { LoiNguoiDung } from "../cong-khai";
import { xuLyDuocDon } from "../quyen";
import { docBody, gioiHan, ipCua, json, traLoi } from "../api/chung";
import { nganHang } from "../tich-hop/ngan-hang";
import {
  capNhatViTriTho, danhDauXong, donTheoLink, donTheoMa, duyetBaoGia, guiLaiHoaDon, nhanTien, taoBaoGia, tuChoiBaoGia, xemBaoGia, xemThanhToan, xepTho,
} from "./phuc-vu";
import { guiDanhGia, xemDanhGia } from "./danh-gia";

type XuLy = (req: PayloadRequest, body: Record<string, unknown>) => Promise<unknown>;

/** Endpoint cho thợ/điều phối: bắt đăng nhập + quyền xử lý đơn. */
const choNoiBo = (path: string, xuLy: XuLy, method: "post" | "get" = "post"): Endpoint => ({
  path, method,
  handler: async (req) => {
    try {
      if (!req.user) throw new LoiNguoiDung("Cần đăng nhập hoặc khoá API.", 401, "CHUA_DANG_NHAP");
      if (!xuLyDuocDon(req)) throw new LoiNguoiDung("Tài khoản này không xử lý đơn được.", 403, "KHONG_CO_QUYEN");
      const { duLieu } = method === "post" ? await docBody(req) : { duLieu: {} };
      return json(await xuLy(req, duLieu));
    } catch (e) {
      return traLoi(req, e);
    }
  },
});

/** Endpoint cho khách qua link riêng: giới hạn tần suất theo IP. */
const choKhach = (path: string, xuLy: XuLy, method: "post" | "get" = "get"): Endpoint => ({
  path, method,
  handler: async (req) => {
    try {
      gioiHan(`khach:ip:${ipCua(req)}`, method === "post" ? 30 : 200, 10);
      const { duLieu } = method === "post" ? await docBody(req) : { duLieu: {} };
      return json(await xuLy(req, duLieu));
    } catch (e) {
      return traLoi(req, e);
    }
  },
});

const ma = (req: PayloadRequest) => String(req.routeParams?.ma || "");
const token = (req: PayloadRequest) => String(req.routeParams?.token || "");

export const endpointPhucVu: Endpoint[] = [
  // ---- thợ, điều phối
  choNoiBo("/:ma/xep-tho", (req, b) => xepTho(req.payload, req, ma(req), { tho: b.tho as string, duKienDenLuc: b.duKienDenLuc as string | undefined })),
  choNoiBo("/:ma/vi-tri-tho", (req, b) => capNhatViTriTho(req.payload, req, ma(req), { lat: Number(b.lat), lng: Number(b.lng), duKienDenLuc: b.duKienDenLuc as string | undefined })),
  choNoiBo("/:ma/bao-gia", (req, b) => taoBaoGia(req.payload, req, ma(req), { chanDoan: b.chanDoan as string | undefined, hangMuc: b.hangMuc as never })),
  choNoiBo("/:ma/xong", (req, b) => danhDauXong(req.payload, req, ma(req), { soKm: b.soKm == null ? undefined : Number(b.soKm) })),
  choNoiBo("/:ma/thu-tay", async (req, b) => {
    const don = await donTheoMa(req.payload, ma(req));
    const soTien = Number(b.soTien);
    if (!Number.isInteger(soTien) || soTien <= 0) throw new LoiNguoiDung("Số tiền phải là số nguyên đồng.", 400, "DU_LIEU_SAI");
    return nhanTien(req.payload, {
      maGiaoDich: `TIENMAT-${don.ma}-${Date.now()}`, soTien, noiDung: `Thu tay ${don.ma}`, luc: new Date().toISOString(),
      nguon: `tay:${(req.user as { email?: string }).email}`, hinhThuc: "tienMat", maDon: don.ma!,
    });
  }),

  // ---- khách, qua link riêng
  choKhach("/theo-doi/:token/bao-gia", (req) => xemBaoGia(req.payload, token(req))),
  choKhach("/theo-doi/:token/bao-gia/duyet", (req, b) => duyetBaoGia(req.payload, token(req), { boHangMuc: (b.boHangMuc as string[]) || [], dongY: b.dongY === true }), "post"),
  choKhach("/theo-doi/:token/bao-gia/tu-choi", (req, b) => tuChoiBaoGia(req.payload, token(req), { lyDo: b.lyDo as string | undefined }), "post"),
  choKhach("/theo-doi/:token/thanh-toan", (req) => xemThanhToan(req.payload, token(req))),
  choKhach("/theo-doi/:token/gui-hoa-don", (req, b) => {
    gioiHan(`hoa-don:${token(req)}`, 3, 60);
    return guiLaiHoaDon(req.payload, token(req), { kenh: b.kenh as string, email: b.email as string });
  }, "post"),
  {
    // Ảnh lỗi trong báo giá (tệp của đơn không công khai): chỉ trả khi ảnh thuộc đúng đơn của link
    path: "/theo-doi/:token/anh/:id",
    method: "get",
    handler: async (req) => {
      try {
        const don = await donTheoLink(req.payload, token(req));
        const tep = await req.payload.findByID({ collection: "tep-don-hang", id: Number(req.routeParams?.id), overrideAccess: true }).catch(() => null);
        const thuocDon = tep && (typeof tep.donHang === "object" ? tep.donHang?.id : tep.donHang) === don.id;
        if (!tep || !thuocDon || !tep.filename) throw new LoiNguoiDung("Không có ảnh này.", 404, "KHONG_TIM_THAY");
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const duLieu = await fs.readFile(path.join(process.env.MEDIA_DIR || "media", "don-hang", tep.filename));
        return new Response(duLieu, { headers: { "Content-Type": tep.mimeType || "application/octet-stream", "Cache-Control": "private, max-age=600" } });
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    // Chỉ khi ngân hàng chạy giả lập: bấm "tiền về" để chạy thử luồng thanh toán (thay cho webhook thật)
    path: "/theo-doi/:token/gia-lap-tien-ve",
    method: "post",
    handler: async (req) => {
      try {
        if (nganHang.cheDo() !== "giaLap") throw new LoiNguoiDung("Chỉ dùng khi ngân hàng chạy giả lập.", 404, "KHONG_TIM_THAY");
        const don = await donTheoLink(req.payload, token(req));
        const con = Math.max(0, (don.thanhToan?.soTien || 0) - (don.thanhToan?.daNhan || 0));
        if (!con) throw new LoiNguoiDung("Đơn chưa có số tiền cần trả.", 409, "CHUA_TINH_TIEN");
        return json(await nhanTien(req.payload, {
          maGiaoDich: `GIALAP${Date.now()}`, soTien: con, noiDung: `CK ${don.ma!.replace("-", "")}`, luc: new Date().toISOString(), nguon: "gia-lap",
        }));
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  choKhach("/danh-gia/:token", (req) => xemDanhGia(req.payload, token(req))),
  choKhach("/danh-gia/:token", (req, b) => guiDanhGia(req.payload, token(req), {
    soSao: Number(b.soSao), vanDe: (b.vanDe as string[]) || [], moTa: b.moTa as string, sdtGoiLai: b.sdtGoiLai as string,
  }), "post"),
];
