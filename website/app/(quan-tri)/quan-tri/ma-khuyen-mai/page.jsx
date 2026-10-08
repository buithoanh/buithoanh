// Màn QtMaKhuyenMai: mã khuyến mãi và mã đối tác (KOC, cây xăng, BQL chung cư): thống kê, danh sách, tạo/sửa mã,
// QR in, báo cáo hoa hồng tháng (xuất Excel/CSV). Dữ liệu đọc bằng hàm trong lib/ma-khuyen-mai.ts (cùng nguồn với
// GET /api/ma-khuyen-mai/danh-sach, /thong-ke, /hoa-hong); tạo, sửa qua REST POST/PATCH /api/ma-khuyen-mai.
import KhungQuanTri, { KhongCoQuyen } from "@/components/quan-tri/KhungQuanTri";
import QuanLyMa from "@/components/quan-tri/ma-khuyen-mai/QuanLyMa";
import site from "@/site.config.mjs";
import { LOAI_MA } from "@/lib/khuyen-mai.mjs";
import { baoCaoHoaHong, moTaMa, thongKeMa } from "@/lib/ma-khuyen-mai";
import { demChoDuyet, duoc, layNguoiQuanTri } from "@/lib/quan-tri/phien";

export const metadata = { title: "Mã khuyến mãi" };

/** 3 tháng gần nhất theo giờ Việt Nam: ["2026-08", "2026-09", "2026-10"] */
function baThang() {
  const nay = new Date(Date.now() + 7 * 3600e3);
  return [2, 1, 0].map((n) => new Date(Date.UTC(nay.getUTCFullYear(), nay.getUTCMonth() - n, 1)).toISOString().slice(0, 7));
}

export default async function TrangMaKhuyenMai({ searchParams }) {
  const sp = await searchParams;
  const { payload, user } = await layNguoiQuanTri("/quan-tri/ma-khuyen-mai/");
  const soChoDuyet = duoc(user, "baiViet") ? await demChoDuyet(payload) : 0;
  if (!duoc(user, "maKhuyenMai")) {
    return (
      <KhungQuanTri user={user} hienTai="ma-khuyen-mai" soChoDuyet={soChoDuyet}>
        <KhongCoQuyen tieuDe="Bạn không có quyền mở màn Mã khuyến mãi" lyDo="Mã khuyến mãi, mã đối tác và hoa hồng do Marketing và Quản trị quản lý." />
      </KhungQuanTri>
    );
  }
  const thangs = baThang();
  const thang = thangs.includes(sp?.thang) ? sp.thang : thangs[2];
  const xemHoaHong = duoc(user, "hoaHong");
  const [ds, thongKe, hoaHong] = await Promise.all([
    payload.find({ collection: "ma-khuyen-mai", limit: 1000, depth: 0, sort: "-createdAt", pagination: false, overrideAccess: true }),
    thongKeMa(payload),
    xemHoaHong ? baoCaoHoaHong(payload, thang) : null,
  ]);
  const ma = await Promise.all(ds.docs.map(async (d) => ({ ...d, ...(await moTaMa(payload, d)) })));
  return (
    <KhungQuanTri user={user} hienTai="ma-khuyen-mai" soChoDuyet={soChoDuyet}>
      <QuanLyMa ma={ma} loai={LOAI_MA} thongKe={thongKe} hoaHong={hoaHong} thangs={thangs} thang={thang}
        coTheSua={duoc(user, "suaMa")} tenWeb={site.name} />
    </KhungQuanTri>
  );
}
