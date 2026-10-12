import Icon from "./Icon";

function Stars({ n }) {
  return <span className="stars" role="img" aria-label={`${n} trên 5 sao`}>{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= n ? "on" : ""} aria-hidden="true">★</span>)}</span>;
}

/** Thẻ đánh giá của khách. Không xuất dữ liệu cấu trúc AggregateRating: chỉ thêm khi có đánh giá thật, kiểm chứng được. */
export default function Reviews({ items, serviceNames = {} }) {
  return (
    <div className="rv-grid" role="region" aria-label="Đánh giá của khách" tabIndex={0}>
      {items.map((r) => (
        <figure key={r.ten + r.ngay} className="rv">
          <Stars n={r.sao} />
          <blockquote>{r.noiDung}</blockquote>
          <figcaption>
            <span className="rv-av" aria-hidden="true">{r.ten.split(" ").pop()[0]}</span>
            <span><b>{r.ten}</b><small>{[r.xe, r.khuVuc].filter(Boolean).join(" · ")}</small></span>
          </figcaption>
          {serviceNames[r.dichVu] && <span className="rv-svc"><Icon name="check" size={14} />{serviceNames[r.dichVu]} · {r.ngay}</span>}
        </figure>
      ))}
    </div>
  );
}

export { Stars };
