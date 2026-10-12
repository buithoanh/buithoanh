// Ghi chú cuối màn link riêng (hạn link, dùng một lần…).
import s from "./phuc-vu.module.css";

export default function ChanTrang({ children, dongHo = true }) {
  return (
    <footer className={s.chan}>
      {dongHo ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      ) : null}
      <span>{children}</span>
    </footer>
  );
}
