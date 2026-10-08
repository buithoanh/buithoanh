import site from "../site.config.mjs";

export default function robots() {
  if (!site.allowIndex) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/xem-truoc/", "/quan-tri/", "/don/", "/hoi-vien/thanh-toan/", "/gioi-thieu/"] }, sitemap: `${site.url}/sitemap.xml` };
}
