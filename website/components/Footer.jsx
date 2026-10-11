import Link from "next/link";
import site from "../site.config.mjs";
import { sortedServices } from "../lib/content.mjs";
import { CallButton, ZaloButton } from "./Contact";
import { Logo } from "./Header";
import Icon from "./Icon";

export default function Footer() {
  const services = sortedServices();
  const areas = site.serviceAreas.length ? site.serviceAreas.join(", ") : site.city;
  return (
    <>
      <footer className="footer">
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand"><Logo /><span className="brand-txt"><b>{site.name}</b><span>{site.slogan}</span></span></div>
              <p>Sửa chữa, bảo dưỡng ô tô tận nơi tại {site.city}. Một thương hiệu của {site.parent}.</p>
              <div className="footer-ctas"><CallButton /><ZaloButton /></div>
            </div>
            <div>
              <h4>Dịch vụ</h4>
              <ul>{services.map((s) => <li key={s.slug}><Link href={`/dich-vu/${s.slug}/`}>{s.data.ten}</Link></li>)}</ul>
            </div>
            <div>
              <h4>Khách hàng</h4>
              <ul>
                <li><Link href="/dat-lich/">Đặt lịch thợ</Link></li>
                <li><Link href="/tra-cuu/">Tra cứu lệnh sửa chữa</Link></li>
                <li><Link href="/cam-nang/">Cẩm nang xe</Link></li>
              </ul>
            </div>
            <div>
              <h4>Liên hệ</h4>
              <ul className="footer-contact">
                <li><Icon name="phone" size={18} />Hotline: {site.hotline || "sắp có"}</li>
                <li><Icon name="chat" size={18} />Email: {site.email || "sắp có"}</li>
                <li><Icon name="pin" size={18} />Khu vực: {areas}</li>
              </ul>
            </div>
          </div>
          <p className="footer-bottom">© {new Date().getFullYear()} {site.name} · {site.parent}</p>
        </div>
      </footer>
      <div className="callbar" role="navigation" aria-label="Liên hệ nhanh">
        <CallButton className="btn btn-primary" label="Gọi thợ" short />
        <ZaloButton className="btn btn-zalo" label="Zalo" short />
        <Link className="btn btn-light" href="/dat-lich/"><Icon name="calendar" size={20} /><span>Đặt lịch</span></Link>
      </div>
    </>
  );
}
