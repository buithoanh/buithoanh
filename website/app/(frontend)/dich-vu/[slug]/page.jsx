import Link from "next/link";
import { notFound } from "next/navigation";
import { layDanhSachBai, layDichVu, laySite, sangHtml } from "../../../../lib/cms";
import { CallButton } from "../../../../components/Contact";
import JsonLd from "../../../../components/JsonLd";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = await layDichVu(slug);
  if (!e) return {};
  return { title: e.title, description: e.description, alternates: { canonical: `/dich-vu/${slug}/` } };
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const [e, site, baiViet] = await Promise.all([layDichVu(slug), laySite(), layDanhSachBai()]);
  if (!e) notFound();
  const related = baiViet.filter((a) => (a.dichVuLienQuan || []).includes(e.id));
  const faq = e.faq || [];
  return (
    <div className="wrap">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: e.ten, serviceType: e.ten,
        description: e.description, areaServed: site.city,
        provider: { "@type": "AutoRepair", name: site.name, url: site.url },
      }} />
      {faq.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}
      <nav className="crumbs"><Link href="/">Trang chủ</Link> / <Link href="/#dich-vu">Dịch vụ</Link> / {e.ten}</nav>
      <article className="prose">
        <h1>{e.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: sangHtml(e.noiDung) }} />
        {faq.length > 0 && (
          <section className="faq">
            <h2>Câu hỏi thường gặp</h2>
            {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </section>
        )}
        <div className="cta-box"><p>Cần thợ {e.ten.toLowerCase()} ngay?</p><CallButton hotline={site.hotline} /></div>
        {related.length > 0 && (
          <>
            <h2>Bài liên quan</h2>
            <ul>{related.map((a) => <li key={a.slug}><Link href={`/cam-nang/${a.slug}/`}>{a.title}</Link></li>)}</ul>
          </>
        )}
      </article>
    </div>
  );
}
