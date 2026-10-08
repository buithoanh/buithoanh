import Link from "next/link";
import { notFound } from "next/navigation";
import { demChuHtml, formatDate, isoDate, layBai, laySite, sangHtml } from "../../../../lib/cms";
import { CallButton } from "../../../../components/Contact";
import JsonLd from "../../../../components/JsonLd";

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
  const html = sangHtml(e.noiDung);
  const services = (e.dichVuLienQuan || []).filter((s) => typeof s === "object" && s?.slug);
  const faq = e.faq || [];
  return (
    <div className="wrap">
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
      <nav className="crumbs"><Link href="/">Trang chủ</Link> / <Link href="/cam-nang/">Cẩm nang xe</Link></nav>
      <article className="prose">
        <h1>{e.title}</h1>
        <div className="meta">{site.name} · {formatDate(e.ngay)} · khoảng {Math.max(1, Math.round(demChuHtml(html) / 220))} phút đọc</div>
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
    </div>
  );
}
