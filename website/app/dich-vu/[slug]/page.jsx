import Link from "next/link";
import { notFound } from "next/navigation";
import site from "../../../site.config.mjs";
import { slugsOf, readEntry, allEntries, sortedServices, approvedPrice } from "../../../lib/content.mjs";
import { CallButton, Commitments } from "../../../components/Contact";
import Icon from "../../../components/Icon";
import JsonLd from "../../../components/JsonLd";

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
  const others = sortedServices().filter((s) => s.slug !== slug);
  const faq = e.data.faq || [];
  const price = approvedPrice(e.data);
  const book = `/dat-lich/?dv=${slug}`;
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
          <nav className="crumbs" aria-label="Đường dẫn"><Link href="/">Trang chủ</Link><span>/</span><Link href="/#dich-vu">Dịch vụ</Link><span>/</span>{e.data.ten}</nav>
          <div className="svc-hero">
            <span className="svc-hero-ic"><Icon name={e.data.icon} size={40} /></span>
            <div>
              <h1>{e.data.title}</h1>
              <p className="lead">{e.data.tomTat}</p>
              <div className="ctas">
                <Link className="btn btn-primary btn-lg" href={book}><Icon name="calendar" size={20} />Đặt thợ {e.data.tenNgan?.toLowerCase() || ""}</Link>
                <CallButton className="btn btn-outline btn-lg" label={`Gọi ${site.hotline}`} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="wrap with-aside">
        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: e.html }} />
          {faq.length > 0 && (
            <section className="faq">
              <h2>Câu hỏi thường gặp</h2>
              {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </section>
          )}
          {related.length > 0 && (
            <section>
              <h2>Bài liên quan</h2>
              <ul className="link-list">{related.map((a) => <li key={a.slug}><Link href={`/cam-nang/${a.slug}/`}><Icon name="book" size={20} />{a.data.title}</Link></li>)}</ul>
            </section>
          )}
        </article>
        <aside className="aside">
          <div className="aside-card">
            <span className="aside-ic"><Icon name={e.data.icon} size={26} /></span>
            <b className="aside-title">{e.data.ten}</b>
            <p className="aside-price">{price ? <>Từ <b>{price}</b></> : "Báo giá trước khi làm"}</p>
            <Link className="btn btn-primary btn-block" href={book}><Icon name="calendar" size={20} />Đặt lịch</Link>
            <CallButton className="btn btn-outline btn-block" label="Gọi thợ ngay" />
            <Commitments variant="compact" />
          </div>
        </aside>
      </div>
      <section className="block">
        <div className="wrap">
          <div className="sec-head"><div><p className="kicker">Dịch vụ khác</p><h2>Thợ còn làm được</h2></div></div>
          <div className="mini-grid">
            {others.map((s) => (
              <Link key={s.slug} className="mini" href={`/dich-vu/${s.slug}/`}><span className="mini-ic"><Icon name={s.data.icon} size={22} /></span>{s.data.ten}</Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
