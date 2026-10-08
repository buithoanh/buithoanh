import Link from "next/link";
import { layDanhSachDichVu, laySite } from "../lib/cms";
import { CallButton, ZaloButton } from "./Contact";

export default async function Footer() {
  const [site, services] = await Promise.all([laySite(), layDanhSachDichVu()]);
  return (
    <>
      <footer className="footer">
        <div className="wrap cols">
          <div>
            <h4>{site.name}</h4>
            <p>{site.slogan}. Dịch vụ sửa chữa, bảo dưỡng ô tô tận nơi tại {site.city}, thuộc {site.parent}.</p>
          </div>
          <div>
            <h4>Dịch vụ</h4>
            {services.map((s) => (
              <div key={s.slug}><Link href={`/dich-vu/${s.slug}/`}>{s.ten}</Link></div>
            ))}
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p>Hotline: {site.hotline || "sắp có"}<br />Email: {site.email || "sắp có"}</p>
            <p><Link href="/dat-lich/">Đặt lịch bảo dưỡng</Link></p>
          </div>
        </div>
      </footer>
      <div className="callbar">
        <CallButton hotline={site.hotline} label="Gọi thợ" />
        <ZaloButton zalo={site.zalo} />
      </div>
    </>
  );
}
