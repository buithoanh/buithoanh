import site from "../site.config.mjs";
import { slugsOf, readEntry, isoDate } from "../lib/content.mjs";

export const dynamic = "force-static";

export default function sitemap() {
  const u = (p) => `${site.url}${p}`;
  return [
    { url: u("/"), changeFrequency: "weekly", priority: 1 },
    { url: u("/dat-lich/"), priority: 0.8 },
    { url: u("/cam-nang/"), changeFrequency: "weekly", priority: 0.7 },
    ...slugsOf("dich-vu").map((s) => ({ url: u(`/dich-vu/${s}/`), priority: 0.9 })),
    ...slugsOf("cam-nang").map((s) => {
      const d = readEntry("cam-nang", s).data;
      return { url: u(`/cam-nang/${s}/`), lastModified: isoDate(d.capNhat || d.ngay), priority: 0.6 };
    }),
  ];
}
