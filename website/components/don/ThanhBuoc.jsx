// Thanh tiến độ nhiều đoạn (đặt lịch 4 bước). Đoạn đã tới tô cam.
import s from "./ThanhBuoc.module.css";

export default function ThanhBuoc({ buoc, tong = 4 }) {
  return (
    <div className={s.thanh} role="progressbar" aria-valuemin={1} aria-valuemax={tong} aria-valuenow={buoc} aria-label={`Bước ${buoc} trên ${tong}`}>
      {Array.from({ length: tong }, (_, i) => (
        <span key={i} className={i < buoc ? `${s.doan} ${s.da}` : s.doan} />
      ))}
    </div>
  );
}
