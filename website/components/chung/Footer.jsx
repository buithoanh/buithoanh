// Footer theo thiết kế Main (điện thoại) và TrangChuMayTinh (máy tính, 4 cột).
// Pháp nhân, MST, địa chỉ, khu vực phục vụ đều lấy từ Cấu hình chung và Vùng phục vụ trong admin.
import Link from "next/link";
import { layDanhSachDichVu } from "@/lib/cms";
import { tenKhuVuc } from "@/lib/giao-dien";
import s from "./Footer.module.css";

export default async function Footer({ chung }) {
  const dichVu = await layDanhSachDichVu();
  const { thuongHieu, phapNhan, lienHe } = chung;
  const khuVuc = tenKhuVuc(chung);
  const chinhSachDuLieu = lienHe.chinhSachDuLieu || "/chinh-sach-du-lieu/";
  return (
    <footer className={s.footer}>
      <div className={`wrap ${s.cot}`}>
        <div className={s.thuongHieu}>
          <b className={s.ten}>{thuongHieu.ten}</b>
          {phapNhan.ten ? <span>{phapNhan.ten} · {thuongHieu.dongPhu}</span> : <span>{thuongHieu.dongPhu}</span>}
          {phapNhan.mst ? <span>MST {phapNhan.mst}</span> : null}
          {phapNhan.diaChi ? <span>{phapNhan.diaChi}</span> : null}
          {lienHe.hotline ? <span>Hotline {lienHe.hotline}</span> : null}
        </div>
        {dichVu.length > 0 && (
          <nav aria-label="Dịch vụ" className={s.nhom}>
            <b>Dịch vụ</b>
            {dichVu.map((d) => <Link key={d.slug} href={`/dich-vu/${d.slug}/`}>{d.ten}</Link>)}
          </nav>
        )}
        <nav aria-label="Chính sách" className={s.nhom}>
          <b>Chính sách</b>
          <Link href="/chinh-sach-bao-hanh/">Chính sách bảo hành</Link>
          <Link href={chinhSachDuLieu}>Bảo vệ dữ liệu cá nhân</Link>
          <Link href="/tuyen-tho/">Tuyển thợ cộng tác</Link>
          <Link href="/tra-cuu-xe/">Tra cứu lịch sử xe</Link>
        </nav>
        <div className={s.nhom}>
          <b>Khu vực phục vụ</b>
          <span>{khuVuc.length ? `${khuVuc.join(", ")} (${thuongHieu.thanhPho})` : thuongHieu.thanhPho}</span>
          {phapNhan.daThongBaoBoCongThuong ? <span className={s.bct}>Đã thông báo Bộ Công Thương</span> : null}
        </div>
      </div>
    </footer>
  );
}
