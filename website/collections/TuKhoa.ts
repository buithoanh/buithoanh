import type { CollectionConfig } from "payload";
import { batDauAIVietNhap } from "../lib/ai/viet-nhap";
import { chiNguoiDuyet, chiNguoiViet, daDangNhap } from "../lib/quyen";

export const NHOM_TU_KHOA = [
  "Khẩn cấp", "Ắc quy", "Lốp", "Tận nơi", "Bảo dưỡng", "Chẩn đoán", "Xe điện", "Bản đồ", "Thông tin",
].map((n) => ({ label: n, value: n }));

export const TuKhoa: CollectionConfig = {
  slug: "tu-khoa",
  labels: { singular: "Từ khoá", plural: "Từ khoá SEO" },
  admin: {
    useAsTitle: "tuKhoa",
    defaultColumns: ["tuKhoa", "nhom", "luotTimThang", "trangThai"],
    group: "SEO",
    description: "Mỗi từ khoá chỉ một bài. Mở một từ khoá chưa có bài rồi bấm \"AI viết bản nháp\".",
  },
  access: { read: daDangNhap, create: chiNguoiViet, update: chiNguoiViet, delete: chiNguoiDuyet },
  endpoints: [
    {
      path: "/:id/ai-viet-nhap",
      method: "post",
      handler: async (req) => {
        if (!req.user) return Response.json({ loi: "Cần đăng nhập." }, { status: 401 });
        const id = String(req.routeParams?.id || "");
        const kq = await batDauAIVietNhap(req.payload, id);
        return Response.json(kq.ok ? { ok: true } : { loi: kq.loi }, { status: kq.ok ? 202 : kq.status });
      },
    },
  ],
  fields: [
    { name: "tuKhoa", label: "Từ khoá", type: "text", required: true, unique: true },
    {
      type: "row",
      fields: [
        { name: "nhom", label: "Nhóm", type: "select", required: true, options: NHOM_TU_KHOA },
        { name: "yDinh", label: "Ý định tìm kiếm", type: "text", admin: { placeholder: "Gọi ngay / Đặt lịch / Đọc" } },
        { name: "luotTimThang", label: "Lượt tìm/tháng (ước tính)", type: "text" },
      ],
    },
    { name: "dichVu", label: "Trang dịch vụ đích", type: "relationship", relationTo: "dich-vu" },
    {
      name: "trangThai",
      label: "Trạng thái",
      type: "select",
      defaultValue: "chuaViet",
      admin: { position: "sidebar" },
      options: [
        { label: "Chưa viết", value: "chuaViet" },
        { label: "Đang viết", value: "dangViet" },
        { label: "Đã có bài", value: "daCoBai" },
        { label: "Không viết bài (làm bằng cách khác)", value: "boQua" },
      ],
    },
    { name: "baiViet", label: "Bài viết nhắm từ khoá này", type: "relationship", relationTo: "cam-nang", admin: { position: "sidebar" } },
    { name: "ghiChu", label: "Ghi chú", type: "textarea" },
    {
      name: "ai",
      label: "AI viết bản nháp",
      type: "group",
      admin: { position: "sidebar" },
      fields: [
        {
          name: "nut",
          type: "ui",
          admin: { components: { Field: "/components/admin/NutAIVietNhap#NutAIVietNhap" } },
        },
        {
          name: "trangThai",
          label: "Tình trạng",
          type: "select",
          defaultValue: "chuaChay",
          admin: { readOnly: true },
          options: [
            { label: "Chưa chạy", value: "chuaChay" },
            { label: "Đang viết…", value: "dangChay" },
            { label: "Xong", value: "xong" },
            { label: "Lỗi", value: "loi" },
          ],
        },
        { name: "thongBao", label: "Kết quả", type: "textarea", admin: { readOnly: true } },
        { name: "batDauLuc", type: "date", admin: { hidden: true } },
      ],
    },
  ],
};
