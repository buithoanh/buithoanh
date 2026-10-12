// Màn QtBaiViet: danh sách 4 loại bài (cẩm nang, dịch vụ, khu vực, hãng xe) với quy trình Nháp → Chờ duyệt → Hẹn giờ → Đã đăng.
// Soạn nội dung mở sang trình soạn thảo của CMS (/admin/collections/...), không dựng lại trình soạn thảo ở đây.
import KhungQuanTri, { KhongCoQuyen } from "@/components/quan-tri/KhungQuanTri";
import QuanLyBai from "@/components/quan-tri/bai-viet/QuanLyBai";
import site from "@/site.config.mjs";
import { danhSachBai } from "@/lib/noi-dung";
import { demChoDuyet, duoc, layNguoiQuanTri } from "@/lib/quan-tri/phien";

export const metadata = { title: "Bài viết & trang" };

export default async function TrangBaiViet() {
  const { payload, user } = await layNguoiQuanTri("/quan-tri/bai-viet/");
  if (!duoc(user, "baiViet")) {
    return (
      <KhungQuanTri user={user} hienTai="bai-viet">
        <KhongCoQuyen tieuDe="Bạn không có quyền mở màn này" lyDo="Màn Bài viết & trang dành cho tài khoản viết và duyệt nội dung." />
      </KhungQuanTri>
    );
  }
  const [ds, dichVu, quan, soChoDuyet] = await Promise.all([
    danhSachBai(payload, {}),
    payload.find({ collection: "danh-muc-dich-vu", sort: "thuTu", limit: 100, depth: 0, pagination: false }),
    payload.find({ collection: "quan", where: { dangPhucVu: { equals: true } }, sort: "thuTu", limit: 100, depth: 0, pagination: false }),
    demChoDuyet(payload),
  ]);
  return (
    <KhungQuanTri user={user} hienTai="bai-viet" soChoDuyet={soChoDuyet}>
      <QuanLyBai
        bai={ds.bai}
        laNguoiDuyet={duoc(user, "duyetBai")}
        tenMien={{ ten: site.name, host: new URL(site.url).host }}
        dichVu={dichVu.docs.map((d) => ({ slug: d.slug, ten: d.ten }))}
        khuVuc={quan.docs.map((q) => ({ slug: q.slug, ten: q.ten, etaTu: q.etaTu, etaDen: q.etaDen }))}
      />
    </KhungQuanTri>
  );
}
