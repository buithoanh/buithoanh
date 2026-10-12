import Link from "next/link";
import site from "../site.config.mjs";
import { team } from "../lib/content.mjs";
import { telHref } from "./Contact";
import Icon from "./Icon";
import MobileMenu from "./MobileMenu";

export function Logo() {
  return (
    <svg className="logo-mark" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="var(--brand)" />
      <path d="M18 7.5c-4.4 0-8 3.4-8 7.7 0 5.6 8 13.3 8 13.3s8-7.7 8-13.3c0-4.3-3.6-7.7-8-7.7z" fill="#fff" />
      <path d="M20.6 12.2a.6.6 0 0 0 0 .8l1 1a.6.6 0 0 0 .8 0l1.6-1.6a3.4 3.4 0 0 1-4.5 4.5l-3.4 3.4a1.2 1.2 0 0 1-1.7-1.7l3.4-3.4a3.4 3.4 0 0 1 4.5-4.5z" fill="var(--brand)" />
    </svg>
  );
}

export default function Header() {
  const links = [
    { href: "/#dich-vu", label: "Dịch vụ" },
    { href: "/dat-lich/", label: "Đặt lịch" },
    { href: "/tra-cuu/", label: "Tra cứu lệnh sửa" },
    { href: "/cam-nang/", label: "Cẩm nang xe" },
    ...(team().length ? [{ href: "/doi-ngu/", label: "Đội ngũ" }] : []),
  ];
  const tel = telHref();
  return (
    <>
      {!site.allowIndex && (
        <aside className="staging" aria-label="Thông báo">{site.mock ? "Bản chạy thử · Hotline, giá, đánh giá, KTV là dữ liệu mẫu" : "Bản chạy thử, Google chưa lập chỉ mục trang này."}</aside>
      )}
      <header className="header">
        <div className="wrap header-row">
          <Link href="/" className="brand" aria-label={`${site.name}, về trang chủ`}>
            <Logo />
            <span className="brand-txt"><b>{site.name}</b><span>{site.slogan}</span></span>
          </Link>
          <nav className="nav" aria-label="Menu chính">
            {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <div className="header-actions">
            <a className="hotline" href={tel} aria-disabled={tel ? undefined : "true"} aria-label={tel ? `Gọi thợ tới: ${site.hotline}` : "Hotline sắp có"}>
              <span className="hotline-ic"><Icon name="phone" size={18} /></span>
              <span className="hotline-txt"><small>Gọi thợ tới</small><b>{site.hotline || "Hotline sắp có"}</b></span>
            </a>
            <MobileMenu links={links} />
          </div>
        </div>
      </header>
    </>
  );
}
