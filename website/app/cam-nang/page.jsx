import { sortedArticles, formatDate } from "../../lib/content.mjs";
import ArticleFilter from "./ArticleFilter";

export const metadata = { title: "Cẩm nang xe", description: "Hướng dẫn tự kiểm tra, bảo dưỡng và xử lý sự cố ô tô thường gặp.", alternates: { canonical: "/cam-nang/" } };

export default function ArticleIndex() {
  const articles = sortedArticles().map((a) => ({ slug: a.slug, title: a.data.title, description: a.data.description, nhom: a.data.nhom || "Khác", ngay: formatDate(a.data.ngay) }));
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Cẩm nang xe</p>
          <h1>Xe bị … thì phải làm gì?</h1>
          <p className="lead">Hướng dẫn tự kiểm tra và xử lý sự cố hay gặp, viết bởi thợ đi sửa hằng ngày. {articles.length} bài, mới nhất trước.</p>
        </div>
      </section>
      <section className="block">
        <div className="wrap"><ArticleFilter articles={articles} /></div>
      </section>
    </>
  );
}
