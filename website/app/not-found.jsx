import Link from "next/link";
import Icon from "../components/Icon";

export default function NotFound() {
  return (
    <section className="block">
      <div className="wrap nf">
        <span className="nf-ic"><Icon name="pin" size={40} /></span>
        <h1>Không tìm thấy trang này</h1>
        <p className="sub">Đường dẫn có thể đã đổi. Nhưng xe bạn ở đâu, thợ vẫn tới đó.</p>
        <div className="ctas"><Link className="btn btn-primary" href="/">Về trang chủ</Link><Link className="btn btn-soft" href="/dat-lich/">Đặt lịch thợ</Link></div>
      </div>
    </section>
  );
}
