import Link from "next/link";
import site from "../site.config.mjs";
import { allEntries, sortedArticles } from "../lib/content.mjs";
import { CallButton } from "../components/Contact";
import JsonLd from "../components/JsonLd";

export default function Home() {
  const services = allEntries("dich-vu").sort((a, b) => (a.data.thuTu ?? 99) - (b.data.thuTu ?? 99));
  const articles = sortedArticles().slice(0, 3);
  const areas = site.serviceAreas.length ? site.serviceAreas.join(", ") : site.city;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AutoRepair", name: site.name, slogan: site.slogan, url: site.url,
        ...(site.hotline && { telephone: site.hotline }),
        areaServed: site.serviceAreas.length ? site.serviceAreas.map((a) => ({ "@type": "AdministrativeArea", name: `${a}, ${site.city}` })) : site.city,
        parentOrganization: { "@type": "Organization", name: site.parent },
      }} />
      <section className="hero">
        <div className="wrap">
          <h1>{site.slogan}</h1>
          <p className="lead">Thợ {site.name} mang đồ nghề và phụ tùng tới tận nơi xe bạn đang đỗ: ắc quy, lốp, bảo dưỡng, phanh, đọc lỗi. Báo giá trước khi làm.</p>
          <div className="ctas">
            <CallButton />
            <Link className="btn btn-ghost" href="/dat-lich/">Đặt lịch bảo dưỡng</Link>
          </div>
          <ul className="facts">
            <li>Khu vực: {areas}</li>
            <li>Phụ tùng từ hệ thống VCparts</li>
            <li>Ca phức tạp kéo về {site.partnerWorkshop}</li>
          </ul>
        </div>
      </section>

      <section className="block" id="dich-vu">
        <div className="wrap">
          <h2>Dịch vụ tận nơi</h2>
          <p className="sub">Chọn việc xe bạn cần. Mỗi trang có quy trình, câu hỏi thường gặp và cách đặt thợ.</p>
          <div className="grid">
            {services.map((s) => (
              <Link key={s.slug} className="card" href={`/dich-vu/${s.slug}/`}>
                <h3>{s.data.ten}</h3>
                <p>{s.data.tomTat}</p>
                <span className="more">Xem chi tiết →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <h2>Gọi thợ thế nào</h2>
          <ol className="steps">
            <li><b>Gọi hoặc đặt lịch</b>Cho biết dòng xe, vị trí và tình trạng.</li>
            <li><b>Nhận báo giá</b>Thợ báo giá công và phụ tùng trước, bạn đồng ý mới làm.</li>
            <li><b>Thợ tới tận nơi</b>Xe van đủ đồ nghề, có lót ghế và thảm giữ sạch xe.</li>
            <li><b>Thanh toán, đánh giá</b>Chuyển khoản VietQR hoặc tiền mặt, có hoá đơn điện tử.</li>
          </ol>
        </div>
      </section>

      {articles.length > 0 && (
        <section className="block">
          <div className="wrap">
            <h2>Cẩm nang xe</h2>
            <p className="sub">Hướng dẫn tự kiểm tra và xử lý những sự cố hay gặp.</p>
            <div className="grid">
              {articles.map((a) => (
                <Link key={a.slug} className="card" href={`/cam-nang/${a.slug}/`}>
                  <h3>{a.data.title}</h3>
                  <p>{a.data.description}</p>
                  <span className="more">Đọc bài →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
