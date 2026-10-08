import Link from "next/link";
import { layDanhSachDichVu, laySite } from "../lib/cms";
import { CallButton, ZaloButton } from "./Contact";
import Logo from "./Logo";

export default async function Footer() {
  const [site, services] = await Promise.all([laySite(), layDanhSachDichVu()]);
  const areas = site.serviceAreas.length ? site.serviceAreas.join(", ") : site.city;
  return (
    <>
      <footer className="footer">
        <div className="wrap cols">
          <div className="footer-brand">
            <div className="footer-logo"><Logo size={36} /><b>{site.name}</b></div>
            <p>{site.slogan}. Dịch vụ sửa chữa, bảo dưỡng ô tô tận nơi tại {site.city}, thuộc {site.parent}.</p>
            <p className="footer-area">Khu vực phục vụ: {areas}</p>
          </div>
          <nav aria-label="Dịch vụ">
            <h2 className="footer-h">Dịch vụ</h2>
            <ul className="footer-links">
              {services.map((s) => (
                <li key={s.slug}><Link href={`/dich-vu/${s.slug}/`}>{s.ten}</Link></li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="footer-h">Liên hệ</h2>
            <ul className="footer-links">
              <li>Hotline: {site.hotline || "sắp có"}</li>
              <li>Email: {site.email || "sắp có"}</li>
              <li><Link href="/dat-lich/">Đặt lịch bảo dưỡng</Link></li>
              <li><Link href="/cam-nang/">Cẩm nang xe</Link></li>
            </ul>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {site.name} · {site.parent}</span>
          <span>Hình minh hoạ trên trang là ảnh tạm.</span>
        </div>
      </footer>
      <div className="callbar" role="region" aria-label="Gọi thợ nhanh">
        <CallButton hotline={site.hotline} className="btn btn-primary" label="Gọi thợ ngay" />
        <ZaloButton zalo={site.zalo} />
      </div>
    </>
  );
}
