// Khu vực phục vụ: bản đồ (Google Maps nhúng khi có khoá GOOGLE_MAPS_EMBED_KEY, chưa có thì khung giữ chỗ liệt kê khu vực
// và thời gian thợ tới lấy từ dữ liệu), chip tên khu vực, ô kiểm tra địa chỉ. vung: chung.vungPhucVu (layChung()).
import KiemTraVung from "./KiemTraVung";
import s from "./KhoiVungPhucVu.module.css";

export function BanDoVung({ vung, thanhPho, nhanBanDo = "Khu vực phục vụ", cao = "thuong" }) {
  const khoa = process.env.GOOGLE_MAPS_EMBED_KEY;
  const ds = vung?.quan || [];
  if (khoa) {
    const q = encodeURIComponent(ds.length ? `${ds.map((q) => q.ten).join(", ")}, ${thanhPho}` : thanhPho);
    return (
      <div className={`${s.banDo} ${s[cao]}`}>
        <iframe
          title={`Bản đồ ${nhanBanDo.toLowerCase()}`} src={`https://www.google.com/maps/embed/v1/search?key=${khoa}&q=${q}&language=vi`}
          loading="lazy" referrerPolicy="no-referrer-when-downgrade" className={s.iframe}
        />
      </div>
    );
  }
  const tu = ds.length ? Math.min(...ds.map((q) => q.etaTu ?? 0)) : null;
  const den = ds.length ? Math.max(...ds.map((q) => q.etaDen ?? 0)) : null;
  return (
    <div className={`${s.banDo} ${s.giuCho} ${s[cao]}`}>
      <svg className={s.nen} viewBox="0 0 358 190" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 60 L358 40 M0 140 L358 120 M90 0 L120 190 M240 0 L210 190" className={s.duong} />
        <path d="M70 30 L290 22 L310 160 L60 170 Z" className={s.vung} />
      </svg>
      <div className={s.giuChoChu}>
        <b>{nhanBanDo}</b>
        {ds.length ? (
          <ul>
            {ds.map((q) => <li key={q.slug}>{q.ten}{q.etaTu ? <span> · {q.etaTu}–{q.etaDen} phút</span> : null}</li>)}
          </ul>
        ) : <span>Đang cập nhật khu vực phục vụ.</span>}
        {tu != null && den ? <span className={s.ghiChu}>Thời gian thợ tới dự kiến {tu}–{den} phút</span> : null}
      </div>
    </div>
  );
}

export default function KhoiVungPhucVu({ chung, tieuDe = "Khu vực phục vụ", id = "khu-vuc", kiemTra = true, className = "" }) {
  const vung = chung.vungPhucVu;
  return (
    <section className={`khoi ${className}`} aria-labelledby={`${id}-h`} id={id}>
      <h2 id={`${id}-h`}>{tieuDe}</h2>
      <BanDoVung vung={vung} thanhPho={chung.thuongHieu.thanhPho} />
      {vung.quan.length ? (
        <ul className={s.chip} aria-label="Các khu vực đang phục vụ">
          {vung.quan.map((q) => <li key={q.slug} className="chip">{q.ten}</li>)}
        </ul>
      ) : null}
      {kiemTra ? <KiemTraVung /> : null}
    </section>
  );
}
