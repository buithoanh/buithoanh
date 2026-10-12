// Luồng đơn hàng (đặt lịch, gọi gấp, link riêng của khách): giao diện điện thoại, máy tính thì canh giữa.
// Mỗi màn tự vẽ header gọn của nó (components/chung/DauDon.jsx hoặc header riêng), không có footer to.
import site from "@/site.config.mjs";
import s from "./layout.module.css";

export default function LayoutDon({ children }) {
  return (
    <div className={s.nen}>
      {!site.allowIndex && <div className="thanh-thu">Bản chạy thử trước khi có tên miền chính thức.</div>}
      <main id="noi-dung" tabIndex={-1} className={s.khung}>{children}</main>
    </div>
  );
}
