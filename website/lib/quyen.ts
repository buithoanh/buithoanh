import type { Access, FieldAccess, PayloadRequest } from "payload";

// Ba vai trò:
//  - quanTri: quản trị, thêm người dùng, sửa cài đặt
//  - duyetBai: duyệt và đăng bài, xác nhận giá
//  - bienTap: viết và sửa bản nháp, không được đăng
export type VaiTro = "quanTri" | "duyetBai" | "bienTap";

export const vaiTroCua = (req: PayloadRequest): VaiTro | undefined =>
  (req.user as { vaiTro?: VaiTro } | null)?.vaiTro;

export const laQuanTri = (req: PayloadRequest) => vaiTroCua(req) === "quanTri";
export const laNguoiDuyet = (req: PayloadRequest) => ["quanTri", "duyetBai"].includes(vaiTroCua(req) ?? "");

/** Được đăng bài: người duyệt, hoặc script nạp dữ liệu ban đầu (đặt context.choPhepDang). */
export const coTheDang = (req: PayloadRequest) => laNguoiDuyet(req) || req.context?.choPhepDang === true;

export const daDangNhap: Access = ({ req }) => Boolean(req.user);
export const chiQuanTri: Access = ({ req }) => laQuanTri(req);
export const chiNguoiDuyet: Access = ({ req }) => laNguoiDuyet(req);
export const truongChiNguoiDuyet: FieldAccess = ({ req }) => laNguoiDuyet(req);
export const truongChiQuanTri: FieldAccess = ({ req }) => laQuanTri(req);

/** Khách xem web chỉ thấy bài đã đăng; người trong công ty thấy cả nháp. */
export const docBaiDaDang: Access = ({ req }) => (req.user ? true : { _status: { equals: "published" } });
