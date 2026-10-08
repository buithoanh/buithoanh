"use client";
// Nút sao chép một giá trị (số tài khoản, nội dung chuyển khoản, mã, link). Báo "Đã chép" 2 giây, có vùng aria-live.
import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import s from "./NutSaoChep.module.css";

async function chep(chu) {
  try {
    await navigator.clipboard.writeText(chu);
    return true;
  } catch {
    // Trình duyệt cũ / không phải https: dùng ô tạm
    const o = document.createElement("textarea");
    o.value = chu;
    o.setAttribute("readonly", "");
    o.style.position = "fixed";
    o.style.opacity = "0";
    document.body.appendChild(o);
    o.select();
    const ok = document.execCommand("copy");
    o.remove();
    return ok;
  }
}

export default function NutSaoChep({ giaTri, nhan = "Sao chép", moTa, toi = false, className = "" }) {
  const [da, datDa] = useState(false);
  const hen = useRef(null);
  useEffect(() => () => clearTimeout(hen.current), []);
  return (
    <button
      type="button" className={`${s.nut} ${toi ? s.toi : ""} ${da ? s.da : ""} ${className}`} aria-label={moTa ? `${da ? "Đã chép" : nhan} ${moTa}` : undefined}
      onClick={async () => {
        if (await chep(String(giaTri))) {
          datDa(true);
          clearTimeout(hen.current);
          hen.current = setTimeout(() => datDa(false), 2000);
        }
      }}
    >
      <Icon name={da ? "check" : "sao-chep"} size={16} />
      <span aria-live="polite">{da ? "Đã chép" : nhan}</span>
    </button>
  );
}
