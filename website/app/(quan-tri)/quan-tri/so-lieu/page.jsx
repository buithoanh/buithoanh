// Màn QtSoLieu: số liệu website theo ngày/tuần/tháng (KPI so với kỳ trước, đơn theo nguồn, tỷ lệ so với mục tiêu,
// nguồn khách, top trang, đơn mới nhất, đối soát với phần mềm điều phối). Đọc bằng baoCaoSoLieu() (cùng nguồn với
// GET /api/su-kien/bao-cao). Biểu đồ vẽ bằng SVG phía server, không thêm thư viện.
import KhungQuanTri, { KhongCoQuyen } from "@/components/quan-tri/KhungQuanTri";
import SoLieu from "@/components/quan-tri/so-lieu/SoLieu";
import { baoCaoSoLieu } from "@/lib/so-lieu";
import { demChoDuyet, duoc, layNguoiQuanTri } from "@/lib/quan-tri/phien";

export const metadata = { title: "Số liệu" };

export default async function TrangSoLieu({ searchParams }) {
  const sp = await searchParams;
  const ky = ["ngay", "tuan", "thang"].includes(sp?.ky) ? sp.ky : "thang";
  const { payload, user } = await layNguoiQuanTri(`/quan-tri/so-lieu/${sp?.ky ? `?ky=${ky}` : ""}`);
  const soChoDuyet = duoc(user, "baiViet") ? await demChoDuyet(payload) : 0;
  if (!duoc(user, "soLieu")) {
    return (
      <KhungQuanTri user={user} hienTai="so-lieu" soChoDuyet={soChoDuyet}>
        <KhongCoQuyen tieuDe="Bạn không có quyền mở màn Số liệu" lyDo="Số liệu website dành cho Quản trị, Quản lý dịch vụ và Marketing." />
      </KhungQuanTri>
    );
  }
  const bc = await baoCaoSoLieu(payload, { ky });
  return (
    <KhungQuanTri user={user} hienTai="so-lieu" soChoDuyet={soChoDuyet}>
      <SoLieu bc={bc} ky={ky} />
    </KhungQuanTri>
  );
}
