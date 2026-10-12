// Thẻ đánh giá khách (chỉ đánh giá thật từ collection danh-gia). danhGia: phần tử của layDanhGia()/layTrangChu().danhGia.
import { formatDate } from "@/lib/cms";
import s from "./DanhGiaKhach.module.css";

export function TheDanhGia({ dg }) {
  const ai = [dg.tenHienThi, dg.quan?.ten, dg.ngay ? formatDate(dg.ngay) : null].filter(Boolean).join(" · ");
  return (
    <figure className={s.the}>
      <span className={s.sao} aria-label={`${dg.soSao} trên 5 sao`}>{"★".repeat(dg.soSao)}{"☆".repeat(5 - dg.soSao)}</span>
      <blockquote>{dg.noiDung}</blockquote>
      <figcaption>{ai}</figcaption>
    </figure>
  );
}

/** Dải đánh giá cuộn ngang (điện thoại), lưới 3 cột (máy tính). Không có đánh giá thật thì không hiện gì. */
export default function DanhGiaKhach({ danhGia, google, tieuDe = "Khách nói gì", id = "danh-gia" }) {
  if (!danhGia?.length) return null;
  return (
    <section className="khoi" aria-labelledby={id}>
      <div className="khoi-tieu-de">
        <h2 id={id}>{tieuDe}</h2>
        {google?.diem ? (
          <span className="phu">
            <b className={s.diem}>{String(google.diem).replace(".", ",")}</b> ★{google.soDanhGia ? ` · ${google.soDanhGia} đánh giá Google` : ""}
          </span>
        ) : null}
      </div>
      <div className={s.dai}>
        {danhGia.map((dg, i) => <TheDanhGia key={i} dg={dg} />)}
      </div>
    </section>
  );
}
