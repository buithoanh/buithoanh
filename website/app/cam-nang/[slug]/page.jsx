import Link from "next/link";
import { notFound } from "next/navigation";
import site from "../../../site.config.mjs";
import { slugsOf, readEntry, formatDate, isoDate } from "../../../lib/content.mjs";
import { CallButton } from "../../../components/Contact";
import Icon from "../../../components/Icon";
import JsonLd from "../../../components/JsonLd";
import Breadcrumbs from "../../../components/Breadcrumbs";
import Share from "../../../components/Share";
import Toc from "../../../components/Toc";

export const dynamicParams = false;
export function generateStaticParams() {
  return slugsOf("cam-nang").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = readEntry("cam-nang", slug);
  return {
    title: e.data.title, description: e.data.description, alternates: { canonical: `/cam-nang/${slug}/` },
    openGraph: { type: "article", title: e.data.title, description: e.data.description, publishedTime: isoDate(e.data.ngay) },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  if (!slugsOf("cam-nang").includes(slug)) notFound();
  const e = readEntry("cam-nang", slug);
  const services = (e.data.dichVuLienQuan || []).filter((s) => slugsOf("dich-vu").includes(s)).map((s) => readEntry("dich-vu", s));
  const faq = e.data.faq || [];
  const main = services[0];
  const toc = [...e.toc, ...(faq.length ? [{ id: "cau-hoi-thuong-gap", text: "Câu hỏi thường gặp" }] : [])];
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: e.data.title, description: e.data.description,
        datePublished: isoDate(e.data.ngay), dateModified: isoDate(e.data.capNhat || e.data.ngay), inLanguage: "vi",
        author: { "@type": "Organization", name: site.name }, publisher: { "@type": "Organization", name: site.name },
        mainEntityOfPage: `${site.url}/cam-nang/${slug}/`,
      }} />
      {faq.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}
      <section className="page-hero page-hero-article">
        <div className="wrap">
          <Breadcrumbs items={[{ href: "/cam-nang/", label: "Cẩm nang xe" }, { label: e.data.title }]} />
          {e.data.nhom && <span className="chip">{e.data.nhom}</span>}
          <h1>{e.data.title}</h1>
          <p className="meta"><Icon name="calendar" size={16} />{formatDate(e.data.ngay)}<span>·</span><Icon name="clock" size={16} />khoảng {Math.max(1, Math.round(e.words / 220))} phút đọc</p>
          <Share title={e.data.title} url={`${site.url}/cam-nang/${slug}/`} />
        </div>
      </section>
      <div className="wrap with-aside">
        <article className="prose">
          <Toc items={toc} />
          <div dangerouslySetInnerHTML={{ __html: e.html }} />
          {faq.length > 0 && (
            <section className="faq">
              <h2 id="cau-hoi-thuong-gap">Câu hỏi thường gặp</h2>
              {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </section>
          )}
          <div className="cta-box">
            <div><b>Không muốn tự xử lý?</b><p>Thợ tới tận nơi, báo giá trước khi làm.</p></div>
            <CallButton />
          </div>
        </article>
        <aside className="aside">
          <div className="aside-card aside-card-static">
            <b className="aside-title">Cần thợ tới tận nơi?</b>
            <p className="aside-sub">Đặt lịch hoặc gọi, thợ mang đồ nghề và phụ tùng tới.</p>
            <Link className="btn btn-primary btn-block" href={main ? `/dat-lich/?dv=${main.slug}` : "/dat-lich/"}><Icon name="calendar" size={20} />Đặt lịch</Link>
            <CallButton className="btn btn-outline btn-block" label="Gọi thợ ngay" />
            {services.length > 0 && (
              <>
                <p className="aside-label">Dịch vụ liên quan</p>
                {services.map((s) => (
                  <Link key={s.slug} className="mini" href={`/dich-vu/${s.slug}/`}><span className="mini-ic"><Icon name={s.data.icon} size={22} /></span>{s.data.ten}</Link>
                ))}
              </>
            )}
          </div>
          <Toc items={toc} variant="side" />
        </aside>
      </div>
    </>
  );
}
