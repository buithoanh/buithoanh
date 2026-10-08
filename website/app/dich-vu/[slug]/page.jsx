import Link from "next/link";
import { notFound } from "next/navigation";
import site from "../../../site.config.mjs";
import { slugsOf, readEntry, allEntries } from "../../../lib/content.mjs";
import { CallButton } from "../../../components/Contact";
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
  const faq = e.data.faq || [];
  return (
    <div className="wrap">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: e.data.ten, serviceType: e.data.ten,
        description: e.data.description, areaServed: site.city,
        provider: { "@type": "AutoRepair", name: site.name, url: site.url },
      }} />
      {faq.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}
      <nav className="crumbs"><Link href="/">Trang chủ</Link> / <Link href="/#dich-vu">Dịch vụ</Link> / {e.data.ten}</nav>
      <article className="prose">
        <h1>{e.data.title}</h1>
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
    </div>
  );
}
