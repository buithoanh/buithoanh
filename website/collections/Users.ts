import type { CollectionConfig } from "payload";
import { VAI_TRO, chiQuanTri, daDangNhap, laQuanTri, truongChiQuanTri } from "../lib/quyen";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Người dùng", plural: "Người dùng" },
  admin: { useAsTitle: "email", defaultColumns: ["ten", "email", "vaiTro"], group: "Hệ thống" },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    // Cho hệ thống bên ngoài gọi API bằng khoá: agent SEO Editor (tài khoản vai trò Biên tập: chỉ tạo bản nháp)
    // và phần mềm điều phối (tài khoản vai trò Điều phối: chỉ xem, cập nhật đơn).
    useAPIKey: true,
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: daDangNhap,
    create: chiQuanTri,
    delete: chiQuanTri,
    update: ({ req }) => (laQuanTri(req) ? true : req.user ? { id: { equals: req.user.id } } : false),
  },
  hooks: {
    beforeChange: [
      // Người đầu tiên tạo tài khoản (màn hình "tạo tài khoản đầu tiên") là quản trị.
      async ({ data, operation, req }) => {
        if (operation === "create") {
          const { totalDocs } = await req.payload.count({ collection: "users", req });
          if (totalDocs === 0) data.vaiTro = "quanTri";
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "ten", label: "Họ tên", type: "text" },
    {
      name: "vaiTro",
      label: "Vai trò",
      type: "select",
      required: true,
      defaultValue: "bienTap",
      saveToJWT: true,
      access: { create: truongChiQuanTri, update: truongChiQuanTri },
      options: [...VAI_TRO],
    },
  ],
};
