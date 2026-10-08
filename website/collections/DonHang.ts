import { APIError, type CollectionConfig } from "payload";
import { chiNguoiXuLyDon, chiQuanTri, la, laQuanTri, truongChiNguoiXuLyDon, xuLyDuocDon } from "../lib/quyen";
import { MOI_TRANG_THAI, chuyenDuoc, nhanTrangThai } from "../lib/don/trang-thai.mjs";
import { CHO_DO, laBot } from "../lib/don/dau-vao.mjs";
import { chuanHoaBienSo } from "../lib/bien-so.mjs";
import { chuanHoaSdt } from "../lib/so-dien-thoai.mjs";
import { maTiepTheo } from "../lib/ma-so";
import { taoDon, taoToken } from "../lib/don/tao-don";
import { donTheoToken } from "../lib/don/theo-doi";
import { docBody, gioiHan, ipCua, json, traLoi } from "../lib/api/chung";
import { LoiNguoiDung } from "../lib/cong-khai";
import { dieuPhoi } from "../lib/tich-hop/dieu-phoi";

const HAN_LINK_MS = 24 * 60 * 60 * 1000;
const nguoiLam = (u: unknown) => {
  const x = u as { ten?: string; email?: string } | null;
  return x ? x.ten || x.email || "?" : "Khách (web)";
};

// Đơn hàng: đặt lịch và gọi gấp. Khách tạo đơn qua /api/don-hang/dat-lich và /api/don-hang/goi-gap;
// điều phối viên nhập đơn qua điện thoại, đổi trạng thái ngay trong admin hoặc qua API có khoá.
export const DonHang: CollectionConfig = {
  slug: "don-hang",
  labels: { singular: "Đơn hàng", plural: "Đơn hàng" },
  admin: {
    useAsTitle: "ma",
    defaultColumns: ["ma", "loai", "trangThai", "dichVu", "khungGio.nhan", "viTri.quan", "createdAt"],
    group: "Đơn hàng",
    listSearchableFields: ["ma", "khach.sdt", "xe.bienSo"],
    description: "Đơn khẩn cấp luôn ở đầu danh sách. Đổi trạng thái theo thứ tự; huỷ được khi đơn chưa xong.",
  },
  // Khẩn cấp lên đầu hàng chờ, rồi đơn mới nhất
  defaultSort: ["-uuTien", "-createdAt"],
  access: { read: chiNguoiXuLyDon, create: chiNguoiXuLyDon, update: chiNguoiXuLyDon, delete: chiQuanTri },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req, context }) => {
        if (context.boQuaHook) return data;
        const bayGio = new Date().toISOString();
        if (operation === "create") {
          if (!data.ma) data.ma = await maTiepTheo(req.payload, "TT");
          if (!data.tokenTheoDoi) data.tokenTheoDoi = taoToken();
          data.trangThai = data.trangThai || "daNhan";
          data.lichSuTrangThai = [{ trangThai: data.trangThai, luc: bayGio, boi: context.taoTuWeb ? "Khách (web)" : nguoiLam(req.user) }];
          // Nhập tay trong admin: người nhập xác nhận khách đã đồng ý qua điện thoại.
          if (!data.dongY?.dongYXuLyDuLieu) {
            throw new APIError("Chỉ lưu đơn khi khách đã đồng ý xử lý dữ liệu cá nhân (tích ô Đồng ý).", 400, undefined, true);
          }
          data.dongY.dongYLuc = data.dongY.dongYLuc || bayGio;
        }
        data.uuTien = (data.loai ?? originalDoc?.loai) === "khanCap" ? 1 : 0;
        if (data.khach?.sdt) {
          const s = chuanHoaSdt(data.khach.sdt);
          if (!s) throw new APIError("Số điện thoại khách chưa đúng.", 400, undefined, true);
          data.khach.sdt = s;
        }
        if (data.xe?.bienSo) {
          const b = chuanHoaBienSo(data.xe.bienSo);
          if (!b) throw new APIError("Biển số chưa đúng, ví dụ 30A-123.45.", 400, undefined, true);
          data.xe.bienSo = b;
        }
        if (operation === "update" && data.trangThai && originalDoc && data.trangThai !== originalDoc.trangThai) {
          const kq = chuyenDuoc(originalDoc.trangThai, data.trangThai, { choPhepLui: laQuanTri(req) });
          if (!kq.ok) throw new APIError(kq.loi!, 409, undefined, true);
          data.lichSuTrangThai = [
            ...(originalDoc.lichSuTrangThai || []),
            { trangThai: data.trangThai, luc: bayGio, boi: nguoiLam(req.user), ghiChu: (context.ghiChuTrangThai as string) || undefined },
          ];
          if (data.trangThai === "hoanThanh" || data.trangThai === "huy") {
            data.ketThucLuc = bayGio;
            data.hetHanLinkLuc = new Date(Date.now() + HAN_LINK_MS).toISOString();
          }
          req.context.doiTrangThai = { tu: originalDoc.trangThai, den: data.trangThai };
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        const doi = req.context.doiTrangThai as { tu: string; den: string } | undefined;
        if (!doi) return;
        delete req.context.doiTrangThai;
        // Phần mềm điều phối tự đổi thì không báo ngược lại; script nạp mẫu cũng không báo
        if (la(req, "dieuPhoi") || req.context.khongBaoDieuPhoi) return;
        dieuPhoi.baoDoiTrangThai(doc.ma, doi.den, req.context.ghiChuTrangThai as string | undefined)
          .catch((e) => req.payload.logger.error({ err: e, msg: `Không báo được điều phối đơn ${doc.ma} đổi trạng thái` }));
      },
    ],
  },
  endpoints: [
    {
      path: "/dat-lich",
      method: "post",
      handler: async (req) => {
        try {
          const { duLieu, tep } = await docBody(req);
          if (laBot(duLieu)) return json({ ok: true }, 201);
          gioiHan(`don:ip:${ipCua(req)}`, 5, 10);
          const sdt = (duLieu.khach as { sdt?: string } | undefined)?.sdt;
          if (sdt) gioiHan(`don:sdt:${sdt.replace(/\D/g, "")}`, 3, 30);
          return json(await taoDon(req.payload, "datLich", duLieu, tep), 201);
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      path: "/goi-gap",
      method: "post",
      handler: async (req) => {
        try {
          const { duLieu, tep } = await docBody(req);
          if (laBot(duLieu)) return json({ ok: true }, 201);
          gioiHan(`don:ip:${ipCua(req)}`, 5, 10);
          const sdt = (duLieu.khach as { sdt?: string } | undefined)?.sdt;
          if (sdt) gioiHan(`don:sdt:${sdt.replace(/\D/g, "")}`, 3, 30);
          return json(await taoDon(req.payload, "khanCap", duLieu, tep), 201);
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      // Link riêng của khách: theo dõi đơn. Không cần đăng nhập, chỉ cần token khó đoán.
      path: "/theo-doi/:token",
      method: "get",
      handler: async (req) => {
        try {
          gioiHan(`theo-doi:ip:${ipCua(req)}`, 120, 10);
          return json(await donTheoToken(req.payload, String(req.routeParams?.token || "")));
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      // Điều phối (người hoặc phần mềm có khoá API) đổi trạng thái đơn. :ma là mã TT-000123 hoặc id.
      path: "/:ma/trang-thai",
      method: "post",
      handler: async (req) => {
        try {
          if (!req.user) throw new LoiNguoiDung("Cần đăng nhập hoặc khoá API.", 401, "CHUA_DANG_NHAP");
          if (!xuLyDuocDon(req)) throw new LoiNguoiDung("Tài khoản này không được đổi trạng thái đơn.", 403, "KHONG_CO_QUYEN");
          const { duLieu } = await docBody(req);
          const ma = String(req.routeParams?.ma || "");
          const don = (await req.payload.find({
            collection: "don-hang", limit: 1, depth: 0, overrideAccess: true,
            where: /^\d+$/.test(ma) ? { id: { equals: Number(ma) } } : { ma: { equals: ma.toUpperCase() } },
          })).docs[0];
          if (!don) throw new LoiNguoiDung(`Không có đơn ${ma}.`, 404, "KHONG_CO_DON");
          const trangThai = String(duLieu.trangThai || "");
          if (!MOI_TRANG_THAI.some((t) => t.value === trangThai)) {
            throw new LoiNguoiDung(`Trạng thái phải là một trong: ${MOI_TRANG_THAI.map((t) => t.value).join(", ")}.`, 400, "TRANG_THAI_SAI");
          }
          const capNhat = await req.payload.update({
            collection: "don-hang", id: don.id, req, overrideAccess: false,
            context: { ghiChuTrangThai: typeof duLieu.ghiChu === "string" ? duLieu.ghiChu.slice(0, 500) : undefined },
            data: { trangThai: trangThai as "daNhan" },
          });
          return json({ ma: capNhat.ma, trangThai: capNhat.trangThai, nhan: nhanTrangThai(capNhat.trangThai), lichSu: capNhat.lichSuTrangThai });
        } catch (e) {
          if (e instanceof APIError) return json({ loi: e.message, ma: "KHONG_DOI_DUOC" }, e.status);
          return traLoi(req, e);
        }
      },
    },
  ],
  fields: [
    { type: "row", fields: [
      { name: "ma", label: "Mã đơn", type: "text", unique: true, index: true, admin: { readOnly: true } },
      {
        name: "loai", label: "Loại", type: "select", required: true, defaultValue: "datLich",
        options: [{ label: "Đặt lịch", value: "datLich" }, { label: "Khẩn cấp", value: "khanCap" }],
      },
    ] },
    { name: "uuTien", type: "number", defaultValue: 0, index: true, admin: { hidden: true } },
    {
      name: "trangThai", label: "Trạng thái", type: "select", required: true, defaultValue: "daNhan", index: true,
      options: MOI_TRANG_THAI, admin: { position: "sidebar" },
    },
    {
      name: "lichSuTrangThai", label: "Lịch sử trạng thái", type: "array", admin: { position: "sidebar", readOnly: true },
      fields: [
        { name: "trangThai", label: "Trạng thái", type: "select", options: MOI_TRANG_THAI },
        { name: "luc", label: "Lúc", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
        { name: "boi", label: "Bởi", type: "text" },
        { name: "ghiChu", label: "Ghi chú", type: "text" },
      ],
    },
    { name: "ghiChuNoiBo", label: "Ghi chú nội bộ", type: "textarea", admin: { position: "sidebar" } },
    {
      type: "tabs",
      tabs: [
        {
          label: "Yêu cầu",
          fields: [
            { name: "dichVu", label: "Dịch vụ", type: "relationship", relationTo: "danh-muc-dich-vu", hasMany: true },
            { name: "suCo", label: "Sự cố (gọi gấp)", type: "text" },
            { name: "trieuChung", label: "Triệu chứng khách tả", type: "textarea" },
            { name: "tep", label: "Ảnh, video khách gửi", type: "relationship", relationTo: "tep-don-hang", hasMany: true, maxRows: 4 },
            {
              name: "khungGio", label: "Khung giờ hẹn", type: "group",
              fields: [{ type: "row", fields: [
                { name: "ngay", label: "Ngày (YYYY-MM-DD)", type: "text", index: true },
                { name: "ma", label: "Mã khung", type: "text" },
                { name: "nhan", label: "Hiển thị", type: "text" },
                { name: "batDauLuc", label: "Bắt đầu", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
              ] }],
            },
            {
              name: "giaSoBo", label: "Giá sơ bộ lúc đặt", type: "group", admin: { description: "Giá khách thấy khi đặt, lưu lại để đối chiếu." },
              fields: [
                { type: "row", fields: [
                  { name: "trangThai", label: "Kiểu", type: "select", options: [{ label: "Có giá", value: "coGia" }, { label: "Cố vấn gọi lại", value: "coVanGoiLai" }, { label: "Chưa chọn", value: "chuaChon" }] },
                  { name: "tu", label: "Từ (đ)", type: "number" },
                  { name: "den", label: "Đến (đ)", type: "number" },
                  { name: "phanKhuc", label: "Phân khúc", type: "text" },
                ] },
                { name: "dong", label: "Chi tiết", type: "json" },
              ],
            },
          ],
        },
        {
          label: "Xe",
          fields: [{
            name: "xe", label: false, type: "group",
            fields: [
              { type: "row", fields: [
                { name: "hang", label: "Hãng", type: "relationship", relationTo: "hang-xe" },
                { name: "dong", label: "Dòng", type: "relationship", relationTo: "dong-xe" },
                { name: "tenXe", label: "Tên xe (gõ tay nếu không có trong danh mục)", type: "text" },
              ] },
              { type: "row", fields: [
                { name: "doi", label: "Đời xe", type: "number" },
                { name: "bienSo", label: "Biển số", type: "text", index: true, admin: { description: "Gõ liền cũng được, tự thêm dấu." } },
                { name: "soKm", label: "Số km", type: "number" },
                { name: "phanKhuc", label: "Phân khúc", type: "select", options: ["A", "B", "C", "D"] },
              ] },
            ],
          }],
        },
        {
          label: "Vị trí",
          fields: [{
            name: "viTri", label: false, type: "group",
            fields: [
              { name: "diaChi", label: "Địa chỉ", type: "text" },
              { type: "row", fields: [
                { name: "lat", label: "Vĩ độ", type: "number" },
                { name: "lng", label: "Kinh độ", type: "number" },
                { name: "quan", label: "Quận", type: "relationship", relationTo: "quan" },
                { name: "phuong", label: "Phường", type: "text" },
              ] },
              { type: "row", fields: [
                { name: "trongVung", label: "Trong vùng phục vụ", type: "checkbox" },
                { name: "etaTu", label: "Thợ tới sau (phút, từ)", type: "number" },
                { name: "etaDen", label: "đến", type: "number" },
              ] },
              { name: "choDo", label: "Chỗ đỗ", type: "select", options: CHO_DO },
              { name: "ghiChuChoTho", label: "Ghi chú cho thợ", type: "textarea" },
            ],
          }],
        },
        {
          label: "Khách",
          fields: [
            {
              name: "khach", label: false, type: "group",
              fields: [{ type: "row", fields: [
                { name: "hoTen", label: "Họ tên", type: "text" },
                { name: "sdt", label: "Số điện thoại", type: "text", required: true, index: true },
              ] }],
            },
            {
              name: "hoaDon", label: "Xuất hoá đơn công ty", type: "group",
              fields: [
                { name: "can", label: "Cần hoá đơn công ty", type: "checkbox" },
                { type: "row", fields: [
                  { name: "mst", label: "Mã số thuế", type: "text" },
                  { name: "tenCongTy", label: "Tên công ty", type: "text" },
                ] },
                { type: "row", fields: [
                  { name: "diaChi", label: "Địa chỉ công ty", type: "text" },
                  { name: "email", label: "Email nhận hoá đơn", type: "text" },
                ] },
              ],
            },
            { type: "row", fields: [
              { name: "maGioiThieu", label: "Mã giới thiệu", type: "text", index: true },
              { name: "maKhuyenMai", label: "Mã khuyến mãi / đối tác", type: "text", index: true, admin: { description: "Kiểm tra và tính giảm giá: P1." } },
            ] },
            {
              name: "dongY", label: "Đồng ý dữ liệu (Nghị định 13/2023)", type: "group",
              fields: [{ type: "row", fields: [
                { name: "dongYXuLyDuLieu", label: "Khách đồng ý xử lý dữ liệu cá nhân", type: "checkbox", required: true },
                { name: "dongYLuc", label: "Đồng ý lúc", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
                { name: "nhacBaoDuongZalo", label: "Nhắc bảo dưỡng qua Zalo", type: "checkbox" },
              ] }],
            },
          ],
        },
        {
          label: "Nguồn, tích hợp",
          fields: [
            {
              name: "nguon", label: "Nguồn khách", type: "group",
              fields: [
                { type: "row", fields: [
                  { name: "kenh", label: "Kênh", type: "text", index: true },
                  { name: "utmSource", label: "utm_source", type: "text" },
                  { name: "utmMedium", label: "utm_medium", type: "text" },
                  { name: "utmCampaign", label: "utm_campaign", type: "text" },
                ] },
                { type: "row", fields: [
                  { name: "maQR", label: "Mã QR đối tác", type: "text" },
                  { name: "trangVao", label: "Trang vào", type: "text" },
                  { name: "referrer", label: "Đến từ", type: "text" },
                ] },
              ],
            },
            {
              name: "tichHop", label: "Tích hợp", type: "group", admin: { readOnly: true },
              fields: [
                { type: "row", fields: [
                  { name: "dieuPhoiId", label: "Mã bên điều phối", type: "text" },
                  { name: "guiDieuPhoiLuc", label: "Gửi điều phối lúc", type: "date" },
                  { name: "loiDieuPhoi", label: "Lỗi gửi điều phối", type: "text" },
                ] },
                { type: "row", fields: [
                  { name: "xacNhanKenh", label: "Đã nhắn xác nhận qua", type: "text" },
                  { name: "xacNhanLuc", label: "Nhắn lúc", type: "date" },
                  { name: "loiThongBao", label: "Lỗi nhắn tin", type: "text" },
                ] },
              ],
            },
            {
              name: "tokenTheoDoi", label: "Mã link riêng của khách", type: "text", unique: true, index: true,
              access: { read: truongChiNguoiXuLyDon, update: () => false },
              admin: { readOnly: true, description: "Link theo dõi: /don/<mã này>/. Hết hạn 24 giờ sau khi đơn xong." },
            },
            { type: "row", fields: [
              { name: "ketThucLuc", label: "Kết thúc lúc", type: "date", admin: { readOnly: true } },
              { name: "hetHanLinkLuc", label: "Link hết hạn lúc", type: "date", admin: { readOnly: true } },
            ] },
          ],
        },
      ],
    },
  ],
};
