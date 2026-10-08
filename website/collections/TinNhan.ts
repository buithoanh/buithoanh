import type { CollectionConfig } from "payload";
import { chiNguoiXuLyDon } from "../lib/quyen";

// Nhật ký tin Zalo/SMS đã gửi cho khách theo từng bước của đơn (để CSKH tra lại, để đối soát chi phí ZNS).
export const TinNhan: CollectionConfig = {
  slug: "tin-nhan",
  labels: { singular: "Tin đã gửi", plural: "Tin Zalo/SMS đã gửi" },
  admin: { useAsTitle: "loai", defaultColumns: ["createdAt", "loai", "donHang", "kenh", "trangThai", "loi"], group: "Đơn hàng" },
  defaultSort: "-createdAt",
  access: { read: chiNguoiXuLyDon, create: () => false, update: () => false, delete: () => false },
  fields: [
    { type: "row", fields: [
      { name: "loai", label: "Loại tin", type: "text", required: true, index: true },
      { name: "donHang", label: "Đơn hàng", type: "relationship", relationTo: "don-hang", index: true },
      { name: "sdtChe", label: "Gửi tới", type: "text" },
    ] },
    { type: "row", fields: [
      { name: "kenh", label: "Kênh", type: "select", options: [{ label: "Zalo", value: "zalo" }, { label: "SMS", value: "sms" }] },
      { name: "trangThai", label: "Kết quả", type: "select", options: [{ label: "Đã gửi", value: "daGui" }, { label: "Lỗi", value: "loi" }] },
    ] },
    { name: "loi", label: "Lỗi", type: "text" },
    { name: "noiDung", label: "Nội dung (bản SMS)", type: "textarea" },
  ],
};
