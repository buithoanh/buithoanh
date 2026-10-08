import Link from "next/link";
import site from "../site.config.mjs";
import { allEntries } from "../lib/content.mjs";
import { CallButton, ZaloButton } from "./Contact";

export default function Footer() {
  const services = allEntries("dich-vu");
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
              <div key={s.slug}><Link href={`/dich-vu/${s.slug}/`}>{s.data.ten}</Link></div>
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
        <CallButton label="Gọi thợ" />
        <ZaloButton />
      </div>
    </>
  );
}
