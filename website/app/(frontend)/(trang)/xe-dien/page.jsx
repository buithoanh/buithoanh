// Trang xe điện (thiết kế XeDien): chọn dòng xe điện → giá phụ tùng theo phân khúc; việc làm / không làm; khối tài xế taxi.
import Link from "next/link";
import site from "@/site.config.mjs";
import { layPayload } from "@/lib/cms";
import { layTrangXeDien, layBangGia } from "@/lib/cong-khai";
import { layTrangHoiVien } from "@/lib/hoi-vien";
import { layChung } from "@/lib/giao-dien";
import JsonLd from "@/components/JsonLd";
import DuongDan from "@/components/chung/DuongDan";
import Hero from "@/components/trang/Hero";
import HoiDap from "@/components/trang/HoiDap";
import { tomTatGoi } from "@/components/trang/goi";
import ChonXeDien from "./ChonXeDien";
import s from "./xe-dien.module.css";

const TIEU_DE = "Sửa xe điện tận nơi: lốp, phanh, ắc quy 12V";

export const metadata = {
  title: `${TIEU_DE} tại ${site.city}`,
  description: `Xe điện VinFast thủng lốp, hết ắc quy 12V, phanh kêu? Thợ ${site.name} tới tận nơi, giá theo dòng xe, báo giá trước khi làm. Không đụng tới pin cao áp.`,
  alternates: { canonical: "/xe-dien/" },
};

const KHONG_LAM = [
  { t: "Pin cao áp", d: "Không mở, không sửa, không thay pin chính của xe." },
  { t: "Mô-tơ điện và bộ sạc trên xe", d: "Thuộc hệ thống cao áp, chỉ xưởng hãng được làm." },
  { t: "Cập nhật phần mềm của hãng", d: "Làm qua mạng hoặc tại xưởng dịch vụ của hãng." },
];

const FAQ = [
  { q: "Xe điện cũng có ắc quy 12V à?", a: "Có. Ắc quy 12V nuôi màn hình, khóa cửa, đèn. Ắc quy này yếu thì xe báo lỗi và không khởi động được, dù pin chính vẫn đầy." },
  { q: "Thợ có được đào tạo về xe điện không?", a: "Có. Thợ học an toàn điện tại VCedu, biết cách ngắt hệ thống trước khi làm và không chạm vào dây cao áp màu cam." },
];

export default async function TrangXeDien() {
  const payload = await layPayload();
  const [t, hv, bg, chung] = await Promise.all([layTrangXeDien(payload), layTrangHoiVien(payload), layBangGia(payload), layChung()]);
  const dong = t.xe.flatMap((h) => h.dong.map((d) => ({ ...d, tenHang: h.ten, hang: h.slug })));
  const cuuHo = bg.dichVu.find((d) => d.slug === "cuu-ho-keo-xe");
  const keoXe = cuuHo?.hangMuc.find((h) => h.loai === "cong" && h.gia.tu > 0);
  const goi = hv.goi[0];
  const { camKet } = chung;
  const tenHang = [...new Set(t.xe.map((h) => h.ten))].join(", ");

  const giuaTrang = (
    <>
        <section className="khoi" aria-labelledby="khong-lam">
          <div className={s.dauMuc}>
            <span className={`${s.icon} ${s.iconKhong}`} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </span>
            <h2 id="khong-lam" className={s.h2}>Việc chúng tôi KHÔNG làm</h2>
          </div>
          <div className={s.khongLam}>
            <ul>
              {KHONG_LAM.map((n) => (
                <li key={n.t}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  <div><b>{n.t}</b><span>{n.d}</span></div>
                </li>
              ))}
            </ul>
            <p>
              Gặp lỗi pin hay hệ thống điện cao áp? Gọi chúng tôi, cố vấn hướng dẫn bạn tới xưởng dịch vụ của hãng, hoặc kéo xe tới đó
              {keoXe ? <> (<Link href="/dich-vu/cuu-ho-keo-xe/">{keoXe.giaHienThi} nội thành</Link>)</> : null}.
            </p>
          </div>
        </section>

        <section className={s.taxi} aria-labelledby="taxi">
          <div className={s.dauMuc}>
            <span className={s.iconTaxi} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </span>
            <h2 id="taxi" className={s.h2Taxi}>Tài xế taxi điện: xe nằm ít, chạy nhiều</h2>
          </div>
          <ul className={s.dsTaxi}>
            {[
              ["Sửa lúc giao ca:", "hẹn đúng giờ bạn nghỉ, xe không mất cuốc."],
              ["Làm ở bãi sạc hoặc bãi đỗ:", "không phải chạy vào xưởng, đỡ hao pin."],
              ["Vá lốp, kích ắc quy gấp:", camKet.cuuHoPhut ? `có mặt trong ${camKet.cuuHoPhut} phút trong vùng phục vụ.` : "thợ tới nhanh trong vùng phục vụ."],
              ["Hoá đơn điện tử qua Zalo:", "nộp lại cho hãng xe hoặc đơn vị chủ quản."],
            ].map(([a, b]) => (
              <li key={a}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                <span><b>{a}</b> {b}</span>
              </li>
            ))}
          </ul>
          {goi ? (
            <Link href="/hoi-vien/" className={s.goi}>
              <span><b>{goi.ten}</b><span>{tomTatGoi(goi.quyenLoi)}</span></span>
              <b className={s.giaGoi}>{goi.giaNamHienThi}/năm</b>
            </Link>
          ) : null}
          <Link href="/dat-lich/" className={`nut nut-toi ${s.nutTaxi}`}>Đặt lịch theo giờ giao ca</Link>
        </section>

        <HoiDap faq={FAQ} tieuDe="Hỏi nhanh" nho />
    </>
  );

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: TIEU_DE, serviceType: "Sửa chữa xe điện tận nơi", url: `${site.url}/xe-dien/`,
        areaServed: chung.vungPhucVu.quan.map((q) => ({ "@type": "AdministrativeArea", name: `${q.ten}, ${site.city}` })),
        provider: { "@type": "AutoRepair", name: site.name, url: `${site.url}/` },
      }} />
      <Hero
        duongDan={<DuongDan toi cap={[{ ten: "Xe điện", href: "/xe-dien/" }]} />}
        nhan={`Cho chủ xe điện${tenHang ? ` ${tenHang}` : ""} và tài xế taxi điện`}
        tieuDe="Xe điện thủng lốp, hết ắc quy 12V? Thợ tới tận nơi"
        moTa="Lốp, phanh, ắc quy 12V, điều hòa làm ngay chỗ xe đỗ. Pin cao áp thì chúng tôi không đụng tới."
      >
        <div className={s.camKet}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" /></svg>
          <b>Thay lốp, phanh, ắc quy 12V, sửa điều hòa tại {site.name} không ảnh hưởng bảo hành hãng.</b>
        </div>
      </Hero>

      <div className="wrap">
        {dong.length ? (
          <ChonXeDien dong={dong} dichVu={t.dichVu} phi={t.phi} cuuHoPhut={camKet.cuuHoPhut} giua={giuaTrang} />
        ) : (
          <>
            <p className="bao bao-vang">Danh mục xe điện đang cập nhật. Gọi hotline để được báo giá.</p>
            {giuaTrang}
          </>
        )}
      </div>
    </>
  );
}
