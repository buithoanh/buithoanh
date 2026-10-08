import type { CollectionConfig } from "payload";
import { chiNguoiSuaGia, chiQuanTri, congKhai } from "../lib/quyen";
import { taoSlug } from "../lib/kiem-tra.mjs";

export const HangXe: CollectionConfig = {
  slug: "hang-xe",
  labels: { singular: "Hãng xe", plural: "Hãng xe" },
  admin: { useAsTitle: "ten", defaultColumns: ["thuTu", "ten", "slug", "nguon"], group: "Bảng giá & danh mục" },
  defaultSort: "thuTu",
  access: { read: congKhai, create: chiNguoiSuaGia, update: chiNguoiSuaGia, delete: chiQuanTri },
  fields: [
    { name: "ten", label: "Tên hãng", type: "text", required: true, unique: true },
    {
      name: "slug", label: "Đường dẫn", type: "text", required: true, unique: true, index: true,
      hooks: { beforeValidate: [({ value, data }) => taoSlug(value || data?.ten)] },
    },
    { name: "thuTu", label: "Thứ tự", type: "number", defaultValue: 99 },
    { name: "maVCparts", label: "Mã bên VCparts", type: "text", index: true, admin: { position: "sidebar" } },
    {
      name: "nguon", label: "Nguồn", type: "select", defaultValue: "tay", admin: { position: "sidebar", readOnly: true },
      options: [{ label: "Nhập tay", value: "tay" }, { label: "Đồng bộ VCparts", value: "vcparts" }],
    },
  ],
};
