import Link from "next/link";
import { notFound } from "next/navigation";
import site from "../../../site.config.mjs";
import { slugsOf, readEntry, allEntries } from "../../../lib/content.mjs";
import { CallButton, ZaloButton } from "../../../components/Contact";
import JsonLd from "../../../components/JsonLd";
import Icon, { iconDichVu } from "../../../components/Icon";
import { anhDichVu } from "../../../components/anh";

export const dynamicParams = false;
export function generateStaticParams() {
  return slugsOf("dich-vu").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = readEntry("dich-vu", slug);
  return { title: e.data.title, description: e.data.description, alternates: { canonical: `/dich-vu/${slug}/` } };
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  if (!slugsOf("dich-vu").includes(slug)) notFound();
  const e = readEntry("dich-vu", slug);
  const related = allEntries("cam-nang").filter((a) => (a.data.dichVuLienQuan || []).includes(slug));
  const others = allEntries("dich-vu").filter((s) => s.slug !== slug).sort((a, b) => (a.data.thuTu ?? 99) - (b.data.thuTu ?? 99));
  const faq = e.data.faq || [];
  const anh = anhDichVu(slug);
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: e.data.ten, serviceType: e.data.ten,
        description: e.data.description, areaServed: site.city,
        provider: { "@type": "AutoRepair", name: site.name, url: site.url },
      }} />
      {faq.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}

      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link> / <Link href="/#dich-vu">Dịch vụ</Link> / <span aria-current="page">{e.data.ten}</span></nav>
          <div className="page-hero-grid">
            <div>
              <p className="eyebrow"><Icon name={iconDichVu[slug] || "wrench"} size={16} /> {e.data.ten} tận nơi · {site.city}</p>
              <h1>{e.data.title}</h1>
              {e.data.tomTat && <p className="lead">{e.data.tomTat}</p>}
              <div className="ctas">
                <CallButton className="btn btn-primary btn-lg" />
                <Link className="btn btn-light btn-lg" href="/dat-lich/"><Icon name="calendar" /><span>Đặt lịch</span></Link>
              </div>
              <ul className="facts facts-sm">
                <li><Icon name="check" size={18} />Báo giá trước khi làm</li>
                <li><Icon name="check" size={18} />Thợ tới nơi xe đang đỗ</li>
              </ul>
            </div>
            <figure className="hero-art">
              <img src={anh.src} alt={anh.alt} width={anh.width} height={anh.height} fetchPriority="high" decoding="async" />
            </figure>
          </div>
        </div>
      </section>

      <div className="wrap page-body">
        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: e.html }} />
          {faq.length > 0 && (
            <section className="faq">
              <h2>Câu hỏi thường gặp</h2>
              {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </section>
          )}
          <div className="cta-box"><p>Cần thợ {e.data.ten.toLowerCase()} ngay?</p><CallButton /></div>
          {related.length > 0 && (
            <>
              <h2>Bài liên quan</h2>
              <ul>{related.map((a) => <li key={a.slug}><Link href={`/cam-nang/${a.slug}/`}>{a.data.title}</Link></li>)}</ul>
            </>
          )}
        </article>
        <aside className="side" aria-label="Gọi thợ và dịch vụ khác">
          <div className="side-card side-call">
            <p className="side-title">Xe đang gặp sự cố?</p>
            <p>Cho biết dòng xe, vị trí và tình trạng. Thợ báo giá trước, bạn đồng ý mới làm.</p>
            <CallButton className="btn btn-primary btn-block" />
            <ZaloButton className="btn btn-zalo btn-block" />
            <Link className="btn btn-outline btn-block" href="/dat-lich/"><Icon name="calendar" /><span>Đặt lịch</span></Link>
          </div>
          <div className="side-card">
            <p className="side-title">Dịch vụ khác</p>
            <ul className="side-links">
              {others.map((s) => (
                <li key={s.slug}><Link href={`/dich-vu/${s.slug}/`}><Icon name={iconDichVu[s.slug] || "wrench"} size={18} />{s.data.ten}</Link></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
