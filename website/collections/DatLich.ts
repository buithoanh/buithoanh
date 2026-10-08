import { addDataAndFileToRequest, type CollectionConfig } from "payload";
import { chiQuanTri, daDangNhap } from "../lib/quyen";

// Chống spam đơn giản: mỗi địa chỉ IP tối đa 5 lịch hẹn trong 10 phút (tính trong bộ nhớ của server).
const LAN_GUI = new Map<string, number[]>();
function quaNhieu(ip: string) {
  const now = Date.now();
  const gan = (LAN_GUI.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  gan.push(now);
  LAN_GUI.set(ip, gan);
  if (LAN_GUI.size > 5000) LAN_GUI.clear();
  return gan.length > 5;
}

const chuoi = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const DatLich: CollectionConfig = {
  slug: "dat-lich",
  labels: { singular: "Lịch hẹn", plural: "Lịch hẹn" },
  admin: {
    useAsTitle: "sdt",
    defaultColumns: ["createdAt", "dichVu", "xe", "viTri", "sdt", "trangThai"],
    group: "Khách hàng",
  },
  defaultSort: "-createdAt",
  // Khách không gọi thẳng API tạo; form trên web gửi vào /api/dat-lich/gui (có kiểm tra và chống spam).
  access: { read: daDangNhap, create: daDangNhap, update: daDangNhap, delete: chiQuanTri },
  endpoints: [
    {
      path: "/gui",
      method: "post",
      handler: async (req) => {
        await addDataAndFileToRequest(req);
        const d = (req.data || {}) as Record<string, unknown>;
        if (chuoi(d.website, 200)) return Response.json({ ok: true }); // ô bẫy bot, người thật không thấy
        const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
        if (quaNhieu(ip)) return Response.json({ loi: "Gửi quá nhiều lần, vui lòng gọi hotline." }, { status: 429 });

        const data = {
          dichVu: chuoi(d.dichVu, 120),
          xe: chuoi(d.xe, 120),
          bienSo: chuoi(d.bienSo, 20),
          viTri: chuoi(d.viTri, 300),
          gio: chuoi(d.gio, 40),
          sdt: chuoi(d.sdt, 20),
          ghiChu: chuoi(d.ghiChu, 2000),
          nguon: "website",
        };
        if (!data.dichVu || !data.xe || !data.viTri || !/^[0-9 +.]{9,15}$/.test(data.sdt)) {
          return Response.json({ loi: "Thiếu dịch vụ, xe, vị trí hoặc số điện thoại không hợp lệ." }, { status: 400 });
        }
        await req.payload.create({ collection: "dat-lich", data, overrideAccess: true });
        return Response.json({ ok: true }, { status: 201 });
      },
    },
  ],
  fields: [
    {
      name: "trangThai",
      label: "Trạng thái",
      type: "select",
      defaultValue: "moi",
      admin: { position: "sidebar" },
      options: [
        { label: "Mới, chưa gọi", value: "moi" },
        { label: "Đã gọi, chờ khách", value: "daGoi" },
        { label: "Đã hẹn thợ", value: "daHen" },
        { label: "Hoàn thành", value: "xong" },
        { label: "Huỷ", value: "huy" },
      ],
    },
    { name: "ghiChuNoiBo", label: "Ghi chú nội bộ", type: "textarea", admin: { position: "sidebar" } },
    { name: "dichVu", label: "Dịch vụ", type: "text", required: true },
    { type: "row", fields: [
      { name: "xe", label: "Xe", type: "text", required: true },
      { name: "bienSo", label: "Biển số", type: "text" },
    ] },
    { name: "viTri", label: "Vị trí xe", type: "text", required: true },
    { type: "row", fields: [
      { name: "gio", label: "Giờ hẹn mong muốn", type: "text" },
      { name: "sdt", label: "Số điện thoại", type: "text", required: true },
    ] },
    { name: "ghiChu", label: "Tình trạng xe (khách ghi)", type: "textarea" },
    { name: "nguon", label: "Nguồn", type: "text", defaultValue: "website", admin: { readOnly: true } },
  ],
};
