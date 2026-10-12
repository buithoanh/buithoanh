// Ảnh từ CMS (collection media) nếu có; chưa có thì hiện khung giữ chỗ gọn (không dùng ảnh mạng).
// anh: { url, alt, width, height } hoặc doc media của Payload.
import s from "./KhungAnh.module.css";

export default function KhungAnh({ anh, alt = "", tiLe = "16 / 9", nhan = "Ảnh thật đang cập nhật", uuTien = false, className = "" }) {
  if (anh?.url) {
    return (
      <img
        className={`${s.anh} ${className}`} src={anh.url} alt={anh.alt || alt} width={anh.width || 800} height={anh.height || 450}
        loading={uuTien ? "eager" : "lazy"} fetchPriority={uuTien ? "high" : undefined} decoding="async" style={{ aspectRatio: tiLe }}
      />
    );
  }
  return (
    <div className={`${s.khung} ${className}`} style={{ aspectRatio: tiLe }} role="img" aria-label={alt || nhan}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></svg>
      <span>{nhan}</span>
    </div>
  );
}
