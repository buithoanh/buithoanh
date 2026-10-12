// Thẻ thợ: ảnh (hoặc chữ viết tắt), tên, điểm sao, chứng chỉ, năm nghề, biển số xe van.
// tieuDe / phu: thay dòng tên / dòng mô tả (màn báo giá, đánh giá dùng câu riêng).
import s from "./phuc-vu.module.css";
import { vietTat } from "./dinh-dang";

export function AnhTho({ tho, lon = false }) {
  const lop = `${s.anhTho} ${lon ? s.anhThoLon : ""}`;
  if (tho?.anh) return <img className={lop} src={tho.anh} alt="" width={lon ? 56 : 44} height={lon ? 56 : 44} loading="lazy" />;
  return <span className={lop} aria-hidden="true">{tho?.vietTat || vietTat(tho?.ten)}</span>;
}

export const saoTho = (tho) => (tho?.diemSao != null ? String(tho.diemSao).replace(".", ",") : null);

export function moTaTho(tho) {
  const phan = [];
  if (tho?.chungChi?.length) phan.push(tho.chungChi.some((c) => /vcedu/i.test(c)) ? "Chứng chỉ VCedu" : tho.chungChi[0]);
  if (tho?.soNamNghe) phan.push(`${tho.soNamNghe} năm kinh nghiệm`);
  return phan.join(" · ");
}

export default function TheTho({ tho, lon = false, tieuDe, phu, xeVan = true }) {
  if (!tho) return null;
  const sao = saoTho(tho);
  const moTa = phu ?? moTaTho(tho);
  return (
    <div className={`${s.tho} ${lon ? s.thoLon : ""}`}>
      <AnhTho tho={tho} lon={lon} />
      <div className={s.thoChu}>
        {tieuDe ? <b>{tieuDe}</b> : (
          <b>{tho.ten}{sao ? <> <span className={s.sao}><span aria-hidden="true">★</span><span className="sr-only">điểm</span> {sao}</span></> : null}</b>
        )}
        {moTa ? <span>{moTa}</span> : null}
        {xeVan && tho.bienSoXeVan ? <span className={s.xeVan}>Xe van <b>{tho.bienSoXeVan}</b></span> : null}
      </div>
    </div>
  );
}
