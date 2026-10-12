"use client";
// Ô nhập số tiền: hiện "170.000" khi không gõ, cho gõ tự do ("170000", "170.000đ"), báo số mới lên ngay khi đọc được.
import { useState } from "react";
import { docSoTien } from "./api";

const hien = (v, mienPhi) => (v == null ? "" : mienPhi && v === 0 ? "Miễn phí" : Number(v).toLocaleString("vi-VN"));

export default function OTien({ value, onChange, mienPhi = false, className, ...rest }) {
  const [chu, setChu] = useState(null); // null = đang không gõ
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={className}
      value={chu ?? hien(value, mienPhi)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setChu(e.target.value);
        const n = docSoTien(e.target.value);
        if (n != null) onChange?.(n);
      }}
      onBlur={() => setChu(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      {...rest}
    />
  );
}
