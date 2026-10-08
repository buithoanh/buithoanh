// Bài cẩm nang (thiết kế BaiViet): mục lục từ h2/h3, khối giá và khối đặt lịch trong bài (giá lấy từ bảng giá lúc xem),
// video YouTube chỉ tải khi bấm phát, dịch vụ liên quan, bài liên quan. JSON-LD Article + FAQPage + BreadcrumbList.
// Chế độ xem trước (nút "Xem trước" trong admin → /xem-truoc/) đọc cả bản nháp: layBai() tự xử lý.
import Link from "next/link";
import { notFound } from "next/navigation";
import { cheDoNhap, formatDate, isoDate, layBai, layDanhSachBai, sangHtmlDayDu } from "@/lib/cms";
import { layChung, telHref, tenKhuVuc } from "@/lib/giao-dien";
import DuongDan from "@/components/chung/DuongDan";
import KhungAnh from "@/components/chung/KhungAnh";
import JsonLd from "@/components/JsonLd";
import TheBai from "@/components/noi-dung/TheBai";
import MucLuc from "@/components/noi-dung/MucLuc";
import PhatVideo from "@/components/noi-dung/PhatVideo";
import HopKeuGoi from "@/components/noi-dung/HopKeuGoi";
import { ganIdTieuDe, nhanBai, phutDoc, tenChuDe } from "@/components/noi-dung/bai";
import site from "@/site.config.mjs";
import s from "./bai-viet.module.css";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = await layBai(slug);
  if (!e) return {};
  const nhap = await cheDoNhap();
  return {
    title: e.title,
    description: e.description,
    alternates: { canonical: `/cam-nang/${slug}/` },
    openGraph: { type: "article", title: e.title, description: e.description, publishedTime: isoDate(e.ngay), modifiedTime: isoDate(e.capNhat || e.updatedAt) },
    ...(nhap ? { robots: { index: false, follow: false } } : {}),
  };
}

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const vietTat = (ten) => String(ten || "").replace(/\(.*?\)/g, "").trim().split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const tenNguoi = (u) => (typeof u === "object" && u ? String(u.ten || "").trim() || null : null);

/** Khối đặt lịch trong bài: thêm nút gọi hotline và dòng khu vực phục vụ (lấy từ cấu hình chung) như thiết kế. */
function boSungKhoiDatLich(html, chung) {
  const tel = telHref(chung.lienHe?.hotline);
  const kv = tenKhuVuc(chung).join(", ");
  const them =
    (tel ? `<a class="nut nut-trang khoi-dat-lich-goi" href="${esc(tel)}">Gọi ${esc(chung.lienHe.hotline)}</a>` : "") +
    `<p class="khoi-dat-lich-ghi-chu">${kv ? `Phục vụ ${esc(kv)}. ` : ""}Giá công khai trong <a href="/bang-gia/">bảng giá</a>.</p>`;
  return html.replace(/(<aside class="khoi-dat-lich">[\s\S]*?)<\/aside>/g, `$1${them}</aside>`);
}

export default async function TrangBaiViet({ params }) {
  const { slug } = await params;
  const [e, chung, tatCa] = await Promise.all([layBai(slug), layChung(), layDanhSachBai()]);
  if (!e) notFound();

  const { html, mucLuc } = ganIdTieuDe(boSungKhoiDatLich(await sangHtmlDayDu(e.noiDung), chung));
  const phut = phutDoc(e, html);
  const faq = (e.faq || []).filter((f) => f.q && f.a);
  const dichVu = (e.dichVuLienQuan || []).filter((d) => typeof d === "object" && d?.slug);
  const cd = tenChuDe(e.chuDe);
  const nguoiViet = tenNguoi(e.nguoiViet);
  const nguoiDuyet = tenNguoi(e.nguoiDuyetKyThuat);
  const thuongHieu = chung.thuongHieu?.ten || site.name;
  const ngayCapNhat = e.capNhat && isoDate(e.capNhat) !== isoDate(e.ngay) ? e.capNhat : null;

  // Bài liên quan: cùng chủ đề, rồi cùng nhóm, rồi bài mới nhất.
  const khac = tatCa.filter((b) => b.slug !== e.slug);
  const diem = (b) => (e.chuDe && b.chuDe === e.chuDe ? 2 : 0) + (b.nhom === e.nhom ? 1 : 0);
  const lienQuan = [...khac].sort((a, b) => diem(b) - diem(a)).slice(0, 3);

  const url = `${site.url}/cam-nang/${e.slug}/`;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: e.title, description: e.description,
        datePublished: isoDate(e.ngay), dateModified: isoDate(e.capNhat || e.updatedAt || e.ngay), inLanguage: "vi",
        author: nguoiViet ? { "@type": "Person", name: nguoiViet } : { "@type": "Organization", name: thuongHieu },
        ...(nguoiDuyet ? { reviewedBy: { "@type": "Person", name: nguoiDuyet } } : {}),
        publisher: { "@type": "Organization", name: thuongHieu, url: site.url },
        mainEntityOfPage: url, url,
        ...(phut ? { timeRequired: `PT${phut}M` } : {}),
      }} />
      {faq.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}
      <DuongDan an cap={[{ ten: "Cẩm nang xe", href: "/cam-nang/" }, { ten: e.title, href: `/cam-nang/${e.slug}/` }]} />

      <article className={s.bai}>
        <header className={s.dau}>
          <div className={`wrap-hep ${s.dauTrong}`}>
            <nav aria-label="Đường dẫn" className={s.dd}>
              <Link href="/">Trang chủ</Link><span aria-hidden="true">›</span>
              <Link href="/cam-nang/">Cẩm nang</Link>
              {cd ? <><span aria-hidden="true">›</span><Link href={`/cam-nang/?chuDe=${e.chuDe}`}>{cd}</Link></> : null}
            </nav>
            <span className={s.nhan}>{nhanBai(e)}</span>
            <h1>{e.title}</h1>
            {e.description ? <p className={s.dan}>{e.description}</p> : null}
            <div className={s.nguoi}>
              {nguoiViet ? (
                <div className={s.tacGia}>
                  <span className={s.avatar} aria-hidden="true">{vietTat(nguoiViet)}</span>
                  <p><span className="phu">Viết bởi</span> <b>{nguoiViet}</b><br /><span className="phu">Biên tập {thuongHieu}</span></p>
                </div>
              ) : null}
              {nguoiDuyet ? (
                <div className={s.duyet}>
                  <span className={s.avatar} aria-hidden="true">{vietTat(nguoiDuyet)}</span>
                  <p><span className={s.chuXanh}>Kỹ thuật duyệt</span> <b>{nguoiDuyet}</b></p>
                </div>
              ) : null}
              <p className={s.ngay}>
                Đăng <time dateTime={isoDate(e.ngay)}>{formatDate(e.ngay)}</time>
                {ngayCapNhat ? <> · Cập nhật <time dateTime={isoDate(ngayCapNhat)}>{formatDate(ngayCapNhat)}</time></> : null}
                {phut ? ` · ${phut} phút đọc` : ""}
              </p>
            </div>
          </div>
        </header>

        <div className={`wrap-hep ${s.than}`}>
          <KhungAnh anh={e.anh} alt={e.title} tiLe="16 / 9" uuTien />
          <MucLuc muc={mucLuc} />
          <div id="noi-dung-bai" className={`noi-dung-bai ${s.noiDung}`} dangerouslySetInnerHTML={{ __html: html }} />
          <PhatVideo vungId="noi-dung-bai" />

          {faq.length > 0 && (
            <section className={s.faq} aria-labelledby="hoi-dap">
              <h2 id="hoi-dap">Câu hỏi thường gặp</h2>
              {faq.map((f) => (
                <details key={f.id || f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </section>
          )}
        </div>
      </article>

      <div className="wrap-hep">
        {dichVu.length > 0 && (
          <section className={s.khoi} aria-labelledby="dich-vu-lien-quan">
            <h2 id="dich-vu-lien-quan">Dịch vụ liên quan</h2>
            <ul className={s.dsDichVu}>
              {dichVu.map((d) => (
                <li key={d.slug}>
                  <Link href={`/dich-vu/${d.slug}/`} className={s.dichVu}>
                    <span className={s.ma} aria-hidden="true">{vietTat(d.ten)}</span>
                    <span className={s.dvChu}><b>{d.ten}</b>{d.tomTat ? <span>{d.tomTat}</span> : null}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {lienQuan.length > 0 && (
        <section className={`${s.khoi} ${s.lienQuan}`} aria-labelledby="bai-lien-quan">
          <div className="wrap-hep khoi-tieu-de">
            <h2 id="bai-lien-quan">Bài liên quan</h2>
            <Link href="/cam-nang/" className="link-nhan">Xem tất cả</Link>
          </div>
          <ul className={s.dsNgang}>
            {lienQuan.map((b) => <li key={b.slug}><TheBai bai={b} kieu="ngang" /></li>)}
          </ul>
        </section>
      )}

      <div className={`wrap-hep ${s.cuoi}`}>
        <HopKeuGoi />
      </div>
    </>
  );
}
