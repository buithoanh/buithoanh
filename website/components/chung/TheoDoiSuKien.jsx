"use client";
// Gắn một lần trong layout: ghi xem trang mỗi lần đổi đường dẫn, bắt mọi cú bấm vào link gọi (tel:) và Zalo,
// lưu nguồn khách (utm, ?ma=) và báo lượt mở link giới thiệu.
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ghiNhanNguon, ghiSuKien } from "../../lib/su-kien-client";

export default function TheoDoiSuKien() {
  const duongDan = usePathname();

  useEffect(() => {
    const ma = ghiNhanNguon();
    if (ma) {
      fetch("/api/gioi-thieu/mo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ma }) }).catch(() => {});
    }
    ghiSuKien("xemTrang");
  }, [duongDan]);

  useEffect(() => {
    const bam = (e) => {
      const a = e.target.closest?.("a[href], [data-su-kien]");
      if (!a) return;
      const loai = a.getAttribute("data-su-kien");
      if (loai) return ghiSuKien(loai);
      const href = a.getAttribute("href") || "";
      if (href.startsWith("tel:")) ghiSuKien("bamGoi");
      else if (/zalo\.me|zalo\.vn/.test(href)) ghiSuKien("bamZalo");
    };
    document.addEventListener("click", bam, { capture: true });
    return () => document.removeEventListener("click", bam, { capture: true });
  }, []);

  return null;
}
