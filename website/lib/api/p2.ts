// Endpoint P2: hội viên, giới thiệu bạn bè, doanh nghiệp, tuyển thợ. Logic ở lib/hoi-vien.ts, lib/gioi-thieu.ts, lib/p2.ts.
import type { Endpoint, PayloadRequest } from "payload";
import { LoiNguoiDung } from "../cong-khai";
import { laBot } from "../don/dau-vao.mjs";
import { chuanHoaSdt } from "../so-dien-thoai.mjs";
import { nganHang } from "../tich-hop/ngan-hang";
import { ghiLuotMo, guiMaGioiThieu, xemGioiThieu } from "../gioi-thieu";
import { dangKyHoiVien, layTrangHoiVien, xemThanhToanHoiVien } from "../hoi-vien";
import { guiHoSoTho, guiYeuCauDoanhNghiep, layTrangDoanhNghiep, layTrangTuyenTho, traCuuMst } from "../p2";
import { docBody, gioiHan, ipCua, json, traLoi } from "./chung";

type XuLy = (req: PayloadRequest) => Promise<unknown>;
const diem = (path: string, method: "get" | "post", xuLy: XuLy, trangThai = 200): Endpoint => ({
  path, method,
  handler: async (req) => {
    try {
      return json(await xuLy(req), trangThai);
    } catch (e) {
      return traLoi(req, e);
    }
  },
});
const token = (req: PayloadRequest) => String(req.routeParams?.token || "");

/** Gắn vào config (/api/...). */
export const endpointP2: Endpoint[] = [
  diem("/trang/hoi-vien", "get", (req) => (gioiHan(`doc:ip:${ipCua(req)}`, 600, 5), layTrangHoiVien(req.payload))),
  diem("/trang/doanh-nghiep", "get", (req) => (gioiHan(`doc:ip:${ipCua(req)}`, 600, 5), layTrangDoanhNghiep(req.payload))),
  diem("/trang/tuyen-tho", "get", (req) => (gioiHan(`doc:ip:${ipCua(req)}`, 600, 5), layTrangTuyenTho(req.payload))),

  diem("/gioi-thieu/gui-ma", "post", async (req) => {
    gioiHan(`gt-gui:ip:${ipCua(req)}`, 10, 30);
    const { duLieu } = await docBody(req);
    const sdt = chuanHoaSdt(duLieu.sdt);
    if (sdt) gioiHan(`gt-gui:sdt:${sdt}`, 3, 60);
    return guiMaGioiThieu(req.payload, duLieu.sdt);
  }),
  diem("/gioi-thieu/mo", "post", async (req) => {
    gioiHan(`gt-mo:ip:${ipCua(req)}`, 60, 10);
    const { duLieu } = await docBody(req);
    return ghiLuotMo(req.payload, String(duLieu.ma || ""), ipCua(req));
  }, 202),
  diem("/gioi-thieu/xem/:token", "get", (req) => (gioiHan(`gt-xem:ip:${ipCua(req)}`, 120, 10), xemGioiThieu(req.payload, token(req)))),

  diem("/doanh-nghiep/tra-mst", "get", (req) => (gioiHan(`mst:ip:${ipCua(req)}`, 20, 10), traCuuMst(req.searchParams.get("mst")))),
  {
    path: "/doanh-nghiep/yeu-cau", method: "post",
    handler: async (req) => {
      try {
        gioiHan(`dn:ip:${ipCua(req)}`, 5, 30);
        const { duLieu } = await docBody(req);
        if (laBot(duLieu)) return json({ ok: true }, 201);
        const sdt = chuanHoaSdt(duLieu.sdt);
        if (sdt) gioiHan(`dn:sdt:${sdt}`, 3, 60);
        return json(await guiYeuCauDoanhNghiep(req.payload, duLieu), 201);
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  {
    // multipart/form-data: ô "duLieu" (JSON), ô "tep" lặp lại tối đa 3 ảnh
    path: "/tuyen-tho/ho-so", method: "post",
    handler: async (req) => {
      try {
        gioiHan(`th:ip:${ipCua(req)}`, 5, 30);
        const { duLieu, tep } = await docBody(req);
        if (laBot(duLieu)) return json({ ok: true }, 201);
        const sdt = chuanHoaSdt(duLieu.sdt);
        if (sdt) gioiHan(`th:sdt:${sdt}`, 2, 60 * 24);
        return json(await guiHoSoTho(req.payload, duLieu, tep), 201);
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
];

/** Gắn vào collection hoi-vien (/api/hoi-vien/...). */
export const endpointHoiVien: Endpoint[] = [
  {
    path: "/dang-ky", method: "post",
    handler: async (req) => {
      try {
        gioiHan(`hv:ip:${ipCua(req)}`, 5, 10);
        const { duLieu } = await docBody(req);
        if (laBot(duLieu)) return json({ ok: true }, 201);
        const sdt = chuanHoaSdt(duLieu.sdt);
        if (sdt) gioiHan(`hv:sdt:${sdt}`, 3, 30);
        return json(await dangKyHoiVien(req.payload, duLieu), 201);
      } catch (e) {
        return traLoi(req, e);
      }
    },
  },
  diem("/thanh-toan/:token", "get", (req) => (gioiHan(`hv-tt:ip:${ipCua(req)}`, 200, 10), xemThanhToanHoiVien(req.payload, token(req)))),
  diem("/thanh-toan/:token/gia-lap-tien-ve", "post", async (req) => {
    // Chỉ khi ngân hàng chạy giả lập (máy chạy thử): thay cho webhook thật
    if (nganHang.cheDo() !== "giaLap") throw new LoiNguoiDung("Chỉ dùng khi ngân hàng chạy giả lập.", 404, "KHONG_TIM_THAY");
    const tt = await xemThanhToanHoiVien(req.payload, token(req));
    if (!tt.conPhaiTra) throw new LoiNguoiDung("Gói không còn số tiền cần trả.", 409, "KHONG_CON_NO");
    const { nhanTien } = await import("../don/phuc-vu");
    return nhanTien(req.payload, { maGiaoDich: `GIALAP${Date.now()}`, soTien: tt.conPhaiTra, noiDung: `CK ${tt.ma!.replace("-", "")}`, luc: new Date().toISOString(), nguon: "gia-lap" });
  }),
];
