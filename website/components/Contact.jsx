import site from "../site.config.mjs";

export function telHref() {
  return site.hotline ? `tel:${site.hotline.replace(/[^\d+]/g, "")}` : undefined;
}

export function CallButton({ className = "btn btn-primary", label }) {
  const href = telHref();
  return (
    <a className={className} href={href} aria-disabled={href ? undefined : "true"}>
      {href ? label || `Gọi thợ ngay: ${site.hotline}` : "Hotline sắp có"}
    </a>
  );
}

export function ZaloButton({ className = "btn zalo" }) {
  return (
    <a className={className} href={site.zalo || undefined} aria-disabled={site.zalo ? undefined : "true"} target="_blank" rel="noopener">
      {site.zalo ? "Nhắn Zalo" : "Zalo sắp có"}
    </a>
  );
}
