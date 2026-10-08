import site from "../site.config.mjs";
import Icon from "./Icon";

export function telHref() {
  return site.hotline ? `tel:${site.hotline.replace(/[^\d+]/g, "")}` : undefined;
}

// Khi chưa có hotline: nút vẫn hiện nhưng ghi "sắp có" và không bấm được.
export function CallButton({ className = "btn btn-primary", label, icon = true }) {
  const href = telHref();
  return (
    <a className={className} href={href} aria-disabled={href ? undefined : "true"}>
      {icon && <Icon name="phone" />}
      <span>{href ? label || `Gọi thợ ngay: ${site.hotline}` : "Hotline sắp có"}</span>
    </a>
  );
}

export function ZaloButton({ className = "btn btn-zalo", icon = true }) {
  return (
    <a className={className} href={site.zalo || undefined} aria-disabled={site.zalo ? undefined : "true"} target="_blank" rel="noopener">
      {icon && <Icon name="chat" />}
      <span>{site.zalo ? "Nhắn Zalo" : "Zalo sắp có"}</span>
    </a>
  );
}
