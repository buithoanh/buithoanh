import { APIError, type CollectionConfig } from "payload";
import { chiNguoiSuaGia, chiQuanTri, congKhai } from "../lib/quyen";

export const Phuong: CollectionConfig = {
  slug: "phuong",
  labels: { singular: "Phường", plural: "Phường" },
  admin: {
    useAsTitle: "ten",
    defaultColumns: ["ten", "quan", "dangPhucVu", "ghiChu"],
    group: "Vùng phục vụ & lịch",
    description: "Tắt phường khó vào (vd khu ngoài đê): khách ở đó được mời gọi tư vấn hoặc đặt kéo xe.",
  },
  defaultSort: "ten",
  access: { read: congKhai, create: chiNguoiSuaGia, update: chiNguoiSuaGia, delete: chiQuanTri },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const d = { ...(originalDoc || {}), ...data };
        const quan = typeof d.quan === "object" ? d.quan?.id : d.quan;
        const { totalDocs } = await req.payload.count({
          collection: "phuong", req,
          where: { and: [{ quan: { equals: quan } }, { ten: { equals: d.ten } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] },
        });
        if (totalDocs) throw new APIError(`Quận này đã có phường "${d.ten}".`, 400, undefined, true);
        return data;
      },
    ],
  },
  fields: [
    { name: "quan", label: "Quận", type: "relationship", relationTo: "quan", required: true, index: true },
    { name: "ten", label: "Tên phường", type: "text", required: true },
    { name: "dangPhucVu", label: "Đang phục vụ", type: "checkbox", defaultValue: true },
    { name: "ghiChu", label: "Ghi chú (hiện cho khách khi phường tắt)", type: "text" },
  ],
};
