// Header màn gọi gấp: nút đóng về trang chủ, tiêu đề + thương hiệu, nhãn KHẨN CẤP, nút gọi hotline.
import Link from "next/link";
import Icon from "../Icon";
import { telHref } from "./goi-api";
import s from "./DauKhanCap.module.css";

export default function DauKhanCap({ tieuDe = "Gọi thợ gấp", phu, hotline, tieuDeLaH1 = false }) {
  const Tde = tieuDeLaH1 ? "h1" : "b";
  const tel = telHref(hotline);
  return (
    <header className={s.dau}>
      <Link href="/" className={s.nutIcon} aria-label="Đóng, về trang chủ"><Icon name="dong-x" size={22} /></Link>
      <div className={s.giua}>
        <Tde className={s.tieuDe}>{tieuDe}</Tde>
        {phu ? <span className={s.phu}>{phu}</span> : null}
      </div>
      <span className={s.khan}><span className={s.cham} aria-hidden="true" />KHẨN CẤP</span>
      {tel ? <a href={tel} className={`${s.nutIcon} ${s.goi}`} aria-label={`Gọi hotline ${hotline}`}><Icon name="phone" size={20} /></a> : null}
    </header>
  );
}
