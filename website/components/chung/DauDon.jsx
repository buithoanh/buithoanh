// Header gọn của các màn link riêng (theo dõi, báo giá, thanh toán, đánh giá): tiêu đề đơn, dòng xe, tên thương hiệu.
import s from "./DauDon.module.css";

export default function DauDon({ tieuDe, phu, thuongHieu = "ThợTới" }) {
  return (
    <header className={s.dau}>
      <div className={s.trai}>
        <b>{tieuDe}</b>
        {phu ? <span>{phu}</span> : null}
      </div>
      <b className={s.thuongHieu}>{thuongHieu}</b>
    </header>
  );
}
