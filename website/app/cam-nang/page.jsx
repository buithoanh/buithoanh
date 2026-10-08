import Link from "next/link";
import { sortedArticles, formatDate } from "../../lib/content.mjs";

export const metadata = { title: "Cẩm nang xe", description: "Hướng dẫn tự kiểm tra, bảo dưỡng và xử lý sự cố ô tô thường gặp.", alternates: { canonical: "/cam-nang/" } };

export default function ArticleIndex() {
  const articles = sortedArticles();
  return (
    <section className="block">
      <div className="wrap">
        <h2>Cẩm nang xe</h2>
        <p className="sub">{articles.length} bài hướng dẫn, mới nhất trước.</p>
        <div className="grid">
          {articles.map((a) => (
            <Link key={a.slug} className="card" href={`/cam-nang/${a.slug}/`}>
              <h3>{a.data.title}</h3>
              <p>{a.data.description}</p>
              <span className="meta">{formatDate(a.data.ngay)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
