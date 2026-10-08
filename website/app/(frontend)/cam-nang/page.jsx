import Link from "next/link";
import { formatDate, layDanhSachBai } from "../../../lib/cms";

export const metadata = { title: "Cẩm nang xe", description: "Hướng dẫn tự kiểm tra, bảo dưỡng và xử lý sự cố ô tô thường gặp.", alternates: { canonical: "/cam-nang/" } };

export default async function ArticleIndex() {
  const articles = await layDanhSachBai();
  return (
    <section className="block">
      <div className="wrap">
        <h2>Cẩm nang xe</h2>
        <p className="sub">{articles.length} bài hướng dẫn, mới nhất trước.</p>
        <div className="grid">
          {articles.map((a) => (
            <Link key={a.slug} className="card" href={`/cam-nang/${a.slug}/`}>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <span className="meta">{formatDate(a.ngay)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
