import Link from "next/link";
import { notFound } from "next/navigation";
import { demChuHtml, formatDate, isoDate, layBai, laySite, sangHtmlDayDu } from "@/lib/cms";
import { CallButton, ZaloButton } from "@/components/Contact";
import JsonLd from "@/components/JsonLd";
import Icon, { iconDichVu } from "@/components/Icon";
import { anhDichVu } from "@/components/anh";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = await layBai(slug);
  if (!e) return {};
  return {
    title: e.title, description: e.description, alternates: { canonical: `/cam-nang/${slug}/` },
    openGraph: { type: "article", title: e.title, description: e.description, publishedTime: isoDate(e.ngay) },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const [e, site] = await Promise.all([layBai(slug), laySite()]);
  if (!e) notFound();
  const html = await sangHtmlDayDu(e.noiDung);
  const services = (e.dichVuLienQuan || []).filter((s) => typeof s === "object" && s?.slug);
  const faq = e.faq || [];
  const anh = services.length ? anhDichVu(services[0].slug) : null;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: e.title, description: e.description,
        datePublished: isoDate(e.ngay), dateModified: isoDate(e.capNhat || e.ngay), inLanguage: "vi",
        author: { "@type": "Organization", name: site.name }, publisher: { "@type": "Organization", name: site.name },
        mainEntityOfPage: `${site.url}/cam-nang/${slug}/`,
      }} />
      {faq.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}

      <section className="page-hero page-hero-article">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link> / <Link href="/cam-nang/">Cẩm nang xe</Link></nav>
          <div className={anh ? "page-hero-grid" : undefined}>
            <div>
              {e.nhom && <p className="eyebrow"><Icon name="book" size={16} /> {e.nhom}</p>}
              <h1>{e.title}</h1>
              <p className="meta">{site.name} · {formatDate(e.ngay)} · khoảng {Math.max(1, Math.round(demChuHtml(html) / 220))} phút đọc</p>
            </div>
            {anh && (
              <figure className="hero-art hero-art-sm">
                <img src={anh.src} alt={anh.alt} width={anh.width} height={anh.height} decoding="async" />
              </figure>
            )}
          </div>
        </div>
      </section>

      <div className="wrap page-body">
        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: html }} />
          {faq.length > 0 && (
            <section className="faq">
              <h2>Câu hỏi thường gặp</h2>
              {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </section>
          )}
          <div className="cta-box"><p>Không muốn tự xử lý? Thợ tới tận nơi.</p><CallButton hotline={site.hotline} /></div>
          {services.length > 0 && (
            <>
              <h2>Dịch vụ liên quan</h2>
              <ul>{services.map((s) => <li key={s.slug}><Link href={`/dich-vu/${s.slug}/`}>{s.ten}</Link></li>)}</ul>
            </>
          )}
        </article>
        <aside className="side" aria-label="Gọi thợ">
          <div className="side-card side-call">
            <p className="side-title">Không muốn tự xử lý?</p>
            <p>Thợ {site.name} tới tận nơi xe đang đỗ, báo giá trước khi làm.</p>
            <CallButton hotline={site.hotline} className="btn btn-primary btn-block" />
            <ZaloButton zalo={site.zalo} className="btn btn-zalo btn-block" />
          </div>
          {services.length > 0 && (
            <div className="side-card">
              <p className="side-title">Dịch vụ liên quan</p>
              <ul className="side-links">
                {services.map((s) => (
                  <li key={s.slug}><Link href={`/dich-vu/${s.slug}/`}><Icon name={iconDichVu[s.slug] || "wrench"} size={18} />{s.ten}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
