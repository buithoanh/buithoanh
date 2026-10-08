// Bảng giá tóm tắt trang chủ: vài hạng mục "nổi bật" + phí đi lại (layTrangChu().giaNhanh), link sang /bang-gia/.
import Link from "next/link";
import s from "./BangGiaTomTat.module.css";

export default function BangGiaTomTat({ dong, id = "bang-gia-tom-tat", className = "" }) {
  return (
    <section className={`khoi ${className}`} aria-labelledby={id}>
      <div className="khoi-tieu-de">
        <h2 id={id}>Bảng giá tóm tắt</h2>
        <Link href="/bang-gia/" className={`link-nhan ${s.xemDu}`}>Xem đủ →</Link>
      </div>
      <div className={s.bang}>
        <dl className={s.ds}>
          {dong.map((d) => (
            <div key={d.ten} className={s.dong}>
              <dt>{d.ten}</dt>
              <dd>{d.giaHienThi}</dd>
            </div>
          ))}
        </dl>
        <p className={s.ghiChu}>Giá công cố định. Giá phụ tùng theo dòng xe, chốt sau khi thợ kiểm tra.</p>
        <Link href="/bang-gia/" className={s.cuoi}>Xem bảng giá đầy đủ →</Link>
      </div>
    </section>
  );
}
