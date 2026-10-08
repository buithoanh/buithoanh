import type { CollectionConfig } from "payload";
import { chiQuanTri, daDangNhap, laQuanTri, truongChiQuanTri } from "../lib/quyen";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Người dùng", plural: "Người dùng" },
  admin: { useAsTitle: "email", defaultColumns: ["ten", "email", "vaiTro"], group: "Hệ thống" },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    // Cho agent bên ngoài (SEO Editor trong Claude Code) gọi API bằng khoá. Tạo một tài khoản quyền
    // "Biên tập" riêng cho agent rồi bật khoá API ở đó: agent chỉ tạo được bản nháp, không đăng được.
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
      options: [
        { label: "Quản trị", value: "quanTri" },
        { label: "Duyệt bài (được đăng bài, xác nhận giá)", value: "duyetBai" },
        { label: "Biên tập (viết, sửa nháp)", value: "bienTap" },
      ],
    },
  ],
};
