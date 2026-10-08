import Link from "next/link";
import site from "../site.config.mjs";
import { cheDoNhap } from "../lib/cms";

export default async function Header() {
  const xemTruoc = await cheDoNhap();
  return (
    <>
      {xemTruoc && (
        <div className="staging">
          Đang xem trước bản nháp (khách không thấy). <a href="/xem-truoc/thoat/">Thoát xem trước</a>
        </div>
      )}
      {!xemTruoc && !site.allowIndex && (
        <div className="staging">Bản chạy thử trước khi có tên miền chính thức. Google chưa lập chỉ mục trang này.</div>
      )}
      <header className="header">
        <div className="wrap">
          <Link href="/" className="brand">
            <b>{site.name}</b>
            <span>{site.slogan}</span>
          </Link>
          <nav className="nav" aria-label="Menu chính">
            <Link href="/#dich-vu">Dịch vụ</Link>
            <Link href="/cam-nang/">Cẩm nang xe</Link>
            <Link href="/dat-lich/">Đặt lịch</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
