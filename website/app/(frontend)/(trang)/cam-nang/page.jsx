import Link from "next/link";
import { formatDate, layDanhSachBai } from "@/lib/cms";
import Icon from "@/components/Icon";

export const metadata = { title: "Cẩm nang xe", description: "Hướng dẫn tự kiểm tra, bảo dưỡng và xử lý sự cố ô tô thường gặp.", alternates: { canonical: "/cam-nang/" } };

export default async function ArticleIndex() {
  const articles = await layDanhSachBai();
  return (
    <>
      <section className="page-hero page-hero-compact">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link> / <span aria-current="page">Cẩm nang xe</span></nav>
          <h1>Cẩm nang xe</h1>
          <p className="lead">Hướng dẫn tự kiểm tra và xử lý những sự cố hay gặp. {articles.length} bài, mới nhất trước.</p>
        </div>
      </section>
      <section className="block">
        <div className="wrap">
          <div className="grid">
            {articles.map((a) => (
              <Link key={a.slug} className="card card-article" href={`/cam-nang/${a.slug}/`}>
                {a.nhom && <span className="tag">{a.nhom}</span>}
                <h2 className="card-title">{a.title}</h2>
                <p>{a.description}</p>
                <span className="card-foot"><span className="meta">{formatDate(a.ngay)}</span><span className="more">Đọc bài <Icon name="arrow" size={16} /></span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
