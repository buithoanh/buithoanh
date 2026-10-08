// Hotline/Zalo lấy từ "Thông tin liên hệ" trong admin (truyền vào qua props, đọc bằng laySite()).
import Icon from "./Icon";

export function telHref(hotline) {
  return hotline ? `tel:${hotline.replace(/[^\d+]/g, "")}` : undefined;
}

// Khi chưa có hotline: nút vẫn hiện nhưng ghi "sắp có" và không bấm được.
export function CallButton({ hotline, className = "btn btn-primary", label, icon = true }) {
  const href = telHref(hotline);
  return (
    <a className={className} href={href} aria-disabled={href ? undefined : "true"}>
      {icon && <Icon name="phone" />}
      <span>{href ? label || `Gọi thợ ngay: ${hotline}` : "Hotline sắp có"}</span>
    </a>
  );
}

export function ZaloButton({ zalo, className = "btn btn-zalo", icon = true }) {
  return (
    <a className={className} href={zalo || undefined} aria-disabled={zalo ? undefined : "true"} target="_blank" rel="noopener">
      {icon && <Icon name="chat" />}
      <span>{zalo ? "Nhắn Zalo" : "Zalo sắp có"}</span>
    </a>
  );
}
