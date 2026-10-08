// Trang dịch vụ × khu vực (thiết kế KhuVuc). Chỉ có khi trang khu vực đã viết và đăng (tránh trang mỏng giống nhau),
// không thì 404. Giá lấy cùng bảng giá chung với trang dịch vụ.
import Link from "next/link";
import { notFound } from "next/navigation";
import site from "@/site.config.mjs";
import { cheDoNhap, layDanhSachTrangKhuVuc, layPayload } from "@/lib/cms";
import { layTrangKhuVuc } from "@/lib/cong-khai";
import JsonLd from "@/components/JsonLd";
import DuongDan from "@/components/chung/DuongDan";
import KhungAnh from "@/components/chung/KhungAnh";
import { TheDanhGia } from "@/components/chung/DanhGiaKhach";
import BangGiaHangMuc from "@/components/trang/BangGiaHangMuc";
import HoiDap from "@/components/trang/HoiDap";
import NoiDungCms from "@/components/trang/NoiDungCms";
import { BanDoVung } from "@/components/trang/KhoiVungPhucVu";
import s from "./khu-vuc.module.css";

async function lay(params) {
  const { slug, quan } = await params;
  const t = await layTrangKhuVuc(await layPayload(), slug, quan, { draft: await cheDoNhap() });
  return t?.noiDung ? t : null;
}

export async function generateMetadata({ params }) {
  const t = await lay(params);
  if (!t) return {};
  const url = `/dich-vu/${t.dichVu.slug}/${t.quan.slug}/`;
  return { title: t.noiDung.title, description: t.noiDung.description, alternates: { canonical: url }, openGraph: { title: t.noiDung.title, description: t.noiDung.description, url } };
}

export default async function TrangKhuVuc({ params }) {
  const t = await lay(params);
  if (!t) notFound();
  const { dichVu: dv, quan, noiDung: n } = t;
  const daDang = new Set((await layDanhSachTrangKhuVuc()).map((k) => k.duongDan));
  const url = `/dich-vu/${dv.slug}/${quan.slug}/`;
  const anh = n.anhThat.length ? n.anhThat : [null, null];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: n.title, serviceType: dv.ten, description: n.description,
        url: `${site.url}${url}`,
        areaServed: { "@type": "AdministrativeArea", name: `${quan.ten}, ${site.city}` },
        provider: { "@type": "AutoRepair", name: site.name, url: `${site.url}/`, ...(t.lienHe.hotline && { telephone: t.lienHe.hotline }) },
      }} />
      <div className={`wrap ${s.trang}`}>
        <DuongDan cap={[{ ten: dv.ten, href: `/dich-vu/${dv.slug}/` }, { ten: quan.ten, href: url }]} />

        <div className={s.luoi}>
          <section className={s.dau}>
            <h1 className={s.tieuDe}>{n.title}</h1>
            {quan.etaTu ? (
              <div className={s.eta}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                <div><span>Thợ đến {quan.ten} dự kiến</span><b>{quan.etaTu}–{quan.etaDen} phút</b></div>
              </div>
            ) : null}
            {n.doanRieng ? <p className={s.doanRieng}>{n.doanRieng}</p> : null}
            <Link href={`/dat-lich/?dv=${dv.slug}`} className={`nut nut-chinh nut-lon ${s.nutDat}`}>Đặt thợ tới {quan.ten}</Link>
          </section>

          <div className={s.cotPhai}>
            <section className={`khoi ${s.giua}`} aria-labelledby="gia-kv">
              <h2 id="gia-kv">Giá tại {quan.ten}</h2>
              <BangGiaHangMuc hangMuc={t.bangGia} tieuDe={`Giá ${dv.ten} tại ${quan.ten}`} />
              <p className="phu nho">Cùng một bảng giá với trang {dv.ten.toLowerCase()} và mọi trang trên website. Giá chính thức chốt sau khi thợ kiểm tra xe.</p>
            </section>
          </div>

          <div className={s.cotTrai}>
            <section className={`khoi ${s.som}`} aria-labelledby="viec-da-lam">
              <h2 id="viec-da-lam">Việc thợ đã làm ở {quan.ten}</h2>
              <div className={s.anh}>
                {anh.map((a, i) => <KhungAnh key={a?.url || i} anh={a} tiLe="1 / 1" alt={a?.alt || `Thợ làm ${dv.ten.toLowerCase()} ở ${quan.ten}`} />)}
              </div>
            </section>

            {t.danhGia.length ? (
              <section className={`khoi ${s.som}`} aria-labelledby="danh-gia-kv">
                <h2 id="danh-gia-kv">Khách ở {quan.ten} đánh giá</h2>
                <div className={s.danhGia}>
                  {t.danhGia.slice(0, 3).map((d, i) => <TheDanhGia key={i} dg={d.phuong ? { ...d, quan: { ten: d.phuong } } : d} />)}
                </div>
              </section>
            ) : null}

            {n.html ? <div className={s.noiDung}><NoiDungCms html={n.html} /></div> : null}

            <section className="khoi" aria-labelledby="phuong-kv">
              <h2 id="phuong-kv">Phường đang phục vụ</h2>
              {t.phuongDangPhucVu.length ? <p className="phu">{t.phuongDangPhucVu.join(", ")}</p> : <p className="phu">Toàn bộ {quan.ten}.</p>}
              <BanDoVung vung={{ quan: [quan] }} thanhPho={site.city} nhanBanDo={`Ranh giới ${quan.ten}`} cao="thap" />
            </section>

            <HoiDap faq={n.faq} />

            {t.dichVuKhac.length ? (
              <section className="khoi" aria-labelledby="dv-khac">
                <h2 id="dv-khac">Dịch vụ khác ở {quan.ten}</h2>
                <ul className={s.dsKhac}>
                  {t.dichVuKhac.map((d) => {
                    const href = `/dich-vu/${d.slug}/${quan.slug}/`;
                    const co = daDang.has(href);
                    return (
                      <li key={d.slug}>
                        <Link href={co ? href : `/dich-vu/${d.slug}/`}>{co ? `${d.ten} ${quan.ten}` : d.ten}<span aria-hidden="true">→</span></Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
