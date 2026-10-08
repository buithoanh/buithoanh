import type { Access, FieldAccess, PayloadRequest } from "payload";

// Vai trò (theo thiết kế màn quản trị):
//  - quanTri:       mọi việc, thêm người dùng
//  - quanLyDichVu:  sửa giá, danh mục, vùng, giờ, ngày nghỉ; duyệt và đăng bài; xem, xử lý đơn
//  - bienTap:       Biên tập nội dung (VCmedia): viết, sửa, tải ảnh, gửi duyệt. KHÔNG sửa giá, không đăng
//  - marketing:     mã khuyến mãi, số liệu (P1); viết bài như biên tập
//  - dieuPhoi:      điều phối viên, hoặc tài khoản máy của phần mềm điều phối (bật khoá API): xem đơn, đổi trạng thái
export const VAI_TRO = [
  { label: "Quản trị", value: "quanTri" },
  { label: "Quản lý dịch vụ (sửa giá, vùng, giờ; duyệt và đăng bài)", value: "quanLyDichVu" },
  { label: "Biên tập nội dung – VCmedia (viết, gửi duyệt; không sửa giá)", value: "bienTap" },
  { label: "Marketing (mã khuyến mãi, số liệu)", value: "marketing" },
  { label: "Điều phối (đơn hàng, trạng thái đơn)", value: "dieuPhoi" },
] as const;
export type VaiTro = (typeof VAI_TRO)[number]["value"];

export const vaiTroCua = (req: Pick<PayloadRequest, "user">): VaiTro | undefined =>
  (req.user as { vaiTro?: VaiTro } | null)?.vaiTro;

export const la = (req: Pick<PayloadRequest, "user">, ...vaiTro: VaiTro[]) => vaiTro.includes(vaiTroCua(req) as VaiTro);

export const laQuanTri = (req: Pick<PayloadRequest, "user">) => la(req, "quanTri");
/** Người duyệt bài = quản trị + quản lý dịch vụ. */
export const laNguoiDuyet = (req: Pick<PayloadRequest, "user">) => la(req, "quanTri", "quanLyDichVu");
/** Được sửa giá, danh mục, vùng phục vụ, giờ nhận đơn. */
export const suaDuocGia = laNguoiDuyet;
/** Người làm nội dung: viết, sửa nháp. */
export const laNguoiViet = (req: Pick<PayloadRequest, "user">) => la(req, "quanTri", "quanLyDichVu", "bienTap", "marketing");
/** Xem và xử lý đơn hàng (có dữ liệu cá nhân của khách). */
export const xuLyDuocDon = (req: Pick<PayloadRequest, "user">) => la(req, "quanTri", "quanLyDichVu", "dieuPhoi");

/** Được đăng bài: người duyệt, hoặc script nạp dữ liệu ban đầu (đặt context.choPhepDang). */
export const coTheDang = (req: PayloadRequest) => laNguoiDuyet(req) || req.context?.choPhepDang === true;

export const congKhai: Access = () => true;
export const daDangNhap: Access = ({ req }) => Boolean(req.user);
export const chiQuanTri: Access = ({ req }) => laQuanTri(req);
export const chiNguoiDuyet: Access = ({ req }) => laNguoiDuyet(req);
export const chiNguoiSuaGia: Access = ({ req }) => suaDuocGia(req);
export const chiNguoiViet: Access = ({ req }) => laNguoiViet(req);
export const chiNguoiXuLyDon: Access = ({ req }) => xuLyDuocDon(req);
export const truongChiNguoiDuyet: FieldAccess = ({ req }) => laNguoiDuyet(req);
export const truongChiQuanTri: FieldAccess = ({ req }) => laQuanTri(req);
export const truongChiNguoiXuLyDon: FieldAccess = ({ req }) => xuLyDuocDon(req);

/** Khách xem web chỉ thấy bài đã đăng; người trong công ty thấy cả nháp. */
export const docBaiDaDang: Access = ({ req }) => (req.user ? true : { _status: { equals: "published" } });
