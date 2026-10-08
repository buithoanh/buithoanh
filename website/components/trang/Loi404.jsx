// Trang 404 (thiết kế Loi404): gọi thợ ngay, Zalo, đặt lịch, ô tìm dịch vụ / cẩm nang, dịch vụ nhiều người tìm, lối đi tiếp.
// khung = true: tự vẽ header, footer, thanh liên hệ (dùng ở app/global-not-found.jsx và app/(frontend)/not-found.jsx,
// nơi không có layout nhóm (trang)).
import Link from "next/link";
import { layDanhSachDichVu, layPayload } from "@/lib/cms";
import { layDichVuKemGia } from "@/lib/cong-khai";
import { layChung } from "@/lib/giao-dien";
import { NutGoi, NutZalo } from "../chung/LienHe";
import Header from "../chung/Header";
import Footer from "../chung/Footer";
import ThanhLienHe from "../chung/ThanhLienHe";
import s from "./Loi404.module.css";

export default async function Loi404({ khung = false }) {
  const [chung, danhMuc, trangDv] = await Promise.all([layChung(), layPayload().then((p) => layDichVuKemGia(p)), layDanhSachDichVu()]);
  // Chỉ liệt kê dịch vụ đã có trang đăng (tránh dẫn sang một trang 404 khác)
  const coTrang = new Set(trangDv.map((d) => d.slug));
  const dichVu = danhMuc.filter((d) => coTrang.has(d.slug));
  const { lienHe, camKet } = chung;
  const noiDung = (
    <div className={`wrap-hep ${s.trang}`}>
      <section className={s.dau}>
        <svg width="168" height="96" viewBox="0 0 168 96" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={s.hinh}>
          <path d="M20 66h128" className={s.net} />
          <path d="M34 66V52l12-18h56l16 18h12a8 8 0 0 1 8 8v6" className={s.net} />
          <path d="M52 34v18M90 34v18M34 52h104" className={s.net} />
          <circle cx="54" cy="68" r="10" className={s.banh} />
          <circle cx="118" cy="68" r="10" className={s.banh} />
          <path d="M128 10l10 10M138 10l-10 10" className={s.dauX} />
          <path d="M8 86h20M44 86h40M100 86h24M140 86h20" strokeWidth="2" className={s.mat} />
        </svg>
        <span className={s.ma}>LỖI 404</span>
        <h1 className={s.tieuDe}>Trang này không còn ở đây</h1>
        <p className={s.moTa}>Có thể đường dẫn đã đổi hoặc gõ nhầm. Nếu xe bạn đang gặp sự cố, đừng mất thời gian tìm, gọi thợ luôn.</p>
      </section>

      <section className={s.lienHe} aria-label="Liên hệ">
        <NutGoi hotline={lienHe.hotline} className={`nut nut-chinh ${s.goi}`} icon={false}>
          <span className={s.goiDong}>Gọi thợ ngay · {lienHe.hotline}</span>
          {camKet.cuuHoPhut ? <span className={s.goiPhu}>Có mặt trong {camKet.cuuHoPhut} phút trong vùng phục vụ</span> : null}
        </NutGoi>
        <div className={s.haiNut}>
          <NutZalo zalo={lienHe.zalo} className={`nut nut-zalo ${s.nutPhu}`}>Nhắn Zalo</NutZalo>
          <Link href="/dat-lich/" className={`nut nut-trang ${s.nutPhu} ${s.datLich}`}>Đặt lịch</Link>
        </div>
      </section>

      <section className={s.khoi}>
        <form role="search" action="/cam-nang/" method="get" className={s.tim}>
          <label htmlFor="tim-404">Tìm dịch vụ hoặc bài cẩm nang</label>
          <div className={s.hangTim}>
            <span className={s.oTim}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
              <input id="tim-404" type="search" name="q" placeholder="VD: thay ắc quy, vá lốp" autoComplete="off" />
            </span>
            <button type="submit" className="nut nut-toi">Tìm</button>
          </div>
        </form>
      </section>

      {dichVu.length ? (
        <section className={s.khoi} aria-labelledby="dv-404">
          <h2 id="dv-404" className={s.h2}>Dịch vụ nhiều người tìm</h2>
          <ul className={s.ds}>
            {dichVu.map((d) => (
              <li key={d.slug}>
                <Link href={`/dich-vu/${d.slug}/`}>
                  <span className={s.maDv} aria-hidden="true">{d.ma}</span>
                  <span className={s.tenDv}><b>{d.ten}</b>{d.moTaNgan ? <span>{d.moTaNgan}</span> : null}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={s.mui}><path d="M9 6l6 6-6 6" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className={s.khoi} aria-labelledby="di-toi">
        <h2 id="di-toi" className={s.h2Nho}>Hoặc đi tới</h2>
        <ul className={s.chip}>
          <li><Link href="/">Trang chủ</Link></li>
          <li><Link href="/bang-gia/">Bảng giá</Link></li>
          <li><Link href="/#khu-vuc">Khu vực phục vụ</Link></li>
          <li><Link href="/cam-nang/">Cẩm nang xe</Link></li>
        </ul>
      </nav>
    </div>
  );
  if (!khung) return noiDung;
  return (
    <>
      <Header chung={chung} />
      <main id="noi-dung" tabIndex={-1}>{noiDung}</main>
      <Footer chung={chung} />
      <ThanhLienHe chung={chung} />
    </>
  );
}
