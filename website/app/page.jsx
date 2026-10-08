import Link from "next/link";
import site from "../site.config.mjs";
import { allEntries, sortedArticles, formatDate } from "../lib/content.mjs";
import { CallButton, ZaloButton } from "../components/Contact";
import JsonLd from "../components/JsonLd";
import Icon from "../components/Icons";

// "Xe bạn đang gặp chuyện gì?" – khách chọn triệu chứng, đi thẳng tới trang dịch vụ.
const SYMPTOMS = [
  { slug: "ac-quy", label: "Đề không nổ, hết điện" },
  { slug: "lop", label: "Lốp xịt, đinh đâm" },
  { slug: "doc-loi-chan-doan", label: "Đèn check engine sáng" },
  { slug: "phanh", label: "Phanh kêu, đạp sâu" },
  { slug: "bao-duong-dinh-ky", label: "Đến hạn thay dầu" },
  { slug: "cuu-ho-keo-xe", label: "Hỏng nặng, không chạy được" },
];

const PROMISES = [
  { icon: "quote", title: "Báo giá trước khi làm", text: "Công và phụ tùng rõ ràng, bạn đồng ý mới bắt đầu." },
  { icon: "part", title: "Phụ tùng từ VCparts", text: "Đúng loại cho xe, lấy từ hệ thống phụ tùng của VC Phồn Vinh." },
  { icon: "clean", title: "Giữ sạch xe", text: "Thợ dùng lót ghế và thảm sàn khi làm việc trên xe." },
  { icon: "receipt", title: "Hoá đơn điện tử", text: "Chuyển khoản VietQR hoặc tiền mặt, có hoá đơn." },
];

const FAQ = [
  { q: "Thợ có tới được chỗ xe tôi đang đỗ không?", a: `Được, miễn là xe đỗ ở nơi an toàn và thợ tiếp cận được: hầm chung cư, sân nhà, bãi đỗ công ty hoặc lề đường. Hiện ${site.name} phục vụ khu vực ${site.serviceAreas.length ? site.serviceAreas.join(", ") : site.city}.` },
  { q: "Giá có cao hơn mang xe ra xưởng không?", a: "Thợ báo giá công và phụ tùng trước khi làm. Bạn thấy hợp lý mới đồng ý, không phát sinh khi chưa hỏi ý bạn." },
  { q: "Nếu không sửa được tại chỗ thì sao?", a: `Với ca phức tạp, chúng tôi kéo xe về ${site.partnerWorkshop} và báo giá trước khi sửa. Bạn không phải tự tìm xưởng.` },
  { q: "Thanh toán thế nào?", a: "Chuyển khoản VietQR hoặc tiền mặt sau khi xong việc. Có hoá đơn điện tử nếu bạn cần." },
];

export default function Home() {
  const services = allEntries("dich-vu").sort((a, b) => (a.data.thuTu ?? 99) - (b.data.thuTu ?? 99));
  const serviceSlugs = new Set(services.map((s) => s.slug));
  const symptoms = SYMPTOMS.filter((s) => serviceSlugs.has(s.slug));
  const articles = sortedArticles().slice(0, 3);
  // Tách slogan thành hai dòng, vế sau tô cam: "Xe dừng đâu," / "thợ tới đó."
  const cut = site.slogan.lastIndexOf(", ");
  const sloganHead = cut > 0 ? site.slogan.slice(0, cut) : "";
  const sloganTail = cut > 0 ? site.slogan.slice(cut + 2) : site.slogan;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AutoRepair", name: site.name, slogan: site.slogan, url: site.url,
        ...(site.hotline && { telephone: site.hotline }),
        areaServed: site.serviceAreas.length ? site.serviceAreas.map((a) => ({ "@type": "AdministrativeArea", name: `${a}, ${site.city}` })) : site.city,
        parentOrganization: { "@type": "Organization", name: site.parent },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><Icon name="van" /> Sửa ô tô tận nơi tại {site.city}</p>
            <h1>{sloganHead && <>{sloganHead},<br /></>}<em>{sloganTail}.</em></h1>
            <p className="lead">Thợ {site.name} mang đồ nghề và phụ tùng tới tận nơi xe bạn đang đỗ: ắc quy, lốp, bảo dưỡng, phanh, đọc lỗi. Báo giá trước khi làm.</p>
            <div className="ctas">
              <CallButton />
              <Link className="btn btn-ghost" href="/dat-lich/">Đặt lịch bảo dưỡng</Link>
            </div>
            <ul className="ticks">
              <li><Icon name="check" /> Báo giá trước, đồng ý mới làm</li>
              <li><Icon name="check" /> Phụ tùng đúng loại từ VCparts</li>
              <li><Icon name="check" /> Ca khó kéo về {site.partnerWorkshop}</li>
            </ul>
          </div>

          <div className="triage" aria-labelledby="triage-title">
            <h2 id="triage-title">Xe bạn đang gặp chuyện gì?</h2>
            <p>Chọn tình trạng gần nhất để xem cách thợ xử lý.</p>
            <ul>
              {symptoms.map((s) => (
                <li key={s.slug}>
                  <Link href={`/dich-vu/${s.slug}/`}>
                    <span className="t-ico"><Icon name={s.slug} /></span>
                    <span className="t-label">{s.label}</span>
                    <Icon name="arrow" className="ico t-arrow" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="safety"><Icon name="warn" /> Đang kẹt giữa đường? Bật đèn khẩn cấp, đặt biển cảnh báo, đứng ra khỏi làn xe rồi mới gọi thợ.</p>
          </div>
        </div>
      </section>

      <section className="promises" aria-label="Cam kết dịch vụ">
        <div className="wrap promise-grid">
          {PROMISES.map((p) => (
            <div key={p.title} className="promise">
              <Icon name={p.icon} />
              <div><b>{p.title}</b><span>{p.text}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="block" id="dich-vu">
        <div className="wrap">
          <div className="sec-head">
            <p className="kicker">Dịch vụ</p>
            <h2>Làm ngay tại nơi xe đỗ</h2>
            <p className="sub">Chọn việc xe bạn cần. Mỗi trang có quy trình, câu hỏi thường gặp và cách đặt thợ.</p>
          </div>
          <div className="svc-grid">
            {services.map((s, i) => (
              <Link key={s.slug} className="svc" href={`/dich-vu/${s.slug}/`}>
                <span className="svc-ico"><Icon name={s.slug} /></span>
                <span className="svc-no">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.data.ten}</h3>
                <p>{s.data.tomTat}</p>
                <span className="more">Xem chi tiết <Icon name="arrow" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block why">
        <div className="wrap why-grid">
          <div>
            <p className="kicker">Vì sao tận nơi</p>
            <h2>Bạn ở yên, thợ tới</h2>
            <p className="sub">Không phải lái xe đang trục trặc ra đường, không phải ngồi chờ ở xưởng cả buổi.</p>
          </div>
          <ul className="why-list">
            <li>
              <b>Tiết kiệm nửa ngày</b>
              <span>Thợ làm ở hầm chung cư, sân nhà hay bãi đỗ công ty trong lúc bạn làm việc khác.</span>
            </li>
            <li>
              <b>An toàn hơn khi xe có lỗi</b>
              <span>Phanh kém, lốp xịt hay báo lỗi động cơ thì không nên cố chạy. Thợ tới kiểm tra trước, cần kéo thì kéo.</span>
            </li>
            <li>
              <b>Nhìn tận mắt từng bước</b>
              <span>Bạn đứng cạnh xe, thấy phụ tùng cũ và mới, hỏi trực tiếp người đang sửa.</span>
            </li>
            <li>
              <b>Có xưởng phía sau</b>
              <span>Việc không làm được tại chỗ, xe được kéo về {site.partnerWorkshop}, báo giá trước khi sửa.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="sec-head">
            <p className="kicker">Quy trình</p>
            <h2>Gọi thợ thế nào</h2>
          </div>
          <ol className="steps">
            <li><b>Gọi hoặc đặt lịch</b>Cho biết dòng xe, vị trí và tình trạng.</li>
            <li><b>Nhận báo giá</b>Thợ báo giá công và phụ tùng trước, bạn đồng ý mới làm.</li>
            <li><b>Thợ tới tận nơi</b>Xe van đủ đồ nghề, có lót ghế và thảm giữ sạch xe.</li>
            <li><b>Thanh toán, đánh giá</b>Chuyển khoản VietQR hoặc tiền mặt, có hoá đơn điện tử.</li>
          </ol>
        </div>
      </section>

      <section className="block area">
        <div className="wrap area-box">
          <div>
            <p className="kicker">Khu vực phục vụ</p>
            <h2><Icon name="pin" /> {site.city}</h2>
            <p className="sub">
              {site.serviceAreas.length
                ? "Đợt đầu thợ trực ở các quận dưới đây. Ở ngoài khu vực? Cứ gọi, chúng tôi báo bạn có tới được không."
                : "Danh sách quận đợt đầu sẽ cập nhật sớm. Cứ gọi, chúng tôi báo bạn có tới được không."}
            </p>
          </div>
          {site.serviceAreas.length > 0 && (
            <ul className="chips">{site.serviceAreas.map((a) => <li key={a}>{a}</li>)}</ul>
          )}
        </div>
      </section>

      <section className="block">
        <div className="wrap faq-grid">
          <div className="sec-head">
            <p className="kicker">Hỏi đáp</p>
            <h2>Trước khi gọi thợ</h2>
            <p className="sub">Câu khách hay hỏi nhất. Còn thắc mắc khác, gọi hoặc nhắn Zalo cho chúng tôi.</p>
          </div>
          <div className="faq">
            {FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </div>
      </section>

      {articles.length > 0 && (
        <section className="block">
          <div className="wrap">
            <div className="sec-head row">
              <div>
                <p className="kicker">Cẩm nang xe</p>
                <h2>Tự kiểm tra trước khi gọi</h2>
              </div>
              <Link className="link-more" href="/cam-nang/">Tất cả bài viết <Icon name="arrow" /></Link>
            </div>
            <div className="grid">
              {articles.map((a) => (
                <Link key={a.slug} className="card article" href={`/cam-nang/${a.slug}/`}>
                  {a.data.ngay && <time dateTime={String(a.data.ngay)}>{formatDate(a.data.ngay)}</time>}
                  <h3>{a.data.title}</h3>
                  <p>{a.data.description}</p>
                  <span className="more">Đọc bài <Icon name="arrow" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="final-cta">
        <div className="wrap">
          <h2>Xe đang có vấn đề?</h2>
          <p>Gọi thợ hoặc đặt lịch. Chúng tôi báo giá trước, bạn quyết định.</p>
          <div className="ctas">
            <CallButton />
            <ZaloButton />
            <Link className="btn btn-ghost" href="/dat-lich/">Đặt lịch</Link>
          </div>
        </div>
      </section>
    </>
  );
}
