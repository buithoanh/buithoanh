"use client";
// Nút "Chia sẻ qua Zalo": điện thoại có bảng chia sẻ của hệ điều hành (chọn Zalo trong đó);
// máy không có thì chép link để dán vào Zalo.
import { useState } from "react";
import Icon from "../Icon";

export default function ChiaSeMa({ link, loiMoi, className = "nut nut-zalo nut-lon nut-day" }) {
  const [bao, datBao] = useState("");
  async function chiaSe() {
    datBao("");
    if (navigator.share) {
      try {
        await navigator.share({ text: loiMoi, url: link });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${loiMoi} ${link}`);
      datBao("Đã chép lời mời kèm link. Mở Zalo, dán vào tin nhắn gửi bạn bè.");
    } catch {
      datBao("Chép link ở ô phía trên rồi dán vào Zalo nhé.");
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={chiaSe}><Icon name="chat" /> Chia sẻ qua Zalo</button>
      <span role="status" aria-live="polite" className="phu nho">{bao}</span>
    </>
  );
}
