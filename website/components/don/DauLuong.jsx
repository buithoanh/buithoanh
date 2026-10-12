// Header gọn của luồng đơn (DatLich): nút quay lại (bước 2–4) hoặc nút đóng về trang chủ, tiêu đề, "Bước x/4"
// và thanh bước 4 đoạn. Không có header/footer chung của web (layout (don) không vẽ).
import Link from "next/link";
import Icon from "../Icon";
import ThanhBuoc from "./ThanhBuoc";
import s from "./DauLuong.module.css";

export default function DauLuong({ tieuDe, buoc, tongBuoc = 4, onQuayLai }) {
  return (
    <header className={s.dau}>
      <div className={s.hang}>
        {onQuayLai ? (
          <button type="button" className={s.nutIcon} aria-label="Quay lại bước trước" onClick={onQuayLai}>
            <Icon name="quay-lai" size={22} />
          </button>
        ) : (
          <Link href="/" className={s.nutIcon} aria-label="Đóng, về trang chủ">
            <Icon name="dong-x" size={22} />
          </Link>
        )}
        <b className={s.tieuDe}>{tieuDe}</b>
        {buoc ? <span className={s.buoc}>Bước {buoc}/{tongBuoc}</span> : null}
      </div>
      {buoc ? <ThanhBuoc buoc={buoc} tong={tongBuoc} /> : null}
    </header>
  );
}
