import site from "../site.config.mjs";
import Icon from "./Icon";

export function telHref() {
  return site.hotline ? `tel:${site.hotline.replace(/[^\d+]/g, "")}` : undefined;
}

export function CallButton({ className = "btn btn-primary", label, short = false }) {
  const href = telHref();
  return (
    <a className={className} href={href} aria-disabled={href ? undefined : "true"}>
      <Icon name="phone" size={20} />
      <span>{href ? label || `Gọi thợ ngay ${site.hotline}` : short ? label : "Hotline sắp có"}</span>
    </a>
  );
}

export function ZaloButton({ className = "btn btn-zalo", label = "Nhắn Zalo", short = false }) {
  return (
    <a className={className} href={site.zalo || undefined} aria-disabled={site.zalo ? undefined : "true"} target="_blank" rel="noopener">
      <Icon name="chat" size={20} />
      <span>{site.zalo || short ? label : "Zalo sắp có"}</span>
    </a>
  );
}

/** Dải huy hiệu cam kết, kiểu Điện Máy Xanh: ngắn, có icon, đặt ngay cạnh nút hành động. */
export function Commitments({ variant = "grid" }) {
  return (
    <ul className={`commit commit-${variant}`}>
      {site.camKet.map((c) => (
        <li key={c.tieuDe}>
          <span className="commit-ic"><Icon name={c.icon} size={22} /></span>
          <span><b>{c.tieuDe}</b>{variant !== "compact" && <small>{c.moTa}</small>}</span>
        </li>
      ))}
    </ul>
  );
}
