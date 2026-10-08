import site from "../site.config.mjs";
import { isoDate, layDanhSachBai, layDanhSachDichVu, layDanhSachTrangHangXe, layDanhSachTrangKhuVuc } from "../lib/cms";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const u = (p) => `${site.url}${p}`;
  const [dichVu, baiViet, khuVuc, hangXe] = await Promise.all([layDanhSachDichVu(), layDanhSachBai(), layDanhSachTrangKhuVuc(), layDanhSachTrangHangXe()]);
  return [
    { url: u("/"), changeFrequency: "weekly", priority: 1 },
    { url: u("/dat-lich/"), priority: 0.8 },
    { url: u("/cam-nang/"), changeFrequency: "weekly", priority: 0.7 },
    ...dichVu.map((s) => ({ url: u(`/dich-vu/${s.slug}/`), priority: 0.9 })),
    ...baiViet.map((a) => ({ url: u(`/cam-nang/${a.slug}/`), lastModified: isoDate(a.capNhat || a.ngay), priority: 0.6 })),
    ...khuVuc.map((t) => ({ url: u(t.duongDan), lastModified: isoDate(t.capNhat), priority: 0.7 })),
    ...hangXe.map((t) => ({ url: u(t.duongDan), lastModified: isoDate(t.capNhat), priority: 0.6 })),
  ];
}
