// 404 cho mọi đường dẫn không khớp trang nào. App có 2 layout gốc ((frontend) và (payload)) nên Next cần file này
// (bật experimental.globalNotFound trong next.config.mjs). File này không đi qua layout nào: tự nạp CSS, font, header, footer.
// Font tự chứa (gói @fontsource): không gọi Google Fonts khi khách mở trang. Mỗi file có đủ bộ chữ tiếng Việt, trình duyệt chỉ tải phần cần.
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "./(frontend)/globals.css";
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

export default function GlobalNotFound() {
  return (
    <html lang="vi">
      <body>
        <Loi404 khung />
        <TheoDoiSuKien />
      </body>
    </html>
  );
}
