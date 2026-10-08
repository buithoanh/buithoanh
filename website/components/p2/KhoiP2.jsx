// Khối nhỏ dùng chung cho các trang P2 (hội viên, giới thiệu, doanh nghiệp, tuyển thợ). Server component, không cần JavaScript.
import Icon from "../Icon";
import s from "./KhoiP2.module.css";

/** Danh sách bước có số tròn. buoc: [{ t, d }] */
export function BuocSo({ buoc }) {
  return (
    <ol className={s.buoc}>
      {buoc.map((b, i) => (
        <li key={b.t}>
          <span className={s.so} aria-hidden="true">{i + 1}</span>
          <div><b>{b.t}</b><span>{b.d}</span></div>
        </li>
      ))}
    </ol>
  );
}

/** Câu hỏi thường gặp dạng <details> (mở/đóng không cần JavaScript). ds: [{ hoi, dap?, chu }] */
export function HoiDap({ ds }) {
  return (
    <div className={s.hoiDap}>
      {ds.map((q, i) => (
        <details key={q.hoi} open={i === 0}>
          <summary><span>{q.hoi}</span><Icon name="xuong" size={18} className={s.mui} /></summary>
          <p>{q.dap || q.chu}</p>
        </details>
      ))}
    </div>
  );
}

/** Hai thẻ thưởng giới thiệu (bạn bè được / bạn được) từ dữ liệu gioiThieu của backend. */
export function TheThuong({ thuong }) {
  if (!thuong) return null;
  return (
    <div className={s.thuong}>
      <div className={s.theThuong}><span>Bạn bè được</span><b>{thuong.banBe.moTa}</b><em>tiết kiệm {thuong.banBe.tietKiemHienThi}</em></div>
      <div className={s.theThuong}><span>Bạn được</span><b>{thuong.ban.moTa}</b><em>tiết kiệm {thuong.ban.tietKiemHienThi}</em></div>
    </div>
  );
}

/** Ô thống kê nhỏ (số to + chú thích). */
export function OSo({ so, chu, nhan = false }) {
  return <div className={s.oSo}><b className={nhan ? s.soNhan : undefined}>{so}</b><span>{chu}</span></div>;
}

/** Ô "đã gửi xong" của form: dấu tích, tiêu đề, mã, nội dung thêm. */
export function DaGui({ tieuDe, moTa, nhanMa, ma, children, idTieuDe }) {
  return (
    <div className={`the ${s.daGui}`} role="status">
      <span className={s.tichTo} aria-hidden="true"><Icon name="check" size={30} /></span>
      <h2 id={idTieuDe} tabIndex={-1}>{tieuDe}</h2>
      {moTa ? <p className="phu">{moTa}</p> : null}
      {ma ? <div className={s.oMa}><span>{nhanMa}</span><b>{ma}</b></div> : null}
      {children}
    </div>
  );
}
