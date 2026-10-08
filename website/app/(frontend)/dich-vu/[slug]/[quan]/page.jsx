// Trang khu vực (dịch vụ × quận), bản tối thiểu nối dữ liệu; frontend dựng lại theo màn `KhuVuc`.
// Chỉ có trang khi đã viết và đăng trang khu vực (tránh trang mỏng giống nhau giữa các quận).
import Link from "next/link";
import { notFound } from "next/navigation";
import { cheDoNhap, layPayload, laySite } from "../../../../../lib/cms";
import { layTrangKhuVuc } from "../../../../../lib/cong-khai";
import { CallButton } from "../../../../../components/Contact";
import JsonLd from "../../../../../components/JsonLd";

async function lay(params) {
  const { slug, quan } = await params;
  const t = await layTrangKhuVuc(await layPayload(), slug, quan, { draft: await cheDoNhap() });
  return t?.noiDung ? t : null;
}

export async function generateMetadata({ params }) {
  const t = await lay(params);
  if (!t) return {};
  return { title: t.noiDung.title, description: t.noiDung.description, alternates: { canonical: `/dich-vu/${t.dichVu.slug}/${t.quan.slug}/` } };
}

export default async function TrangKhuVuc({ params }) {
  const [t, site] = await Promise.all([lay(params), laySite()]);
  if (!t) notFound();
  const n = t.noiDung;
  return (
    <>
      {n.faq.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: n.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link> / <Link href={`/dich-vu/${t.dichVu.slug}/`}>{t.dichVu.ten}</Link> / <span aria-current="page">{t.quan.ten}</span>
          </nav>
          <h1>{n.title}</h1>
          <p className="lead">Thợ tới {t.quan.ten} trong {t.quan.etaTu}–{t.quan.etaDen} phút.</p>
          <div className="ctas">
            <CallButton hotline={site.hotline} className="btn btn-primary btn-lg" />
            <Link className="btn btn-light btn-lg" href={`/dat-lich/?dv=${t.dichVu.slug}`}>Đặt lịch</Link>
          </div>
        </div>
      </section>
      <div className="wrap page-body">
        <article className="prose">
          {n.doanRieng && <p>{n.doanRieng}</p>}
          <div dangerouslySetInnerHTML={{ __html: n.html }} />
          {n.anhThat.map((a) => <img key={a.url} src={a.url} alt={a.alt || ""} width={a.width} height={a.height} loading="lazy" />)}
          {t.phuongDangPhucVu.length > 0 && <p>Phường đang phục vụ: {t.phuongDangPhucVu.join(", ")}.</p>}
          <h2>Giá</h2>
          <ul>{t.bangGia.map((h) => <li key={h.ten}>{h.ten}: {h.giaHienThi}</li>)}</ul>
          {t.danhGia.length > 0 && (
            <>
              <h2>Khách ở {t.quan.ten} nói gì</h2>
              {t.danhGia.map((d) => <blockquote key={d.noiDung}><p>{d.noiDung}</p><footer>{d.tenHienThi}, {d.soSao}★</footer></blockquote>)}
            </>
          )}
          {n.faq.length > 0 && (
            <section className="faq">
              <h2>Câu hỏi thường gặp</h2>
              {n.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </section>
          )}
        </article>
      </div>
    </>
  );
}
