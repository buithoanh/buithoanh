/** Mục lục bài viết. Điện thoại: hộp thu gọn đầu bài. Máy tính: cột phải, bám theo khi cuộn. */
export default function Toc({ items, variant }) {
  if (items.length < 3) return null;
  const list = <ol>{items.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>;
  if (variant === "side") return <nav className="toc toc-side" aria-label="Mục lục"><p className="aside-label">Trong bài này</p>{list}</nav>;
  return <details className="toc toc-inline"><summary>Mục lục ({items.length} phần)</summary>{list}</details>;
}
