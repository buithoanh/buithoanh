import site from "../site.config.mjs";

export const dynamic = "force-static";

export default function robots() {
  if (!site.allowIndex) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/quan-tri/", "/api/"] }, sitemap: `${site.url}/sitemap.xml` };
}
