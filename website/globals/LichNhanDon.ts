import { APIError, type GlobalConfig } from "payload";
import { chiNguoiSuaGia, congKhai } from "../lib/quyen";
import { THU } from "../lib/lich-dat.mjs";

const GIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const kiemGio = (v: unknown) => (typeof v === "string" && GIO.test(v)) || "Nhập giờ dạng HH:MM, vd 08:00";
const THU_TU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Giờ nhận đơn, khung giờ đặt lịch (mỗi khung giới hạn số đơn), ngày nghỉ. Khung đầy hiện gạch ngang trong form đặt lịch.
export const LichNhanDon: GlobalConfig = {
  slug: "lich-nhan-don",
  label: "Giờ nhận đơn, khung giờ, ngày nghỉ",
  admin: { group: "Vùng phục vụ & lịch" },
  access: { read: congKhai, update: chiNguoiSuaGia },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const ma = new Set<string>();
        for (const k of data.khungGio || []) {
          if (ma.has(k.ma)) throw new APIError(`Trùng mã khung giờ "${k.ma}".`, 400, undefined, true);
          ma.add(k.ma);
          if (k.batDau >= k.ketThuc) throw new APIError(`Khung ${k.ma}: giờ bắt đầu phải trước giờ kết thúc.`, 400, undefined, true);
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "gioNhanGap", label: "Giờ nhận đơn gọi gấp", type: "group",
      admin: { description: "Ngoài giờ này, trang gọi gấp mời khách gọi hotline." },
      fields: [{ type: "row", fields: [
        { name: "tu", label: "Từ", type: "text", required: true, defaultValue: "06:00", validate: kiemGio },
        { name: "den", label: "Đến", type: "text", required: true, defaultValue: "22:00", validate: kiemGio },
      ] }],
    },
    { type: "row", fields: [
      { name: "soNgayDatTruoc", label: "Số ngày hiện để chọn (tính cả hôm nay)", type: "number", defaultValue: 4, min: 1, max: 30 },
      { name: "phutChuanBi", label: "Khung bắt đầu trong vòng bao nhiêu phút thì không nhận đặt", type: "number", defaultValue: 60, min: 0 },
    ] },
    {
      name: "khungGio", label: "Khung giờ đặt lịch", type: "array", minRows: 1,
      labels: { singular: "Khung giờ", plural: "Khung giờ" },
      fields: [
        { type: "row", fields: [
          { name: "ma", label: "Mã", type: "text", required: true, admin: { placeholder: "08-10" } },
          { name: "batDau", label: "Bắt đầu", type: "text", required: true, validate: kiemGio },
          { name: "ketThuc", label: "Kết thúc", type: "text", required: true, validate: kiemGio },
          { name: "soDonToiDa", label: "Số đơn tối đa", type: "number", required: true, min: 0, defaultValue: 4 },
        ] },
        {
          name: "ngayTrongTuan", label: "Nhận đơn các ngày", type: "select", hasMany: true, required: true,
          defaultValue: THU_TU, options: THU_TU.map((t) => ({ label: t === "CN" ? "Chủ nhật" : `Thứ ${t.slice(1)}`, value: t })),
        },
      ],
    },
    {
      name: "ngayNghi", label: "Ngày nghỉ", type: "array",
      labels: { singular: "Ngày nghỉ", plural: "Ngày nghỉ" },
      fields: [{ type: "row", fields: [
        { name: "ngay", label: "Ngày", type: "date", required: true, admin: { date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } } },
        { name: "ten", label: "Lý do", type: "text", admin: { placeholder: "Quốc khánh" } },
      ] }],
    },
  ],
};
void THU;
