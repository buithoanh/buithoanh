// Footer dính dưới đáy luồng đặt lịch: "Giá sơ bộ" + khoảng giá (hoặc "Cố vấn gọi lại") + câu ghi chú + nút đi tiếp.
import s from "./FooterGia.module.css";

export default function FooterGia({ gia, ghiChu, dangTinh, nhanNut, onTiep, mo = true, dangGui = false, children }) {
  return (
    <footer className={s.chan}>
      <div className={s.hang}>
        <span className={s.nhan}>Giá sơ bộ</span>
        <b className={s.gia} aria-live="polite" aria-busy={dangTinh ? "true" : undefined}>{gia}</b>
      </div>
      {ghiChu ? <span className={s.ghiChu}>{ghiChu}</span> : null}
      {children}
      <button type="button" className={`${s.nut} ${mo ? "" : s.nutTat}`} onClick={onTiep} disabled={dangGui} aria-disabled={mo ? undefined : "true"}>
        {dangGui ? "Đang gửi…" : nhanNut}
      </button>
    </footer>
  );
}
