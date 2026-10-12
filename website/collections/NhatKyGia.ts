import type { CollectionConfig } from "payload";
import { chiNguoiSuaGia, suaDuocGia } from "../lib/quyen";
import { sangCsv, sangXlsx, traFile, type Bang } from "../lib/xuat-file";

// Mỗi lần lưu giá (hạng mục hoặc phí chung) ghi một dòng: ai sửa, lúc nào, giá cũ, giá mới, lý do. Không sửa, không xoá.
export const NhatKyGia: CollectionConfig = {
  slug: "nhat-ky-gia",
  labels: { singular: "Dòng nhật ký giá", plural: "Nhật ký đổi giá" },
  admin: {
    useAsTitle: "moTa",
    defaultColumns: ["createdAt", "tenNguoi", "moTa", "giaCu", "giaMoi", "lyDo"],
    group: "Bảng giá & danh mục",
  },
  defaultSort: "-createdAt",
  access: { read: chiNguoiSuaGia, create: () => false, update: () => false, delete: () => false },
  endpoints: [
    {
      // Màn QtBangGia, nút "Tải file Excel": GET /api/nhat-ky-gia/xuat?dinhDang=xlsx|csv (toàn bộ nhật ký, mới nhất trước)
      path: "/xuat",
      method: "get",
      handler: async (req) => {
        if (!suaDuocGia(req)) return Response.json({ loi: "Bạn không có quyền xem nhật ký giá.", ma: "KHONG_CO_QUYEN" }, { status: req.user ? 403 : 401 });
        const { docs } = await req.payload.find({ collection: "nhat-ky-gia", sort: "-createdAt", limit: 10000, depth: 0, pagination: false, overrideAccess: true });
        const gio = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
        const bang: Bang = {
          ten: "Nhật ký giá",
          cot: [
            { khoa: "luc", tieuDe: "Lúc", rong: 20 }, { khoa: "tenNguoi", tieuDe: "Người sửa", rong: 24 }, { khoa: "vaiTro", tieuDe: "Vai trò", rong: 18 },
            { khoa: "moTa", tieuDe: "Hạng mục", rong: 40 }, { khoa: "giaCu", tieuDe: "Giá cũ", rong: 30 }, { khoa: "giaMoi", tieuDe: "Giá mới", rong: 30 },
            { khoa: "lyDo", tieuDe: "Lý do", rong: 40 },
          ],
          dong: docs.map((d) => ({ ...d, luc: gio(d.createdAt) })),
        };
        const ngay = new Date().toISOString().slice(0, 10);
        if (req.searchParams.get("dinhDang") === "csv") return traFile(sangCsv(bang), `nhat-ky-gia-${ngay}.csv`, "csv");
        return traFile(await sangXlsx([bang]), `nhat-ky-gia-${ngay}.xlsx`, "xlsx");
      },
    },
  ],
  fields: [
    { name: "moTa", label: "Hạng mục", type: "text", required: true },
    { name: "hangMuc", label: "Hạng mục giá", type: "relationship", relationTo: "hang-muc-gia" },
    { name: "dichVu", label: "Dịch vụ", type: "relationship", relationTo: "danh-muc-dich-vu" },
    { type: "row", fields: [
      { name: "giaCu", label: "Giá cũ", type: "text" },
      { name: "giaMoi", label: "Giá mới", type: "text" },
    ] },
    { name: "lyDo", label: "Lý do", type: "text" },
    { type: "row", fields: [
      { name: "nguoi", label: "Người sửa", type: "relationship", relationTo: "users" },
      { name: "tenNguoi", label: "Tên người sửa", type: "text" },
      { name: "vaiTro", label: "Vai trò", type: "text" },
    ] },
  ],
};
