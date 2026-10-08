import { addDataAndFileToRequest, type CollectionConfig } from "payload";
import { hookKiemTraVaDuyet, truongDuyet, truongFaq, truongSeo, truongSlug, truongTuLieu, xemTruoc } from "../lib/bai";
import { chiNguoiDuyet, chiNguoiViet, daDangNhap, docBaiDaDang } from "../lib/quyen";
import { nhanBanNhapTuNgoai } from "../lib/ai/viet-nhap";
import { NHOM_TU_KHOA } from "./TuKhoa";

export const CHU_DE = [
  { label: "Mẹo xe", value: "meo" }, { label: "Bắt bệnh", value: "benh" }, { label: "Xe điện", value: "dien" }, { label: "Mùa vụ", value: "mua" },
];

export const CamNang: CollectionConfig = {
  slug: "cam-nang",
  labels: { singular: "Bài cẩm nang", plural: "Bài cẩm nang" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "keyword", "trangThaiDuyet", "_status", "ngay"],
    group: "Nội dung",
    preview: xemTruoc("cam-nang"),
  },
  defaultSort: "-ngay",
  versions: { drafts: true, maxPerDoc: 50 },
  access: { read: docBaiDaDang, create: chiNguoiViet, update: chiNguoiViet, delete: chiNguoiDuyet, readVersions: daDangNhap },
  hooks: { beforeChange: [hookKiemTraVaDuyet("cam-nang")] },
  endpoints: [
    {
      // Agent SEO Editor gửi bài Markdown vào đây; luôn lưu thành bản nháp, trả về kết quả kiểm tra.
      path: "/nhap-tu-markdown",
      method: "post",
      handler: async (req) => {
        if (!req.user) return Response.json({ loi: "Cần đăng nhập hoặc khoá API." }, { status: 401 });
        await addDataAndFileToRequest(req);
        try {
          const bai = await nhanBanNhapTuNgoai(req.payload, (req.data || {}) as Record<string, unknown>);
          return Response.json(
            { id: bai.id, slug: bai.slug, ketQuaKiemTra: bai.ketQuaKiemTra, sua: `/admin/collections/cam-nang/${bai.id}` },
            { status: 201 },
          );
        } catch (e) {
          return Response.json({ loi: (e as Error).message }, { status: 400 });
        }
      },
    },
  ],
  fields: [
    ...truongSeo,
    { type: "row", fields: [
      { name: "nhom", label: "Nhóm từ khoá", type: "select", required: true, options: NHOM_TU_KHOA },
      { name: "chuDe", label: "Chủ đề (trang Cẩm nang)", type: "select", options: CHU_DE, admin: { description: "Mẹo xe, Bắt bệnh, Xe điện, Mùa vụ" } },
    ] },
    { name: "noiDung", label: "Nội dung", type: "richText", required: true },
    truongFaq,
    {
      name: "nguonThamKhao",
      label: "Nguồn tham khảo",
      type: "array",
      admin: { description: "Không hiện trên web. Người duyệt dùng để đối chiếu số liệu." },
      fields: [
        { name: "ten", label: "Tên nguồn", type: "text", required: true },
        { name: "url", label: "Đường dẫn", type: "text" },
        {
          name: "loai",
          label: "Loại",
          type: "select",
          defaultValue: "web",
          options: [
            { label: "VCwiki", value: "vcwiki" },
            { label: "Web công khai", value: "web" },
            { label: "Tài liệu hãng", value: "hang" },
          ],
        },
      ],
    },
    truongSlug,
    truongTuLieu,
    {
      name: "ngay",
      label: "Ngày đăng",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } },
    },
    {
      name: "capNhat",
      label: "Cập nhật lần cuối",
      type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } },
    },
    {
      name: "dichVuLienQuan",
      label: "Dịch vụ liên quan",
      type: "relationship",
      relationTo: "dich-vu",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    {
      name: "nguoiDuyetKyThuat", label: "Người duyệt kỹ thuật", type: "relationship", relationTo: "users",
      admin: { position: "sidebar", description: "Thợ hoặc trưởng kỹ thuật kiểm tra nội dung kỹ thuật." },
    },
    { name: "thoiGianDocPhut", label: "Thời gian đọc (phút)", type: "number", admin: { position: "sidebar", readOnly: true } },
    ...truongDuyet,
    {
      name: "ghiChuAI",
      label: "Ghi chú của AI cho người duyệt",
      type: "textarea",
      admin: { position: "sidebar", readOnly: true, condition: (data) => Boolean(data?.ghiChuAI) },
    },
  ],
};
