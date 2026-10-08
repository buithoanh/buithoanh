// Đăng nhập và quyền cho màn quản trị /quan-tri/* (bản React). Dùng phiên Payload (cookie payload-token).
// Đây chỉ để ẩn/khoá giao diện; phân quyền thật vẫn nằm ở backend (lib/quyen.ts, access của collection).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { layPayload } from "@/lib/cms";

export const TEN_VAI_TRO = {
  quanTri: "Quản trị",
  quanLyDichVu: "Quản lý dịch vụ",
  bienTap: "Biên tập nội dung · VCmedia",
  marketing: "Marketing",
  dieuPhoi: "Điều phối",
};

/** Việc → vai trò được làm. Khớp bảng quyền cuối docs/api.md và access của từng endpoint. */
export const QUYEN = {
  baiViet: ["quanTri", "quanLyDichVu", "bienTap", "marketing"],
  duyetBai: ["quanTri", "quanLyDichVu"],
  xemBangGia: ["quanTri", "quanLyDichVu", "marketing"],
  suaGia: ["quanTri", "quanLyDichVu"],
  maKhuyenMai: ["quanTri", "quanLyDichVu", "marketing"],
  suaMa: ["quanTri", "marketing"],
  hoaHong: ["quanTri", "marketing"],
  soLieu: ["quanTri", "quanLyDichVu", "marketing"],
  donHang: ["quanTri", "quanLyDichVu", "dieuPhoi"],
};

/** Mô tả ngắn quyền của từng vai trò (hộp "Quyền của bạn" bên trái). */
export const MO_TA_QUYEN = {
  quanTri: "mọi việc: sửa giá, vùng, giờ; duyệt và đăng bài; mã khuyến mãi, số liệu; thêm người dùng.",
  quanLyDichVu: "sửa giá, danh mục dịch vụ, vùng phục vụ, giờ nhận đơn, ngày nghỉ; duyệt bài.",
  bienTap: "viết, sửa, tải ảnh và gửi duyệt bài. Không sửa giá, không tự đăng bài.",
  marketing: "mã khuyến mãi, hoa hồng, số liệu; viết nháp bài. Xem bảng giá nhưng không sửa giá.",
  dieuPhoi: "đơn hàng và trạng thái đơn (làm trong /admin).",
};

export const duoc = (user, viec) => Boolean(user && QUYEN[viec]?.includes(user.vaiTro));

/** Người đang đăng nhập; chưa đăng nhập thì chuyển sang trang đăng nhập của CMS rồi quay lại `duongDan`. */
export async function layNguoiQuanTri(duongDan) {
  const payload = await layPayload();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) redirect(`/admin/login?redirect=${encodeURIComponent(duongDan)}`);
  return { payload, user };
}

/** Bài đang chờ duyệt (số nhỏ cạnh mục "Bài viết & trang" trong menu). */
export async function demChoDuyet(payload) {
  const ds = ["dich-vu", "cam-nang", "trang-khu-vuc", "trang-hang-xe"];
  const dem = await Promise.all(ds.map((collection) =>
    // draft: true để đọc bản mới nhất (bản nháp đã gửi duyệt chưa nằm ở bảng chính)
    payload.find({ collection, draft: true, where: { trangThaiDuyet: { equals: "choDuyet" } }, limit: 1, depth: 0, overrideAccess: true, select: { id: true } })
      .then((r) => r.totalDocs).catch(() => 0)));
  return dem.reduce((a, b) => a + b, 0);
}
