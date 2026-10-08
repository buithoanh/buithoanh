// Nút gọi hotline và nhắn Zalo. Số và link lấy từ Cấu hình chung (layChung()). Cú bấm được ghi số liệu
// tự động (components/chung/TheoDoiSuKien.jsx bắt mọi link tel: và zalo.me).
import Icon from "../Icon";
import { telHref } from "../../lib/giao-dien";

/** Chưa có hotline: nút vẫn hiện nhưng ghi "Hotline sắp có" và không bấm được. */
export function NutGoi({ hotline, className = "nut nut-chinh", children, icon = true }) {
  const href = telHref(hotline);
  return (
    <a className={className} href={href} aria-disabled={href ? undefined : "true"}>
      {icon && <Icon name="phone" />}
      <span>{href ? children || `Gọi ${hotline}` : "Hotline sắp có"}</span>
    </a>
  );
}

export function NutZalo({ zalo, className = "nut nut-zalo", children = "Zalo", icon = true }) {
  return (
    <a className={className} href={zalo || undefined} aria-disabled={zalo ? undefined : "true"} target="_blank" rel="noopener">
      {icon && <Icon name="chat" />}
      <span>{zalo ? children : "Zalo sắp có"}</span>
    </a>
  );
}
