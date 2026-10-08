// Khối kêu gọi nền tối: nhãn nhỏ, tiêu đề, một câu, một nút (BangGia "Muốn biết giá sát…", HangXe/XeDien "Xe đã chọn sẵn").
// Không có "use client" nên dùng được cả trong server và client component. Agent khác dùng lại được.
import Link from "next/link";
import s from "./KhoiCta.module.css";

export default function KhoiCta({ nhan = null, tieuDe, moTa = null, href, chuNut, nutPhu = null, className = "" }) {
  return (
    <section className={`${s.khoi} ${className}`}>
      {nhan ? <span className={s.nhan}>{nhan}</span> : null}
      <b className={s.tieuDe}>{tieuDe}</b>
      {moTa ? <span className={s.moTa}>{moTa}</span> : null}
      <Link href={href} className={`nut nut-chinh nut-lon ${s.nut}`}>{chuNut}</Link>
      {nutPhu}
    </section>
  );
}
