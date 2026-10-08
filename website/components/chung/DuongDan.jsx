// Breadcrumb hiển thị + dữ liệu có cấu trúc BreadcrumbList. cap: [{ ten, href }], phần tử cuối là trang hiện tại.
import Link from "next/link";
import JsonLd from "../JsonLd";
import site from "@/site.config.mjs";
import s from "./DuongDan.module.css";

// toi: breadcrumb đặt trên nền tối (hero tối).
export default function DuongDan({ cap, an = false, toi = false }) {
  const day = [{ ten: "Trang chủ", href: "/" }, ...cap];
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: day.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.ten, item: `${site.url}${c.href}` })),
      }} />
      {!an && (
        <nav aria-label="Đường dẫn" className={`${s.dd} ${toi ? s.toi : ""}`}>
          <ol>
            {day.map((c, i) => (
              <li key={c.href}>
                {i < day.length - 1 ? <Link href={c.href}>{c.ten}</Link> : <span aria-current="page">{c.ten}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </>
  );
}
