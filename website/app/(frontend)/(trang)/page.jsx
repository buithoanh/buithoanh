import Link from "next/link";
import { layDanhSachBai, layDanhSachDichVu, laySite } from "@/lib/cms";
import { CallButton, ZaloButton } from "@/components/Contact";
import JsonLd from "@/components/JsonLd";
import Icon, { iconDichVu } from "@/components/Icon";
import { anhTrangChu, anhDichVu } from "@/components/anh";

// Lối tắt cho khách đang gặp sự cố: chọn triệu chứng, tới thẳng trang dịch vụ.
const suCo = [
  { slug: "ac-quy", text: "Xe không nổ máy, đề yếu" },
  { slug: "lop", text: "Lốp xịt, bị đinh đâm" },
  { slug: "doc-loi-chan-doan", text: "Đèn check engine sáng" },
  { slug: "phanh", text: "Phanh kêu rít, đạp sâu" },
  { slug: "cuu-ho-keo-xe", text: "Hỏng nặng, cần kéo xe" },
  { slug: "bao-duong-dinh-ky", text: "Đến hạn thay dầu, bảo dưỡng" },
];

export default async function Home() {
  const [site, services, articles] = await Promise.all([laySite(), layDanhSachDichVu(), layDanhSachBai(3)]);
  const slugs = new Set(services.map((s) => s.slug));
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
        <div className="wrap hero-grid">
          <div className="hero-text">
            <p className="eyebrow"><Icon name="pin" size={16} /> Sửa ô tô lưu động tại {site.city}</p>
            <h1>{site.slogan}</h1>
            <p className="lead">Thợ {site.name} mang đồ nghề và phụ tùng tới tận nơi xe bạn đang đỗ: ắc quy, lốp, bảo dưỡng, phanh, đọc lỗi. Báo giá trước khi làm.</p>
            <div className="ctas">
              <CallButton hotline={site.hotline} className="btn btn-primary btn-lg" />
              <Link className="btn btn-light btn-lg" href="/dat-lich/"><Icon name="calendar" /><span>Đặt lịch bảo dưỡng</span></Link>
            </div>
            <ul className="facts">
              <li><Icon name="check" size={18} />Báo giá trước, đồng ý mới làm</li>
              <li><Icon name="check" size={18} />Phụ tùng từ hệ thống VCparts</li>
              <li><Icon name="check" size={18} />Ca phức tạp kéo về {site.partnerWorkshop}</li>
              <li><Icon name="check" size={18} />Khu vực: {areas}</li>
            </ul>
          </div>
          <figure className="hero-art">
            <img src={anhTrangChu.src} alt={anhTrangChu.alt} width={anhTrangChu.width} height={anhTrangChu.height} fetchPriority="high" decoding="async" />
          </figure>
        </div>
      </section>

      <section className="triage" aria-labelledby="su-co">
        <div className="wrap">
          <div className="triage-box">
            <h2 id="su-co">Xe bạn đang gặp chuyện gì?</h2>
            <ul className="chips">
              {suCo.filter((c) => slugs.has(c.slug)).map((c) => (
                <li key={c.slug}>
                  <Link className="chip" href={`/dich-vu/${c.slug}/`}>
                    <span className="chip-icon"><Icon name={iconDichVu[c.slug]} /></span>
                    <span>{c.text}</span>
                    <Icon name="arrow" size={18} className="chip-arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="block" id="dich-vu" aria-labelledby="dv-h">
        <div className="wrap">
          <div className="section-head">
            <p className="kicker">Dịch vụ</p>
            <h2 id="dv-h">Dịch vụ tận nơi</h2>
            <p className="sub">Chọn việc xe bạn cần. Mỗi trang có quy trình, câu hỏi thường gặp và cách đặt thợ.</p>
          </div>
          <div className="grid">
            {services.map((s) => {
              const a = anhDichVu(s.slug);
              return (
                <Link key={s.slug} className="card card-media" href={`/dich-vu/${s.slug}/`}>
                  <span className="card-img"><img src={a.src} alt="" width={a.width} height={a.height} loading="lazy" decoding="async" /></span>
                  <span className="card-body">
                    <span className="card-icon"><Icon name={iconDichVu[s.slug] || "wrench"} /></span>
                    <h3>{s.ten}</h3>
                    <p>{s.tomTat}</p>
                    <span className="more">Xem chi tiết <Icon name="arrow" size={16} /></span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="block block-alt" aria-labelledby="quy-trinh">
        <div className="wrap">
          <div className="section-head">
            <p className="kicker">Quy trình</p>
            <h2 id="quy-trinh">Gọi thợ thế nào</h2>
          </div>
          <ol className="steps">
            <li><b>Gọi hoặc đặt lịch</b>Cho biết dòng xe, vị trí và tình trạng.</li>
            <li><b>Nhận báo giá</b>Thợ báo giá công và phụ tùng trước, bạn đồng ý mới làm.</li>
            <li><b>Thợ tới tận nơi</b>Xe van đủ đồ nghề, có lót ghế và thảm giữ sạch xe.</li>
            <li><b>Thanh toán, đánh giá</b>Chuyển khoản VietQR hoặc tiền mặt, có hoá đơn điện tử.</li>
          </ol>
        </div>
      </section>

      <section className="block" aria-labelledby="cam-ket">
        <div className="wrap">
          <div className="section-head">
            <p className="kicker">Cam kết</p>
            <h2 id="cam-ket">Rõ ràng từ lúc gọi tới lúc xong</h2>
          </div>
          <ul className="pledges">
            <li><span className="pledge-icon"><Icon name="receipt" size={24} /></span><b>Báo giá trước khi làm</b><span>Thợ kiểm tra, báo giá từng hạng mục công và phụ tùng. Bạn đồng ý mới bắt đầu.</span></li>
            <li><span className="pledge-icon"><Icon name="shield" size={24} /></span><b>Phụ tùng có nguồn gốc</b><span>Phụ tùng lấy từ hệ thống VCparts của tập đoàn {site.parent}.</span></li>
            <li><span className="pledge-icon"><Icon name="tow" size={24} /></span><b>Một đầu mối tới khi xong</b><span>Việc không làm được tại chỗ, xe được đưa về {site.partnerWorkshop}, xưởng đối tác của tập đoàn.</span></li>
            <li><span className="pledge-icon"><Icon name="check" size={24} /></span><b>Giữ sạch xe, có hoá đơn</b><span>Lót ghế và thảm khi làm. Thanh toán VietQR hoặc tiền mặt, có hoá đơn điện tử.</span></li>
          </ul>
        </div>
      </section>

      {articles.length > 0 && (
        <section className="block block-alt" aria-labelledby="cn-h">
          <div className="wrap">
            <div className="section-head section-head-row">
              <div>
                <p className="kicker">Cẩm nang</p>
                <h2 id="cn-h">Cẩm nang xe</h2>
                <p className="sub">Hướng dẫn tự kiểm tra và xử lý những sự cố hay gặp.</p>
              </div>
              <Link className="link-more" href="/cam-nang/">Tất cả bài viết <Icon name="arrow" size={16} /></Link>
            </div>
            <div className="grid">
              {articles.map((a) => (
                <Link key={a.slug} className="card card-article" href={`/cam-nang/${a.slug}/`}>
                  {a.nhom && <span className="tag">{a.nhom}</span>}
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <span className="more">Đọc bài <Icon name="arrow" size={16} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="block" aria-labelledby="cta-h">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2 id="cta-h">Xe đang nằm đường?</h2>
              <p>Gọi thợ, cho biết vị trí và tình trạng xe. Không gấp thì đặt lịch trước.</p>
            </div>
            <div className="cta-actions">
              <CallButton hotline={site.hotline} className="btn btn-primary btn-lg" />
              <ZaloButton zalo={site.zalo} className="btn btn-zalo btn-lg" />
              <Link className="btn btn-light btn-lg" href="/dat-lich/"><Icon name="calendar" /><span>Đặt lịch</span></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
