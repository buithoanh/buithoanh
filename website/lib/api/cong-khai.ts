// Endpoint công khai (đọc) cho từng màn hình. Logic nằm ở lib/cong-khai.ts, ở đây chỉ đọc tham số và giới hạn tần suất.
import type { Endpoint, PayloadRequest } from "payload";
import {
  kiemTraVung, layBangGia, layCauHinhChung, layDanhGia, layDanhMucXe, layKhungGio, layTrangChu, layTrangDatLich,
  layTrangDichVu, layTrangGoiGap, layTrangHangXe, layTrangKhuVuc, layTrangXeDien, LoiNguoiDung, tinhBaoGiaSoBo,
} from "../cong-khai";
import { tinhTrangTichHop } from "../tich-hop/chung";
import { laNguoiDuyet } from "../quyen";
import { docBody, gioiHan, ipCua, json, traLoi } from "./chung";

type XuLy = (req: PayloadRequest) => Promise<unknown>;
const doc = (path: string, xuLy: XuLy, opts: { method?: "get" | "post"; khongCache?: boolean } = {}): Endpoint => ({
  path,
  method: opts.method || "get",
  handler: async (req) => {
    try {
      gioiHan(`doc:ip:${ipCua(req)}`, 600, 5);
      const data = await xuLy(req);
      if (data == null) throw new LoiNguoiDung("Không tìm thấy trang.", 404, "KHONG_TIM_THAY");
      return opts.khongCache || opts.method === "post"
        ? json(data)
        : Response.json(data, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
    } catch (e) {
      return traLoi(req, e);
    }
  },
});
const thamSo = (req: PayloadRequest, k: string) => req.searchParams.get(k) || undefined;
const pk = (v?: string) => (v && ["A", "B", "C", "D"].includes(v) ? (v as "A") : null);

export const endpointCongKhai: Endpoint[] = [
  doc("/trang/chung", (req) => layCauHinhChung(req.payload)),
  doc("/trang/chu", (req) => layTrangChu(req.payload)),
  doc("/trang/bang-gia", (req) => layBangGia(req.payload, pk(thamSo(req, "phanKhuc")))),
  doc("/trang/dich-vu/:slug", (req) => layTrangDichVu(req.payload, String(req.routeParams?.slug))),
  doc("/trang/khu-vuc/:dichVu/:quan", (req) => layTrangKhuVuc(req.payload, String(req.routeParams?.dichVu), String(req.routeParams?.quan))),
  doc("/trang/hang-xe/:hang", (req) => layTrangHangXe(req.payload, String(req.routeParams?.hang))),
  doc("/trang/xe-dien", (req) => layTrangXeDien(req.payload)),
  doc("/trang/dat-lich", (req) => layTrangDatLich(req.payload), { khongCache: true }),
  doc("/trang/goi-gap", (req) => layTrangGoiGap(req.payload), { khongCache: true }),
  doc("/trang/danh-gia", (req) => layDanhGia(req.payload, { quan: thamSo(req, "quan"), dichVu: thamSo(req, "dichVu"), gioiHan: Number(thamSo(req, "gioiHan")) || 6 })),
  doc("/xe", (req) => layDanhMucXe(req.payload, { xeDien: thamSo(req, "xeDien") === "1", hang: thamSo(req, "hang") })),
  doc("/lich-dat/khung-gio", (req) => layKhungGio(req.payload, { tuNgay: thamSo(req, "tuNgay"), soNgay: Number(thamSo(req, "soNgay")) || undefined }), { khongCache: true }),
  doc("/bao-gia-so-bo", async (req) => {
    const { duLieu } = await docBody(req);
    const dv = Array.isArray(duLieu.dichVu) ? duLieu.dichVu.map(String) : [];
    if (dv.length > 10) throw new LoiNguoiDung("Chọn tối đa 10 dịch vụ.", 400, "QUA_NHIEU_DICH_VU");
    return tinhBaoGiaSoBo(req.payload, {
      dichVu: dv, dongXe: (duLieu.dongXe as string) || null, phanKhuc: (duLieu.phanKhuc as string) || null,
    });
  }, { method: "post" }),
  doc("/vung-phuc-vu/kiem-tra", async (req) => {
    gioiHan(`vung:ip:${ipCua(req)}`, 30, 5); // mỗi lần gọi bản đồ tốn tiền
    const { duLieu } = await docBody(req);
    const lat = duLieu.lat == null || duLieu.lat === "" ? null : Number(duLieu.lat);
    const lng = duLieu.lng == null || duLieu.lng === "" ? null : Number(duLieu.lng);
    if ((lat != null || lng != null) && !(Number.isFinite(lat) && Number.isFinite(lng))) throw new LoiNguoiDung("Toạ độ không hợp lệ.", 400, "TOA_DO_SAI");
    const diaChi = typeof duLieu.diaChi === "string" ? duLieu.diaChi.trim().slice(0, 300) : "";
    return kiemTraVung(req.payload, { diaChi, lat, lng });
  }, { method: "post" }),
  doc("/tich-hop/trang-thai", async (req) => {
    if (!laNguoiDuyet(req)) throw new LoiNguoiDung("Chỉ quản trị, quản lý dịch vụ xem được.", 403, "KHONG_CO_QUYEN");
    return { tichHop: tinhTrangTichHop() };
  }, { khongCache: true }),
];
