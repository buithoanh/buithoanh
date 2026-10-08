// Khối mở đầu nền tối (BangGia, HangXe, XeDien, VeChungToi, trang chủ). Một h1 duy nhất của trang nằm ở đây.
// duongDan: <DuongDan toi …/> (breadcrumb trên nền tối); nhan: nhãn nhỏ trên tiêu đề; phai: cột phải trên máy tính
// (ảnh, form xem giá); children: nút, ô thông số… nằm dưới đoạn mô tả.
import s from "./Hero.module.css";

export default function Hero({ duongDan = null, nhan = null, tieuDe, moTa = null, children = null, phai = null, lon = false, className = "" }) {
  return (
    <section className={`${s.hero} ${lon ? s.lon : ""} ${className}`}>
      <div className={`wrap ${s.trong} ${phai ? s.haiCot : ""}`}>
        <div className={s.chu}>
          {duongDan}
          {nhan ? <span className={s.nhan}>{nhan}</span> : null}
          <h1 className={s.tieuDe}>{tieuDe}</h1>
          {moTa ? <p className={s.moTa}>{moTa}</p> : null}
          {children}
        </div>
        {phai ? <div className={s.phai}>{phai}</div> : null}
      </div>
    </section>
  );
}
