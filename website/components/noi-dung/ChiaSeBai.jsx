"use client";
// Chia sẻ bài cẩm nang: điện thoại mở bảng chia sẻ của hệ điều hành (chọn Zalo, Messenger… trong đó);
// máy không có thì chép link. Thêm nút Facebook cho máy tính.
import { useState } from "react";
import Icon from "../Icon";
import s from "./ChiaSeBai.module.css";

export default function ChiaSeBai({ tieuDe, link }) {
  const [bao, datBao] = useState("");
  async function chiaSe() {
    datBao("");
    if (navigator.share) {
      try {
        await navigator.share({ title: tieuDe, url: link });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      datBao("Đã chép link bài. Dán vào Zalo hoặc tin nhắn để gửi.");
    } catch {
      datBao("Chép link trên thanh địa chỉ để gửi nhé.");
    }
  }
  return (
    <div className={s.khung}>
      <button type="button" className={`nut nut-trang ${s.nut}`} onClick={chiaSe}><Icon name="chat" size={18} /> Chia sẻ bài</button>
      <a className={`nut nut-trang ${s.nut}`} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener">Facebook</a>
      <span role="status" aria-live="polite" className={`phu ${s.bao}`}>{bao}</span>
    </div>
  );
}
