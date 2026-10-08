import { APIError, commitTransaction, initTransaction, killTransaction, type CollectionConfig, type Field } from "payload";
import { chiNguoiSuaGia, congKhai, suaDuocGia } from "../lib/quyen";
import { ghiNhatKyGia, moTaGia } from "../lib/nhat-ky-gia";

const soTien = (name: string, label: string): Field => ({
  name, label, type: "number", min: 0,
  validate: (v: unknown) => v == null || (Number.isInteger(v) && (v as number) >= 0) || "Nhập số nguyên đồng, không âm",
});
const khoang = (pk: string): Field => ({
  name: pk, label: `Phân khúc ${pk}`, type: "group",
  fields: [{ type: "row", fields: [soTien("tu", "Từ (đ)"), soTien("den", "Đến (đ)")] }],
});

// Hạng mục giá của một dịch vụ. Tiền công: một giá cố định (0 = miễn phí). Phụ tùng: khoảng giá theo phân khúc xe A–D.
// Mỗi lần đổi giá tự ghi vào Nhật ký đổi giá.
export const HangMucGia: CollectionConfig = {
  slug: "hang-muc-gia",
  labels: { singular: "Hạng mục giá", plural: "Hạng mục giá" },
  admin: {
    useAsTitle: "ten",
    defaultColumns: ["dichVu", "ten", "loai", "gia", "baoGiaSoBo", "capNhatGiaLuc"],
    group: "Bảng giá & danh mục",
    listSearchableFields: ["ten"],
  },
  defaultSort: "thuTu",
  access: { read: congKhai, create: chiNguoiSuaGia, update: chiNguoiSuaGia, delete: chiNguoiSuaGia },
  endpoints: [
    {
      // Màn QtBangGia: lưu nhiều giá một lần ("Lưu 3 thay đổi giá"), mỗi thay đổi ghi một dòng nhật ký.
      path: "/luu-nhieu",
      method: "post",
      handler: async (req) => {
        if (!suaDuocGia(req)) return Response.json({ loi: "Bạn không có quyền sửa giá." }, { status: 403 });
        const body = (req.json ? await req.json().catch(() => null) : null) as
          | { thayDoi?: { id: number; gia?: number; giaPhanKhuc?: Record<string, { tu: number; den: number }> }[]; lyDo?: string }
          | null;
        const thayDoi = Array.isArray(body?.thayDoi) ? body!.thayDoi : [];
        if (!thayDoi.length || thayDoi.length > 200) return Response.json({ loi: "Không có thay đổi nào để lưu." }, { status: 400 });
        const ketQua: unknown[] = [];
        // Lưu cả lô hoặc không lưu gì
        await initTransaction(req);
        try {
          for (const t of thayDoi) {
            const data: Record<string, unknown> = { lyDoDoi: body?.lyDo || "Sửa trực tiếp trên bảng giá" };
            if (t.gia !== undefined) data.gia = t.gia;
            if (t.giaPhanKhuc) data.giaPhanKhuc = t.giaPhanKhuc;
            ketQua.push(await req.payload.update({ collection: "hang-muc-gia", id: t.id, data, req, overrideAccess: false, depth: 0 }));
          }
          await commitTransaction(req);
        } catch (e) {
          await killTransaction(req);
          return Response.json({ loi: `Chưa lưu thay đổi nào: ${(e as Error).message}` }, { status: 400 });
        }
        return Response.json({ daLuu: ketQua.length, hangMuc: ketQua });
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req, operation }) => {
        const d = { ...(originalDoc || {}), ...data };
        if (d.loai === "phuTung") {
          for (const pk of ["A", "B", "C", "D"]) {
            const g = d.giaPhanKhuc?.[pk];
            if (g?.tu == null || g?.den == null) throw new APIError(`Phụ tùng cần đủ giá từ–đến cho phân khúc ${pk}.`, 400, undefined, true);
            if (g.tu > g.den) throw new APIError(`Phân khúc ${pk}: giá "từ" lớn hơn giá "đến".`, 400, undefined, true);
          }
        } else if (d.gia == null) {
          throw new APIError("Tiền công cần có giá (0 = miễn phí).", 400, undefined, true);
        }
        const cu = operation === "update" ? moTaGia(originalDoc) : null;
        const moi = moTaGia(d);
        if (cu !== moi) {
          data.capNhatGiaLuc = new Date().toISOString();
          data.capNhatGiaBoi = (req.user as { ten?: string; email?: string } | null)?.ten || req.user?.email || "Hệ thống";
          req.context.doiGia = { cu, moi, lyDo: data.lyDoDoi || d.lyDoDoi || "" };
        }
        data.lyDoDoi = null; // lý do chỉ dùng cho lần lưu này, đã chép vào nhật ký
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        const doi = req.context.doiGia as { cu: string | null; moi: string; lyDo: string } | undefined;
        if (!doi) return;
        delete req.context.doiGia;
        await ghiNhatKyGia(req, { hangMuc: doc.id, dichVu: doc.dichVu, ten: doc.ten, giaCu: doi.cu, giaMoi: doi.moi, lyDo: doi.lyDo });
      },
    ],
  },
  fields: [
    { name: "dichVu", label: "Dịch vụ", type: "relationship", relationTo: "danh-muc-dich-vu", required: true, index: true },
    { name: "ten", label: "Tên hạng mục", type: "text", required: true },
    {
      name: "loai", label: "Loại", type: "radio", required: true, defaultValue: "cong",
      options: [{ label: "Tiền công (giá cố định)", value: "cong" }, { label: "Phụ tùng (khoảng giá theo phân khúc)", value: "phuTung" }],
    },
    {
      type: "row",
      admin: { condition: (d) => d?.loai !== "phuTung" },
      fields: [
        { ...soTien("gia", "Giá (đ)"), admin: { description: "0 = Miễn phí" } } as Field,
        { name: "donVi", label: "Đơn vị (nếu tính theo)", type: "text", admin: { placeholder: "km" } },
      ],
    },
    {
      name: "giaPhanKhuc", label: "Giá theo phân khúc xe", type: "group",
      admin: { condition: (d) => d?.loai === "phuTung" },
      fields: ["A", "B", "C", "D"].map(khoang),
    },
    { name: "ghiChu", label: "Ghi chú hiển thị", type: "text" },
    {
      name: "baoGiaSoBo", label: "Tính vào báo giá sơ bộ", type: "select", defaultValue: "khong",
      options: [
        { label: "Không tính", value: "khong" },
        { label: "Luôn có (cộng vào cả giá thấp và giá cao)", value: "luonCo" },
        { label: "Có thể phát sinh (chỉ cộng vào giá cao)", value: "coThe" },
      ],
    },
    {
      name: "nguonGia", label: "Nguồn giá", type: "select", defaultValue: "tay",
      options: [{ label: "Nhập tay", value: "tay" }, { label: "Giá tham khảo VCparts", value: "vcparts" }],
    },
    { name: "thuTu", label: "Thứ tự", type: "number", defaultValue: 99, admin: { position: "sidebar" } },
    {
      name: "noiBat", label: "Hiện ở bảng giá nhanh (trang chủ)", type: "checkbox", defaultValue: false,
      admin: { position: "sidebar" },
    },
    { name: "tenNgan", label: "Tên ngắn trên bảng giá nhanh", type: "text", admin: { position: "sidebar", condition: (d) => Boolean(d?.noiBat) } },
    {
      name: "lyDoDoi", label: "Lý do đổi giá (ghi vào nhật ký)", type: "text",
      admin: { position: "sidebar", description: "Điền khi sửa giá. Sau khi lưu, ô này tự xoá." },
    },
    { name: "capNhatGiaLuc", label: "Đổi giá lần cuối", type: "date", admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "capNhatGiaBoi", label: "Người đổi giá lần cuối", type: "text", admin: { position: "sidebar", readOnly: true } },
  ],
};
