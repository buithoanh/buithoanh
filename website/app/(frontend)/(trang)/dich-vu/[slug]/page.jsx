// Trang dịch vụ (thiết kế DichVu): nội dung từ CMS (Trang dịch vụ), giá từ bảng giá chung, xem giá theo xe, FAQ, khu vực.
import Link from "next/link";
import { notFound } from "next/navigation";
import site from "@/site.config.mjs";
import { cheDoNhap, layDanhSachTrangKhuVuc, layPayload } from "@/lib/cms";
import { noiDungHtml } from "@/lib/noi-dung";
import { layTrangDichVu } from "@/lib/cong-khai";
import JsonLd from "@/components/JsonLd";
import DuongDan from "@/components/chung/DuongDan";
import KhungAnh from "@/components/chung/KhungAnh";
import DanhGiaKhach from "@/components/chung/DanhGiaKhach";
import BangGiaHangMuc from "@/components/trang/BangGiaHangMuc";
import HoiDap from "@/components/trang/HoiDap";
import XemGiaXe from "@/components/trang/XemGiaXe";
import NoiDungCms from "@/components/trang/NoiDungCms";
import s from "./dich-vu.module.css";

async function lay(params) {
  const { slug } = await params;
  const t = await layTrangDichVu(await layPayload(), slug, { draft: await cheDoNhap() });
  return t?.trang ? t : null;
}

export async function generateMetadata({ params }) {
  const t = await lay(params);
  if (!t) return {};
  return {
    title: t.trang.title, description: t.trang.description,
    alternates: { canonical: `/dich-vu/${t.dichVu.slug}/` },
    openGraph: { title: t.trang.title, description: t.trang.description, url: `/dich-vu/${t.dichVu.slug}/` },
  };
}

export default async function TrangDichVu({ params }) {
  const t = await lay(params);
  if (!t) notFound();
  const [html, trangKhuVuc] = await Promise.all([noiDungHtml(await layPayload(), t.trang.noiDung), layDanhSachTrangKhuVuc()]);
  const { dichVu: dv, trang, camKet } = t;
  const tenNgan = trang.ten || dv.ten;
  const coTrangKv = new Set(trangKhuVuc.map((k) => k.duongDan));
  const giaCong = dv.giaCongTu != null ? `${dv.giaCongTu.toLocaleString("vi-VN")}đ` : null;
  const thongSo = [
    giaCong && { nhan: "Giá công", gia: giaCong },
    dv.thoiGianLam && { nhan: "Thời gian", gia: dv.thoiGianLam },
    camKet.baoHanhPhuTungThang && { nhan: "Bảo hành", gia: `${camKet.baoHanhPhuTungThang} tháng` },
  ].filter(Boolean);
  const datLich = `/dat-lich/?dv=${dv.slug}`;
  const giaPhuTung = t.bangGia.filter((h) => h.loai === "phuTung").map((h) => h.gia);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: trang.title, serviceType: dv.ten, description: trang.description,
        url: `${site.url}/dich-vu/${dv.slug}/`,
        areaServed: t.quan.length ? t.quan.map((q) => ({ "@type": "AdministrativeArea", name: `${q.ten}, ${site.city}` })) : site.city,
        provider: { "@type": "AutoRepair", name: site.name, url: `${site.url}/`, ...(t.lienHe.hotline && { telephone: t.lienHe.hotline }) },
        ...(dv.giaCongTu != null && {
          offers: {
            "@type": "AggregateOffer", priceCurrency: "VND", lowPrice: dv.giaCongTu,
            ...(giaPhuTung.length && { highPrice: Math.max(...giaPhuTung.map((g) => g.den)) }),
          },
        }),
      }} />

      <div className={`wrap ${s.trang}`}>
        <div className={s.dau}>
          <DuongDan cap={[{ ten: "Dịch vụ", href: "/#dich-vu" }, { ten: dv.ten, href: `/dich-vu/${dv.slug}/` }]} />
          <section className={s.hero}>
            <div className={s.heroChu}>
              <h1 className={s.tieuDe}>{trang.title}</h1>
              <p className={s.moTa}>{trang.tomTat || dv.moTaNgan}</p>
              {thongSo.length ? (
                <dl className={s.thongSo}>
                  {thongSo.map((x) => <div key={x.nhan}><dt>{x.nhan}</dt><dd>{x.gia}</dd></div>)}
                </dl>
              ) : null}
              <Link href={datLich} className={`nut nut-chinh nut-lon ${s.nutDat}`}>{dv.nhanDatLich ? `Đặt thợ ${tenNgan.toLowerCase()}` : "Gọi cố vấn"}</Link>
            </div>
            <KhungAnh alt={`Thợ ${site.name} ${tenNgan.toLowerCase()} tận nơi`} tiLe="16 / 10" uuTien className={s.anh} />
          </section>
        </div>

        <div className={s.luoi}>
          <article className={s.noiDung}><NoiDungCms html={html} /></article>

          <aside className={s.cotGia} aria-labelledby="gia-tham-khao">
            <section className={s.khoiGia}>
              <h2 id="gia-tham-khao">Giá tham khảo</h2>
              <BangGiaHangMuc hangMuc={t.bangGia} dau="toi" tieuDe={`Giá ${dv.ten}`} />
              <p className="phu nho">Giá lấy từ bảng giá chung. Giá chính thức chốt sau khi thợ kiểm tra xe. Cộng phí đi lại {t.phi.hienThi.phiDiLai}.</p>
              {dv.baoGiaSoBo ? <XemGiaXe coDinh={dv.slug} kieu="hop" nhanGia="Tổng dự kiến" /> : (
                <p className="bao bao-cam">Việc này cần thợ kiểm tra mới báo được giá. Cố vấn gọi lại trong {camKet.coVanGoiLaiPhut} phút sau khi bạn đặt lịch.</p>
              )}
            </section>
          </aside>

          <div className={s.phanSau}>
            {camKet.baoHanhPhuTungThang || camKet.baoHanhCongThang ? (
              <section className="khoi" aria-labelledby="bao-hanh">
                <h2 id="bao-hanh">Bảo hành</h2>
                <div className={s.baoHanh}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" /></svg>
                  <p>
                    Phụ tùng lấy từ VCparts, bảo hành {camKet.baoHanhPhuTungThang} tháng cho phụ tùng thay mới và {camKet.baoHanhCongThang} tháng cho tiền công.
                    Hỏng trong thời gian bảo hành, thợ tới xử lý tại chỗ. <Link href="/chinh-sach-bao-hanh/">Xem chính sách bảo hành</Link>
                  </p>
                </div>
              </section>
            ) : null}

            <DanhGiaKhach danhGia={t.danhGia} tieuDe="Khách đã dùng dịch vụ" id="danh-gia-dv" />
            <HoiDap faq={trang.faq} />

            {t.quan.length ? (
              <section className="khoi" aria-labelledby="theo-khu-vuc">
                <h2 id="theo-khu-vuc" className={s.h2Nho}>{tenNgan} theo khu vực</h2>
                <ul className={s.chip}>
                  {t.quan.map((q) => {
                    const href = `/dich-vu/${dv.slug}/${q.slug}/`;
                    return (
                      <li key={q.slug}>
                        {coTrangKv.has(href)
                          ? <Link href={href} className={s.chipLink}>{q.ten}</Link>
                          : <span className="chip">{q.ten}{q.etaTu ? ` · ${q.etaTu}–${q.etaDen} phút` : ""}</span>}
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
