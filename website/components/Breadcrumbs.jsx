import Link from "next/link";
import site from "../site.config.mjs";
import JsonLd from "./JsonLd";

/** Đường dẫn "Trang chủ / ..." kèm dữ liệu BreadcrumbList để Google hiện đường dẫn đẹp trong kết quả tìm kiếm. */
export default function Breadcrumbs({ items }) {
  const all = [{ href: "/", label: "Trang chủ" }, ...items];
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href && { item: `${site.url}${c.href}` }) })),
      }} />
      <nav className="crumbs" aria-label="Đường dẫn">
        {all.map((c, i) => (
          <span key={c.label}>{i > 0 && <span aria-hidden="true">/</span>}{c.href && i < all.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>}</span>
        ))}
      </nav>
    </>
  );
}
