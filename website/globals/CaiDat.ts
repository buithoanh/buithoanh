import type { GlobalConfig } from "payload";
import { chiNguoiDuyet, congKhai } from "../lib/quyen";

// Cấu hình chung hiện trên web: liên hệ, pháp nhân, đánh giá Google, các sự cố trên màn gọi gấp. Sửa là web đổi ngay.
export const CaiDat: GlobalConfig = {
  slug: "cai-dat",
  label: "Cấu hình chung",
  admin: { group: "Hệ thống" },
  access: { read: congKhai, update: chiNguoiDuyet },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Liên hệ",
          fields: [
            { type: "row", fields: [
              { name: "hotline", label: "Hotline", type: "text", admin: { description: "Để trống thì nút gọi hiện \"Hotline sắp có\"." } },
              { name: "email", label: "Email", type: "email" },
            ] },
            { type: "row", fields: [
              { name: "zalo", label: "Link Zalo OA", type: "text", admin: { placeholder: "https://zalo.me/..." } },
              { name: "zaloOaId", label: "Mã Zalo OA", type: "text" },
            ] },
            { name: "xuongDoiTac", label: "Xưởng nhận ca phức tạp", type: "text", defaultValue: "xưởng Auto Speedy" },
            { name: "chinhSachDuLieu", label: "Đường dẫn chính sách dữ liệu cá nhân", type: "text", defaultValue: "/chinh-sach-du-lieu/" },
          ],
        },
        {
          label: "Pháp nhân",
          fields: [
            { name: "phapNhan", label: "Tên pháp nhân", type: "text", admin: { placeholder: "Công ty TNHH ..." } },
            { type: "row", fields: [
              { name: "mst", label: "Mã số thuế", type: "text" },
              { name: "daThongBaoBoCongThuong", label: "Đã thông báo Bộ Công Thương", type: "checkbox" },
            ] },
            { name: "diaChi", label: "Địa chỉ", type: "text" },
          ],
        },
        {
          label: "Đánh giá Google",
          fields: [
            { name: "googleDanhGiaUrl", label: "Link viết đánh giá Google", type: "text" },
            { type: "row", fields: [
              { name: "diemGoogle", label: "Điểm Google", type: "number", min: 0, max: 5 },
              { name: "soDanhGiaGoogle", label: "Số đánh giá Google", type: "number", min: 0 },
            ] },
          ],
        },
        {
          label: "Ngân hàng (VietQR)",
          description: "Tài khoản nhận tiền khách chuyển khoản. Mã BIN: Vietcombank 970436, Techcombank 970407, MB 970422, VietinBank 970415, BIDV 970418, ACB 970416.",
          fields: [
            { type: "row", fields: [
              { name: "nganHangBin", label: "Mã BIN ngân hàng (6 số)", type: "text", validate: (v: unknown) => !v || /^\d{6}$/.test(String(v)) || "Mã BIN gồm 6 số" },
              { name: "nganHangTen", label: "Tên ngân hàng hiển thị", type: "text", admin: { placeholder: "Vietcombank – CN Hà Nội" } },
            ] },
            { type: "row", fields: [
              { name: "soTaiKhoan", label: "Số tài khoản", type: "text" },
              { name: "chuTaiKhoan", label: "Chủ tài khoản (in hoa, không dấu)", type: "text" },
            ] },
          ],
        },
        {
          label: "CSKH, số liệu",
          fields: [
            { type: "row", fields: [
              { name: "sdtCskh", label: "Số điện thoại CSKH (nhận báo khiếu nại)", type: "text" },
              { name: "tenCskh", label: "Tên người phụ trách CSKH (hiện cho khách)", type: "text" },
              { name: "cskhGoiLaiGio", label: "CSKH gọi lại trong (giờ)", type: "number", defaultValue: 2 },
            ] },
            { name: "mucTieuTyLeDatLich", label: "Mục tiêu tỷ lệ đặt lịch, gọi, Zalo trên lượt vào (%)", type: "number", defaultValue: 4, min: 0, max: 100 },
          ],
        },
        {
          label: "Gọi gấp",
          fields: [{
            name: "suCoKhanCap", label: "Sự cố trên màn gọi gấp", type: "array",
            labels: { singular: "Sự cố", plural: "Sự cố" },
            fields: [
              { type: "row", fields: [
                { name: "ma", label: "Mã", type: "text", required: true, admin: { placeholder: "aq" } },
                { name: "ten", label: "Tên", type: "text", required: true, admin: { placeholder: "Hết ắc quy" } },
                { name: "moTa", label: "Mô tả", type: "text", admin: { placeholder: "Đề không quay, đèn mờ" } },
              ] },
              { name: "dichVu", label: "Dịch vụ gắn vào đơn", type: "relationship", relationTo: "danh-muc-dich-vu" },
            ],
          }],
        },
      ],
    },
  ],
};
