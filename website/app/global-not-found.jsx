// 404 cho mọi đường dẫn không khớp trang nào. App có 2 layout gốc ((frontend) và (payload)) nên Next cần file này
// (bật experimental.globalNotFound trong next.config.mjs). File này không đi qua layout nào: tự nạp CSS, font, header, footer.
import "./(frontend)/globals.css";
import { connection } from "next/server";
import site from "@/site.config.mjs";
import Loi404 from "@/components/trang/Loi404";
import TheoDoiSuKien from "@/components/chung/TheoDoiSuKien";

export const metadata = {
  metadataBase: new URL(site.url),
  title: `Không tìm thấy trang | ${site.name}`,
  description: `Trang bạn tìm không còn ở đây. Gọi thợ ${site.name}, đặt lịch hoặc xem bảng giá.`,
  robots: { index: false, follow: true },
  icons: { icon: "/favicon.svg" },
};

export default async function GlobalNotFound() {
  // Render lúc có request (đọc hotline, dịch vụ từ CMS), không dựng sẵn lúc build: build trong Docker không có database.
  await connection();
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" />
      </head>
      <body>
        <Loi404 khung />
        <TheoDoiSuKien />
      </body>
    </html>
  );
}
