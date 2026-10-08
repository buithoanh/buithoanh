// Cẩm nang xe (thiết kế CamNang): lọc chủ đề, tìm kiếm, xem thêm.
// Toàn bộ render phía server theo query ?chuDe=&q=&trang= nên tắt JavaScript vẫn lọc, tìm, xem thêm được;
// có JavaScript thì next/link và next/form chuyển trang mượt, không tải lại cả trang.
import Link from "next/link";
import Form from "next/form";
import { layDanhSachBai } from "@/lib/cms";
import DuongDan from "@/components/chung/DuongDan";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import TheBai from "@/components/noi-dung/TheBai";
import HopKeuGoi from "@/components/noi-dung/HopKeuGoi";
import { DS_CHU_DE, khopTuKhoa, tenChuDe } from "@/components/noi-dung/bai";
import site from "@/site.config.mjs";
import s from "./cam-nang.module.css";

const MOI_TRANG = 8; // số bài trong danh sách mỗi lần "Xem thêm"

const motGiaTri = (v) => (Array.isArray(v) ? v[0] : v) || "";

async function docLoc(searchParams) {
  const sp = await searchParams;
  const chuDe = motGiaTri(sp?.chuDe);
  return {
    chuDe: DS_CHU_DE.some((c) => c.id === chuDe) ? chuDe : "",
    q: motGiaTri(sp?.q).trim().slice(0, 80),
    trang: Math.min(50, Math.max(1, Number.parseInt(motGiaTri(sp?.trang), 10) || 1)),
  };
}

export async function generateMetadata({ searchParams }) {
  const { chuDe, q } = await docLoc(searchParams);
  const ten = tenChuDe(chuDe);
  return {
    title: ten ? `Cẩm nang xe: ${ten}` : "Cẩm nang xe",
    description: "Thợ viết, trưởng kỹ thuật duyệt. Giải thích dễ hiểu để bạn tự xử lý được việc nhỏ và biết lúc nào nên gọi thợ.",
    alternates: { canonical: "/cam-nang/" },
    // Trang kết quả tìm kiếm không cần lên Google.
    ...(q && site.allowIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

const lienKet = (p) => {
  const q = new URLSearchParams();
  if (p.chuDe) q.set("chuDe", p.chuDe);
  if (p.q) q.set("q", p.q);
  if (p.trang > 1) q.set("trang", String(p.trang));
  const chu = q.toString();
  return `/cam-nang/${chu ? `?${chu}` : ""}`;
};

export default async function TrangCamNang({ searchParams }) {
  const [tatCa, loc] = await Promise.all([layDanhSachBai(), docLoc(searchParams)]);
  const { chuDe, q, trang } = loc;

  // Đếm theo chủ đề sau khi đã lọc từ khoá, để số trên chip khớp với kết quả.
  const theoTuKhoa = q ? tatCa.filter((b) => khopTuKhoa(b, q)) : tatCa;
  const chips = [{ id: "", ten: "Tất cả" }, ...DS_CHU_DE].map((c) => ({
    ...c,
    soBai: c.id ? theoTuKhoa.filter((b) => b.chuDe === c.id).length : theoTuKhoa.length,
  }));
  const ds = chuDe ? theoTuKhoa.filter((b) => b.chuDe === chuDe) : theoTuKhoa;

  const coNoiBat = !q && ds.length > 0;
  const noiBat = coNoiBat ? ds[0] : null;
  const conLai = coNoiBat ? ds.slice(1) : ds;
  const hien = conLai.slice(0, trang * MOI_TRANG);
  const conNua = conLai.length - hien.length;
  const tenCD = tenChuDe(chuDe);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: "Cẩm nang xe", url: `${site.url}/cam-nang/`, inLanguage: "vi",
        hasPart: tatCa.slice(0, 20).map((b) => ({ "@type": "Article", headline: b.title, url: `${site.url}/cam-nang/${b.slug}/` })),
      }} />
      <section className={s.hero}>
        <div className={`wrap ${s.heroTrong}`}>
          <DuongDan cap={[{ ten: "Cẩm nang xe", href: "/cam-nang/" }]} toi />
          <h1>Cẩm nang xe</h1>
          <p className={s.dan}>Thợ viết, trưởng kỹ thuật duyệt. Giải thích dễ hiểu để bạn tự xử lý được việc nhỏ và biết lúc nào nên gọi thợ.</p>
          <Form action="/cam-nang/" role="search" className={s.tim} scroll={false}>
            <label htmlFor="tim-bai" className={s.nhanTim}>Tìm bài cẩm nang</label>
            <div className={s.hangTim}>
              <span className={s.oTim}>
                <Icon name="tim-kiem" size={18} />
                <input id="tim-bai" type="search" name="q" defaultValue={q} placeholder="VD: xe kêu khi phanh" maxLength={80} enterKeyHint="search" />
              </span>
              {chuDe ? <input type="hidden" name="chuDe" value={chuDe} /> : null}
              <button type="submit" className="nut nut-chinh">Tìm</button>
            </div>
          </Form>
        </div>
      </section>

      <div className="wrap">
        <nav aria-label="Chủ đề" className={s.chuDe}>
          <span className={s.nhanChuDe} id="nhan-chu-de">Chủ đề</span>
          <ul aria-labelledby="nhan-chu-de">
            {chips.map((c) => {
              const dangChon = c.id === chuDe;
              return (
                <li key={c.id || "tat-ca"}>
                  <Link
                    href={lienKet({ chuDe: c.id, q, trang: 1 })} scroll={false}
                    className={`${s.chip} ${dangChon ? s.chipChon : ""}`} aria-current={dangChon ? "page" : undefined}
                  >
                    {c.ten}<span className={s.dem}>{c.soBai}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {q ? (
          <p className={s.ketQuaTim} role="status">
            {ds.length ? `${ds.length} bài khớp “${q}”${tenCD ? ` trong ${tenCD}` : ""}.` : `Chưa có bài nào khớp “${q}”${tenCD ? ` trong ${tenCD}` : ""}.`}{" "}
            <Link href={lienKet({ chuDe, q: "", trang: 1 })} scroll={false}>Xoá tìm kiếm</Link>
          </p>
        ) : null}

        <div className={s.bo}>
          {noiBat ? (
            <section className={s.khoiNoiBat} aria-labelledby="tieu-de-noi-bat">
              <h2 id="tieu-de-noi-bat" className={s.h2}>{tenCD ? `Nổi bật trong ${tenCD}` : "Bài nổi bật"}</h2>
              <TheBai bai={noiBat} kieu="noiBat" />
            </section>
          ) : null}

          <section className={s.khoiDs} aria-labelledby="tieu-de-ds">
            <div className="khoi-tieu-de">
              <h2 id="tieu-de-ds" className={s.h2}>{q ? "Kết quả tìm kiếm" : tenCD || "Bài mới"}</h2>
              <span className="phu nho">{ds.length} bài</span>
            </div>
            {hien.length ? (
              <ul className={s.ds}>
                {hien.map((b) => <li key={b.slug}><TheBai bai={b} /></li>)}
              </ul>
            ) : null}
            {!ds.length && !q ? (
              <p className={s.trong}>{tenCD ? "Chủ đề này chưa có bài. Biên tập đăng thêm bài mới mỗi tuần." : "Chưa có bài nào. Biên tập đăng thêm bài mới mỗi tuần."}</p>
            ) : null}
            {coNoiBat && !conLai.length ? (
              <p className={s.trong}>Chủ đề này mới có một bài. Biên tập đăng thêm bài mới mỗi tuần.</p>
            ) : null}
            {conNua > 0 ? (
              <Link href={lienKet({ chuDe, q, trang: trang + 1 })} scroll={false} className={`nut ${s.xemThem}`} rel="nofollow">
                Xem thêm bài <span className="phu nho">(còn {conNua})</span>
              </Link>
            ) : null}
          </section>
        </div>

        <div className={s.cuoi}>
          <HopKeuGoi />
        </div>
      </div>
    </>
  );
}
