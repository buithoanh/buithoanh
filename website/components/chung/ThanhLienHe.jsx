// Thanh liên hệ dính dưới đáy màn hình điện thoại: Gọi thợ · Zalo · Đặt lịch. Ẩn trên máy tính.
import Link from "next/link";
import { NutGoi, NutZalo } from "./LienHe";
import s from "./ThanhLienHe.module.css";

export default function ThanhLienHe({ chung, datLich = "/dat-lich/" }) {
  return (
    <nav className={s.thanh} aria-label="Liên hệ nhanh">
      <NutGoi hotline={chung.lienHe.hotline} className={`nut nut-chinh ${s.nut}`}>Gọi thợ</NutGoi>
      <NutZalo zalo={chung.lienHe.zalo} className={`nut nut-zalo ${s.nut}`} />
      <Link href={datLich} className={`nut nut-trang ${s.nut}`}>Đặt lịch</Link>
    </nav>
  );
}
