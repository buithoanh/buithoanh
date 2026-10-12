"use client";
// Đăng xuất phiên Payload rồi về trang đăng nhập CMS.
import { useState } from "react";

export default function NutDangXuat({ className }) {
  const [dang, setDang] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={dang}
      onClick={async () => {
        setDang(true);
        try {
          await fetch("/api/users/logout", { method: "POST", credentials: "same-origin" });
        } finally {
          window.location.href = "/admin/login";
        }
      }}
    >
      {dang ? "Đang thoát…" : "Đăng xuất"}
    </button>
  );
}
