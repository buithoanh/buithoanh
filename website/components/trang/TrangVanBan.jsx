// Khung trang chữ (chính sách bảo hành, bảo vệ dữ liệu…): breadcrumb, h1, dòng phụ, nội dung dạng bài.
import DuongDan from "../chung/DuongDan";
import s from "./TrangVanBan.module.css";

export default function TrangVanBan({ duongDan, tieuDe, phu = null, children }) {
  return (
    <div className={`wrap-hep ${s.trang}`}>
      <DuongDan cap={duongDan} />
      <h1 className={s.tieuDe}>{tieuDe}</h1>
      {phu ? <p className="phu">{phu}</p> : null}
      <div className={`noi-dung-bai ${s.nd}`}>{children}</div>
    </div>
  );
}
