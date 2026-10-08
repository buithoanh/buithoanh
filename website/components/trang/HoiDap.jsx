// Câu hỏi thường gặp dạng <details> (mở được khi tắt JavaScript), kèm dữ liệu có cấu trúc FAQPage nếu jsonLd = true.
// faq: [{ q, a }] (trường faq của trang dịch vụ / khu vực / hãng xe trong CMS).
import JsonLd from "../JsonLd";
import s from "./HoiDap.module.css";

export default function HoiDap({ faq, tieuDe = "Câu hỏi thường gặp", id = "hoi-dap", jsonLd = true, nho = false }) {
  if (!faq?.length) return null;
  return (
    <section className={`khoi ${s.khoi}`} aria-labelledby={id}>
      {jsonLd ? (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }} />
      ) : null}
      <h2 id={id} className={nho ? s.nho : undefined}>{tieuDe}</h2>
      <div className={s.ds}>
        {faq.map((f, i) => (
          <details key={i} className={s.cau}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
