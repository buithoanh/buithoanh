import type { Field, GlobalConfig } from "payload";
import { chiNguoiSuaGia, congKhai } from "../lib/quyen";
import { ghiNhatKyGia } from "../lib/nhat-ky-gia";
import { dinhDangTien } from "../lib/tinh-gia.mjs";

const soNguyen = (name: string, label: string, description?: string): Field => ({
  name, label, type: "number", required: true, min: 0, admin: description ? { description } : undefined,
  validate: (v: unknown) => (Number.isInteger(v) && (v as number) >= 0) || "Nhập số nguyên, không âm",
});

const PHI = [
  ["phiDiLai", "Phí đi lại nội thành", "đ"],
  ["phiKiemTra", "Phí kiểm tra khi khách không sửa", "đ"],
  ["baoHanhPhuTungThang", "Bảo hành phụ tùng", "tháng"],
  ["baoHanhCongThang", "Bảo hành tiền công", "tháng"],
  ["camKetCuuHoPhut", "Cam kết thời gian cứu hộ trong vùng", "phút"],
  ["coVanGoiLaiPhut", "Cố vấn gọi lại (việc phức tạp)", "phút"],
] as const;
const hien = (k: string, v: unknown) => {
  const dv = PHI.find((p) => p[0] === k)?.[2];
  return dv === "đ" ? dinhDangTien(Number(v)) : `${v} ${dv}`;
};

// Phí và cam kết dùng chung cho mọi trang: phí đi lại, phí kiểm tra, bảo hành, thời gian cứu hộ, mô tả phân khúc xe.
export const BangGiaChung: GlobalConfig = {
  slug: "bang-gia-chung",
  label: "Phí chung, bảo hành, phân khúc",
  admin: { group: "Bảng giá & danh mục" },
  access: { read: congKhai, update: chiNguoiSuaGia },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        req.context.lyDoPhi = data.lyDoDoi || "";
        data.lyDoDoi = null; // chỉ dùng cho lần lưu này, đã chép vào nhật ký
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        for (const [k, ten] of PHI) {
          if (previousDoc && previousDoc[k] !== doc[k]) {
            await ghiNhatKyGia(req, { ten: `Phí chung › ${ten}`, giaCu: previousDoc[k] == null ? null : hien(k, previousDoc[k]), giaMoi: hien(k, doc[k]), lyDo: String(req.context.lyDoPhi || "") });
          }
        }
        if (previousDoc && Boolean(previousDoc.camKetKhongSuaDuocMienPhi) !== Boolean(doc.camKetKhongSuaDuocMienPhi)) {
          const bt = (v: unknown) => (v ? "Bật" : "Tắt");
          await ghiNhatKyGia(req, { ten: "Phí chung › Cam kết không sửa được không lấy tiền", giaCu: bt(previousDoc.camKetKhongSuaDuocMienPhi), giaMoi: bt(doc.camKetKhongSuaDuocMienPhi), lyDo: String(req.context.lyDoPhi || "") });
        }
      },
    ],
  },
  fields: [
    { type: "row", fields: [soNguyen("phiDiLai", "Phí đi lại nội thành (đ)", "Mỗi lần thợ tới, trong vùng phục vụ."), soNguyen("phiKiemTra", "Phí kiểm tra khi khách không sửa (đ)", "Thu khi khách từ chối báo giá chính thức.")] },
    { type: "row", fields: [soNguyen("baoHanhPhuTungThang", "Bảo hành phụ tùng (tháng)"), soNguyen("baoHanhCongThang", "Bảo hành tiền công (tháng)")] },
    {
      name: "camKetKhongSuaDuocMienPhi", label: "Cam kết “Không sửa được, không lấy tiền”", type: "checkbox", defaultValue: true,
      admin: { description: "Bật (mặc định, đã duyệt 12/10/2026): thợ không xử lý được thì không thu gì cả (không tiền công, không phí kiểm tra, không phí đi lại). Web hiện cam kết này ở trang chủ, trang dịch vụ, gọi gấp và chính sách bảo hành; điều phối và thu tiền phải làm đúng như vậy. Tắt thì cam kết biến mất khỏi web." },
    },
    { type: "row", fields: [soNguyen("camKetCuuHoPhut", "Cam kết cứu hộ trong vùng (phút)"), soNguyen("coVanGoiLaiPhut", "Cố vấn gọi lại việc phức tạp (phút)")] },
    { type: "row", fields: [
      { name: "chuKyBaoDuongKm", label: "Chu kỳ bảo dưỡng (km)", type: "number", defaultValue: 5000, min: 1000 },
      { name: "chuKyBaoDuongThang", label: "Chu kỳ bảo dưỡng (tháng)", type: "number", defaultValue: 6, min: 1 },
    ] },
    {
      name: "phanKhuc", label: "Phân khúc xe", type: "array", minRows: 4, maxRows: 4,
      admin: { description: "Đúng 4 dòng A, B, C, D. Hiện ở bảng giá để khách biết xe mình thuộc phân khúc nào." },
      fields: [{ type: "row", fields: [
        { name: "ma", label: "Mã", type: "select", required: true, options: ["A", "B", "C", "D"] },
        { name: "tenNgan", label: "Tên ngắn", type: "text", required: true, admin: { placeholder: "Sedan B" } },
        { name: "moTa", label: "Mô tả", type: "text", required: true, admin: { placeholder: "Sedan, hatchback hạng B (Vios, Accent…)" } },
      ] }],
    },
    { name: "lyDoDoi", label: "Lý do đổi phí (ghi vào nhật ký)", type: "text" },
  ],
};
