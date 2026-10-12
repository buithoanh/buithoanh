// Header web công khai. Điện thoại: tên + hotline + nút menu (thẻ <details>, không cần JavaScript).
// Máy tính: menu ngang theo thiết kế TrangChuMayTinh.
import Link from "next/link";
import Icon from "../Icon";
import { telHref } from "../../lib/tel";
import s from "./Header.module.css";

export const MENU = [
  { href: "/#dich-vu", ten: "Dịch vụ" },
  { href: "/bang-gia/", ten: "Bảng giá" },
  { href: "/xe-dien/", ten: "Xe điện" },
  { href: "/doanh-nghiep/", ten: "Doanh nghiệp" },
  { href: "/cam-nang/", ten: "Cẩm nang" },
  { href: "/ve-chung-toi/", ten: "Về chúng tôi" },
];

const MENU_THEM = [
  { href: "/dat-lich/", ten: "Đặt lịch" },
  { href: "/goi-gap/", ten: "Gọi thợ gấp" },
  { href: "/hoi-vien/", ten: "Gói hội viên" },
  { href: "/tra-cuu-xe/", ten: "Tra cứu lịch sử xe" },
  { href: "/tuyen-tho/", ten: "Tuyển thợ cộng tác" },
];

export default function Header({ chung, xemTruoc = false, choIndex = false }) {
  const { thuongHieu, lienHe } = chung;
  const tel = telHref(lienHe.hotline);
  return (
    <>
      <a className="bo-qua" href="#noi-dung">Bỏ qua menu, tới nội dung chính</a>
      {xemTruoc && (
        <div className="thanh-thu">Đang xem trước bản nháp (khách không thấy). <a href="/xem-truoc/thoat/">Thoát xem trước</a></div>
      )}
      {!xemTruoc && !choIndex && (
        <div className="thanh-thu">Bản chạy thử trước khi có tên miền chính thức. Google chưa lập chỉ mục trang này.</div>
      )}
      <header className={s.header}>
        <div className={`wrap ${s.hang}`}>
          <Link href="/" className={s.ten} aria-label={`${thuongHieu.ten} ${thuongHieu.dongPhu} – về trang chủ`}>
            <b>{thuongHieu.ten}</b>
            <span>{thuongHieu.dongPhu}</span>
          </Link>
          <nav className={s.menuNgang} aria-label="Menu chính">
            {MENU.map((m) => <Link key={m.href} href={m.href}>{m.ten}</Link>)}
          </nav>
          <div className={s.phai}>
            {tel ? (
              <a href={tel} className={s.goi} aria-label={`Gọi hotline ${lienHe.hotline}`}>
                <Icon name="phone" size={18} className={s.iconGoi} />
                <span>{lienHe.hotline}</span>
              </a>
            ) : null}
            <Link href="/dat-lich/" className={`nut nut-chinh ${s.datLich}`}>Đặt lịch</Link>
            <details className={s.menuDoc}>
              <summary aria-label="Mở menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
              </summary>
              <nav className={s.ngan} aria-label="Menu">
                {[...MENU, ...MENU_THEM].map((m) => <Link key={m.href} href={m.href}>{m.ten}</Link>)}
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
