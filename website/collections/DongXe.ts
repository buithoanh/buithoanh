import type { CollectionConfig } from "payload";
import { chiNguoiSuaGia, chiQuanTri, congKhai, suaDuocGia } from "../lib/quyen";
import { taoSlug } from "../lib/kiem-tra.mjs";
import { dongBoDanhMucXe } from "../lib/xe";

// Dòng xe gán phân khúc A–D: phân khúc quyết định giá phụ tùng. Dòng mới đồng bộ từ VCparts chưa có phân khúc
// thì đánh dấu "cần gán" và không có giá phụ tùng riêng (báo giá sơ bộ lấy khoảng rộng nhất A–D).
export const DongXe: CollectionConfig = {
  slug: "dong-xe",
  labels: { singular: "Dòng xe", plural: "Dòng xe" },
  admin: {
    useAsTitle: "tenDayDu",
    defaultColumns: ["tenDayDu", "phanKhuc", "canGan", "doiTu", "doiDen", "xeDien", "nguon"],
    group: "Bảng giá & danh mục",
    listSearchableFields: ["ten", "tenDayDu"],
  },
  defaultSort: "tenDayDu",
  access: { read: congKhai, create: chiNguoiSuaGia, update: chiNguoiSuaGia, delete: chiQuanTri },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const d = { ...(originalDoc || {}), ...data };
        const hangId = typeof d.hang === "object" ? d.hang?.id : d.hang;
        const hang = hangId ? await req.payload.findByID({ collection: "hang-xe", id: hangId, depth: 0, req }).catch(() => null) : null;
        data.tenDayDu = `${hang?.ten || ""} ${d.ten || ""}`.trim();
        if (!d.slug) data.slug = taoSlug(data.tenDayDu);
        data.canGan = !d.phanKhuc;
        return data;
      },
    ],
  },
  endpoints: [
    {
      // Kéo danh mục hãng, dòng, đời xe từ VCparts. Dòng mới chưa có phân khúc: đánh dấu "cần gán".
      path: "/dong-bo-vcparts",
      method: "post",
      handler: async (req) => {
        if (!suaDuocGia(req)) return Response.json({ loi: "Bạn không có quyền đồng bộ danh mục xe." }, { status: 403 });
        try {
          return Response.json(await dongBoDanhMucXe(req.payload));
        } catch (e) {
          return Response.json({ loi: (e as Error).message }, { status: 502 });
        }
      },
    },
  ],
  fields: [
    { name: "hang", label: "Hãng", type: "relationship", relationTo: "hang-xe", required: true, index: true },
    { name: "ten", label: "Tên dòng", type: "text", required: true, admin: { placeholder: "Vios" } },
    { name: "tenDayDu", label: "Tên đầy đủ", type: "text", index: true, admin: { readOnly: true } },
    { name: "slug", label: "Đường dẫn", type: "text", unique: true, index: true, admin: { description: "Tự tạo, vd toyota-vios." } },
    { type: "row", fields: [
      {
        name: "phanKhuc", label: "Phân khúc", type: "select", options: ["A", "B", "C", "D"],
        admin: { description: "Để trống = chưa gán (dòng mới từ VCparts)." },
      },
      { name: "goiYPhanKhuc", label: "Gợi ý phân khúc (VCparts)", type: "select", options: ["A", "B", "C", "D"], admin: { readOnly: true } },
      { name: "canGan", label: "Cần gán phân khúc", type: "checkbox", index: true, admin: { readOnly: true } },
    ] },
    { type: "row", fields: [
      { name: "doiTu", label: "Đời từ", type: "number", min: 1980, max: 2100 },
      { name: "doiDen", label: "Đời đến", type: "number", min: 1980, max: 2100 },
      { name: "xeDien", label: "Xe điện", type: "checkbox" },
    ] },
    { name: "maVCparts", label: "Mã bên VCparts", type: "text", index: true, admin: { position: "sidebar" } },
    {
      name: "nguon", label: "Nguồn", type: "select", defaultValue: "tay", admin: { position: "sidebar", readOnly: true },
      options: [{ label: "Nhập tay", value: "tay" }, { label: "Đồng bộ VCparts", value: "vcparts" }],
    },
    { name: "dongBoLuc", label: "Đồng bộ lần cuối", type: "date", admin: { position: "sidebar", readOnly: true } },
  ],
};
