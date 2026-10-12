// Thẻ dịch vụ (trang chủ, 404): mã viết tắt, tên, một dòng mô tả; máy tính thêm "Giá công từ …".
// dv: phần tử dichVu của layTrangChu() (ma, ten, slug, moTaNgan, giaCongTuHienThi).
import Link from "next/link";
import s from "./TheDichVu.module.css";

export function TheDichVu({ dv, hienGia = true }) {
  return (
    <Link href={`/dich-vu/${dv.slug}/`} className={s.the}>
      <span className={s.ma} aria-hidden="true">{dv.ma}</span>
      <span className={s.chu}>
        <b className={s.ten}>{dv.ten}</b>
        {dv.moTaNgan ? <span className={s.moTa}>{dv.moTaNgan}</span> : null}
        {hienGia && dv.giaCongTuHienThi ? <span className={s.gia}>Giá công {dv.giaCongTuHienThi} →</span> : null}
      </span>
    </Link>
  );
}

/** Lưới thẻ dịch vụ: 2 cột trên điện thoại, thẻ ngang nhiều cột trên máy tính. */
export default function LuoiDichVu({ dichVu, hienGia = true }) {
  return (
    <ul className={s.luoi}>
      {dichVu.map((dv) => <li key={dv.slug}><TheDichVu dv={dv} hienGia={hienGia} /></li>)}
    </ul>
  );
}
