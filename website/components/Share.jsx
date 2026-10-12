"use client";
import { useState } from "react";
import Icon from "./Icon";

/** Chia sẻ bài: điện thoại mở bảng chia sẻ của máy (Zalo, Messenger...), máy tính chép link hoặc mở Facebook. */
export default function Share({ title, url }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* khách đóng bảng chia sẻ */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* trình duyệt chặn */ }
  }
  return (
    <div className="share">
      <button type="button" className="btn btn-soft btn-sm" onClick={share}><Icon name={copied ? "check" : "share"} size={18} />{copied ? "Đã chép link" : "Chia sẻ"}</button>
      <a className="btn btn-soft btn-sm" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener">Facebook</a>
    </div>
  );
}
