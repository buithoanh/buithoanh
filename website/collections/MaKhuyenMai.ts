import QRCode from "qrcode";
import { APIError, type CollectionConfig } from "payload";
import { chiQuanTri, la } from "../lib/quyen";
import { LOAI_MA } from "../lib/khuyen-mai.mjs";
import { baoCaoHoaHong, bangHoaHong, chuanMa, kiemTraMaChoKhach, linkDatLichCoMa, moTaMa, thongKeMa } from "../lib/ma-khuyen-mai";
import { sangCsv, sangXlsx, traFile } from "../lib/xuat-file";
import { docBody, gioiHan, ipCua, json, traLoi } from "../lib/api/chung";
import { LoiNguoiDung } from "../lib/cong-khai";
import { chuanHoaSdt } from "../lib/so-dien-thoai.mjs";

const xemMa = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu", "marketing");
const suaMa = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "marketing");

// Mã khuyến mãi và mã đối tác (KOC, cây xăng, BQL chung cư). Giảm % chỉ trên tiền công (có mức tối đa) hoặc giảm tiền.
// Hết hạn, hết lượt thì tự dừng (tính lúc đọc). Mỗi mã có link đặt lịch điền sẵn mã và ảnh QR (PNG) để in.
export const MaKhuyenMai: CollectionConfig = {
  slug: "ma-khuyen-mai",
  labels: { singular: "Mã khuyến mãi", plural: "Mã khuyến mãi, mã đối tác" },
  admin: { useAsTitle: "ma", defaultColumns: ["ma", "loai", "doiTac", "giaTri", "hetHan", "tamDung"], group: "Marketing" },
  access: { read: xemMa, create: suaMa, update: suaMa, delete: chiQuanTri },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const d = { ...(originalDoc || {}), ...data };
        if (data.ma) data.ma = chuanMa(data.ma);
        if (!/^[A-Z0-9-]{3,40}$/.test(String(d.ma ? chuanMa(d.ma) : ""))) throw new APIError("Mã chỉ gồm chữ in hoa không dấu, số, gạch ngang (3–40 ký tự).", 400, undefined, true);
        if (d.kieuGiam === "phanTram" && !(d.giaTri > 0 && d.giaTri <= 100)) throw new APIError("Giảm theo % phải từ 1 đến 100.", 400, undefined, true);
        if (d.batDau && d.hetHan && new Date(d.batDau) > new Date(d.hetHan)) throw new APIError("Ngày bắt đầu sau ngày hết hạn.", 400, undefined, true);
        return data;
      },
    ],
  },
  endpoints: [
    {
      // Công khai: khách nhập mã ở form đặt lịch
      path: "/kiem-tra",
      method: "post",
      handler: async (req) => {
        try {
          gioiHan(`ma-km:ip:${ipCua(req)}`, 20, 10);
          const { duLieu } = await docBody(req);
          return json(await kiemTraMaChoKhach(req.payload, String(duLieu.ma || ""), chuanHoaSdt(duLieu.sdt)));
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      path: "/thong-ke",
      method: "get",
      handler: async (req) => {
        try {
          if (!xemMa({ req })) throw new LoiNguoiDung("Không có quyền.", 403, "KHONG_CO_QUYEN");
          return json(await thongKeMa(req.payload));
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      // Báo cáo hoa hồng tháng: ?thang=2027-09&dinhDang=json|csv|xlsx
      path: "/hoa-hong",
      method: "get",
      handler: async (req) => {
        try {
          if (!la(req, "quanTri", "marketing")) throw new LoiNguoiDung("Chỉ quản trị, marketing xem được hoa hồng.", 403, "KHONG_CO_QUYEN");
          const bc = await baoCaoHoaHong(req.payload, req.searchParams.get("thang") || undefined);
          const dd = req.searchParams.get("dinhDang");
          if (dd === "csv") return traFile(sangCsv(bangHoaHong(bc)), `hoa-hong-${bc.thang}.csv`, "csv");
          if (dd === "xlsx") return traFile(await sangXlsx([bangHoaHong(bc)]), `hoa-hong-${bc.thang}.xlsx`, "xlsx");
          return json(bc);
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      // Danh sách cho màn QtMaKhuyenMai, kèm trạng thái, lượt dùng, link, QR
      path: "/danh-sach",
      method: "get",
      handler: async (req) => {
        try {
          if (!xemMa({ req })) throw new LoiNguoiDung("Không có quyền.", 403, "KHONG_CO_QUYEN");
          const loai = req.searchParams.get("loai");
          const { docs } = await req.payload.find({ collection: "ma-khuyen-mai", where: loai ? { loai: { equals: loai } } : {}, limit: 1000, depth: 0, sort: "-createdAt", overrideAccess: true });
          return json({ ma: await Promise.all(docs.map(async (d) => ({ ...d, ...(await moTaMa(req.payload, d)) }))), loai: LOAI_MA });
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      path: "/:id/qr.png",
      method: "get",
      handler: async (req) => {
        try {
          if (!xemMa({ req })) throw new LoiNguoiDung("Không có quyền.", 403, "KHONG_CO_QUYEN");
          const doc = await req.payload.findByID({ collection: "ma-khuyen-mai", id: Number(req.routeParams?.id), overrideAccess: true }).catch(() => null);
          if (!doc) throw new LoiNguoiDung("Không có mã này.", 404, "KHONG_TIM_THAY");
          const png = await QRCode.toBuffer(linkDatLichCoMa(doc.ma), { type: "png", width: 1024, margin: 2, errorCorrectionLevel: "M" });
          return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Content-Disposition": `inline; filename="qr-${doc.ma}.png"` } });
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
  ],
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã", type: "text", required: true, unique: true, index: true, admin: { description: "Vd XANG-TDH12, KOC-LINHXEHOP, BQL-GOLDSEASON, KM-THANG10" } },
      { name: "loai", label: "Loại", type: "select", required: true, defaultValue: "km", options: Object.entries(LOAI_MA).map(([value, l]) => ({ value, label: l.nhan })) },
      { name: "doiTac", label: "Đối tác / chương trình", type: "text" },
    ] },
    { type: "row", fields: [
      { name: "kieuGiam", label: "Kiểu giảm", type: "radio", required: true, defaultValue: "phanTram", options: [{ label: "Theo % tiền công", value: "phanTram" }, { label: "Số tiền", value: "soTien" }] },
      { name: "giaTri", label: "Giá trị (% hoặc đồng)", type: "number", required: true, min: 0 },
      { name: "giamToiDa", label: "Giảm tối đa (đ, với %)", type: "number", min: 0, admin: { condition: (d) => d?.kieuGiam === "phanTram" } },
    ] },
    { type: "row", fields: [
      { name: "batDau", label: "Bắt đầu", type: "date", admin: { date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } } },
      { name: "hetHan", label: "Hết hạn (hết ngày)", type: "date", admin: { date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } } },
      { name: "soLuotToiDa", label: "Số lượt tối đa (trống = không giới hạn)", type: "number", min: 0 },
    ] },
    { type: "row", fields: [
      { name: "moiSdtMotLan", label: "Mỗi số điện thoại dùng 1 lần", type: "checkbox", defaultValue: true },
      { name: "hoaHongPhanTram", label: "Hoa hồng đối tác (% doanh thu đơn đã thanh toán)", type: "number", min: 0, max: 100, defaultValue: 0 },
    ] },
    { name: "tamDung", label: "Tạm dừng", type: "checkbox", defaultValue: false, admin: { position: "sidebar" } },
    { name: "ghiChu", label: "Ghi chú nội bộ", type: "textarea", admin: { position: "sidebar" } },
  ],
};
