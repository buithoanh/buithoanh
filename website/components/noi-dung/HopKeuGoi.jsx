// Hộp mời đặt lịch cuối trang cẩm nang ("Đọc xong vẫn chưa yên tâm?").
import Link from "next/link";
import s from "./HopKeuGoi.module.css";

export default function HopKeuGoi({
  tieuDe = "Đọc xong vẫn chưa yên tâm?",
  moTa = "Thợ tới tận chỗ xe đỗ, kiểm tra và báo giá trước. Bạn đồng ý mới làm.",
  nut = "Đặt lịch kiểm tra",
  href = "/dat-lich/",
}) {
  return (
    <section className={s.hop} aria-label="Đặt lịch kiểm tra">
      <div className={s.chu}>
        <p className={s.tieuDe}>{tieuDe}</p>
        <p className={s.moTa}>{moTa}</p>
      </div>
      <Link href={href} className="nut nut-chinh nut-day">{nut}</Link>
    </section>
  );
}
