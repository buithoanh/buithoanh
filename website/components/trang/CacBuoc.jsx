// "Gọi thợ thế nào": 4 bước từ lúc gọi tới lúc nhận hoá đơn (chữ tĩnh theo thiết kế Main / TrangChuMayTinh).
import s from "./CacBuoc.module.css";

const BUOC = [
  { t: "Gọi hoặc đặt lịch", d: "Cho biết xe, vị trí, tình trạng. Mất khoảng 90 giây." },
  { t: "Xem giá sơ bộ", d: "Biết khoảng giá ngay trên web trước khi gửi." },
  { t: "Thợ tới, báo giá chính thức", d: "Bạn duyệt từng hạng mục trên điện thoại rồi mới sửa." },
  { t: "Thanh toán, nhận hoá đơn", d: "Quét VietQR, hoá đơn điện tử gửi qua Zalo." },
];

export default function CacBuoc({ tieuDe = "Gọi thợ thế nào", id = "cach-goi-tho", buoc = BUOC, className = "" }) {
  return (
    <section className={`khoi ${className}`} aria-labelledby={id}>
      <h2 id={id}>{tieuDe}</h2>
      <ol className={s.ds}>
        {buoc.map((b, i) => (
          <li key={b.t} className={s.buoc}>
            <span className={s.so} aria-hidden="true">{i + 1}</span>
            <div className={s.chu}><b>{b.t}</b><span>{b.d}</span></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
