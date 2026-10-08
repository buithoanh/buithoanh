// Nhận hotline/zalo từ "Thông tin liên hệ" trong admin (truyền vào qua props).
export function telHref(hotline) {
  return hotline ? `tel:${hotline.replace(/[^\d+]/g, "")}` : undefined;
}

export function CallButton({ hotline, className = "btn btn-primary", label }) {
  const href = telHref(hotline);
  return (
    <a className={className} href={href} aria-disabled={href ? undefined : "true"}>
      {href ? label || `Gọi thợ ngay: ${hotline}` : "Hotline sắp có"}
    </a>
  );
}

export function ZaloButton({ zalo, className = "btn zalo" }) {
  return (
    <a className={className} href={zalo || undefined} aria-disabled={zalo ? undefined : "true"} target="_blank" rel="noopener">
      {zalo ? "Nhắn Zalo" : "Zalo sắp có"}
    </a>
  );
}
