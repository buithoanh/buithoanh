// Nút chọn dạng viên (ngày, khung giờ, chỗ đỗ): aria-pressed, khoá thì gạch ngang.
import s from "./NutChon.module.css";

export default function NutChon({ chon, khoa = false, onClick, children, className = "", ...con }) {
  const lop = [s.nut, chon ? s.chon : "", khoa ? s.khoa : "", className].filter(Boolean).join(" ");
  return (
    <button type="button" className={lop} aria-pressed={chon ? "true" : "false"} disabled={khoa} onClick={onClick} {...con}>
      {children}
    </button>
  );
}

/** Thẻ chọn lớn (dịch vụ, sự cố): tên đậm + mô tả nhỏ, chọn thì nền cam nhạt viền cam. */
export function TheChon({ chon, onClick, ten, moTa, icon, cao = 84, ...con }) {
  return (
    <button type="button" className={`${s.the} ${chon ? s.theChon : ""}`} style={{ minHeight: cao }} aria-pressed={chon ? "true" : "false"} onClick={onClick} {...con}>
      {icon}
      <b className={s.theTen}>{ten}</b>
      {moTa ? <span className={s.theMoTa}>{moTa}</span> : null}
    </button>
  );
}
