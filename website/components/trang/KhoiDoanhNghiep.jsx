// Khối mời doanh nghiệp có đội xe (trang chủ; agent khác dùng lại được). hoSoNangLuc: link PDF trong Cấu hình chung
// (cai-dat.hoSoNangLucUrl), không có thì ẩn nút tải.
import Link from "next/link";
import s from "./KhoiDoanhNghiep.module.css";

export default function KhoiDoanhNghiep({ hoSoNangLuc = null, className = "" }) {
  return (
    <section className={`${s.khoi} ${className}`} aria-labelledby="khoi-dn">
      <div className={s.chu}>
        <h2 id="khoi-dn" className={s.tieuDe}>Doanh nghiệp có đội xe?</h2>
        <p className={s.moTa}>
          <span className={s.themMayTinh}>Taxi, xe cho thuê tự lái, xe công ty: </span>bảo dưỡng tại bãi, giá theo xe/tháng, có hoá đơn VAT.
        </p>
      </div>
      <div className={s.nut}>
        <Link href="/doanh-nghiep/" className={s.link}>Xin báo giá hợp đồng<span className={s.muiTen} aria-hidden="true"> →</span></Link>
        {hoSoNangLuc ? (
          <a href={hoSoNangLuc} className={`nut nut-trang ${s.taiPdf}`} target="_blank" rel="noopener">Tải hồ sơ năng lực (PDF)</a>
        ) : null}
      </div>
    </section>
  );
}
