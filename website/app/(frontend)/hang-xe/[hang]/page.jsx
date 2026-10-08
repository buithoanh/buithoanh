// Trang hãng xe, bản tối thiểu nối dữ liệu; frontend dựng lại theo màn `HangXe`. Chỉ có trang khi đã viết và đăng.
import Link from "next/link";
import { notFound } from "next/navigation";
import { cheDoNhap, layPayload, laySite } from "../../../../lib/cms";
import { layTrangHangXe } from "../../../../lib/cong-khai";
import { CallButton } from "../../../../components/Contact";

async function lay(params) {
  const { hang } = await params;
  const t = await layTrangHangXe(await layPayload(), hang, { draft: await cheDoNhap() });
  return t?.noiDung ? t : null;
}

export async function generateMetadata({ params }) {
  const t = await lay(params);
  if (!t) return {};
  return { title: t.noiDung.title, description: t.noiDung.description, alternates: { canonical: `/hang-xe/${t.hang.slug}/` } };
}

export default async function TrangHangXe({ params }) {
  const [t, site] = await Promise.all([lay(params), laySite()]);
  if (!t) notFound();
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link> / <span aria-current="page">{t.hang.ten}</span></nav>
          <h1>{t.noiDung.title}</h1>
          <div className="ctas"><CallButton hotline={site.hotline} className="btn btn-primary btn-lg" /></div>
        </div>
      </section>
      <div className="wrap page-body">
        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: t.noiDung.html }} />
          {t.benhHayGap.length > 0 && (
            <>
              <h2>Bệnh hay gặp</h2>
              {t.benhHayGap.map((b) => <section key={b.tieuDe}><h3>{b.tieuDe}</h3><p>{b.moTa}</p></section>)}
            </>
          )}
          <h2>Dòng xe</h2>
          <ul>{t.hang.dong.map((d) => <li key={d.slug}>{d.ten}</li>)}</ul>
        </article>
      </div>
    </>
  );
}
