import Link from "next/link";
import site from "../site.config.mjs";
import Logo from "./Logo";
import { CallButton } from "./Contact";

export default function Header() {
  return (
    <>
      <a className="skip" href="#noi-dung">Bỏ qua menu, tới nội dung chính</a>
      {!site.allowIndex && (
        <div className="staging">Bản chạy thử trước khi có tên miền chính thức. Google chưa lập chỉ mục trang này.</div>
      )}
      <header className="header">
        <div className="wrap header-row">
          <Link href="/" className="brand" aria-label={`${site.name} – về trang chủ`}>
            <Logo size={38} />
            <span className="brand-text">
              <b>{site.name}</b>
              <span>{site.slogan}</span>
            </span>
          </Link>
          <nav className="nav" aria-label="Menu chính">
            <Link href="/#dich-vu">Dịch vụ</Link>
            <Link href="/cam-nang/">Cẩm nang xe</Link>
            <Link href="/dat-lich/">Đặt lịch</Link>
          </nav>
          <div className="header-call">
            <CallButton className="btn btn-primary btn-sm" label={site.hotline} />
          </div>
        </div>
      </header>
    </>
  );
}
